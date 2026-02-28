import {
  Inject,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { SelectQueryBuilder, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CatalogItem } from './entities/catalog-item.entity';
import { TenantProductCategory } from './entities/tenant-product-category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSource } from 'src/common/enums/product-source.enum';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { AddProductFromCatalogDto } from './dto/add-product-from-catalog.dto';
import { ImageProcessorService } from 'src/common/services/image-processor.service';
import { DbTenantContext } from 'src/common/contexts/db-tenant.context';
import { ProductOrderMode } from 'src/common/enums/product-order-mode.enum';

const DEFAULT_PRODUCT_CATEGORY = 'أخرى';
const DUPLICATE_PRODUCT_NAME_MESSAGE = 'Product with this name already exists';
const PRODUCT_SEARCH_CACHE_TTL_SECONDS = 60;
const DEFAULT_WEIGHT_PRESET_GRAMS = [250, 500, 1000] as const;
const DEFAULT_PRICE_PRESET_AMOUNTS = [100, 200, 300] as const;
const DEFAULT_QUANTITY_UNIT_LABEL = 'قطعة';
const MAX_ORDER_PRESETS = 6;

type QuantityUnitOptionConfig = {
  id: string;
  label: string;
  multiplier: number;
};

type ProductOrderConfig = {
  quantity?: {
    unit_label?: string;
    unit_options?: QuantityUnitOptionConfig[];
  };
  weight?: {
    preset_grams: number[];
    allow_custom_grams: boolean;
  };
  price?: {
    preset_amounts_egp: number[];
    allow_custom_amount: boolean;
  };
};

type PublicProductsResult = {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    last_page: number;
    has_next: boolean;
  };
};

type PublicProductCategorySummary = {
  category: string;
  count: number;
  image_url?: string;
};

type TenantProductsSearchResult = {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    last_page: number;
    has_next: boolean;
  };
};

type TenantProductsSearchOptions = {
  rankAll?: boolean;
  excludeProductIds?: number[];
};

type StrictMatchThresholds = {
  strictSimilarityThreshold: number;
  strictWordSimilarityThreshold: number;
};

/**
 * Products service handles product lifecycle for each tenant.
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(CatalogItem)
    private readonly catalogItemsRepository: Repository<CatalogItem>,
    @InjectRepository(TenantProductCategory)
    private readonly tenantProductCategoriesRepository: Repository<TenantProductCategory>,
    private readonly imageProcessorService: ImageProcessorService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a manual product for the authenticated tenant.
   */
  async create(
    tenantId: number,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    const normalizedName = createProductDto.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Product name is required');
    }

    await this.ensureUniqueActiveProductName(tenantId, normalizedName);

    const orderMode = this.resolveProductOrderMode(createProductDto.order_mode);
    const orderConfig = this.normalizeProductOrderConfig(
      orderMode,
      createProductDto.order_config,
    );

    const product = this.getProductsRepository().create({
      tenant_id: tenantId,
      name: normalizedName,
      image_url: createProductDto.image_url,
      category: this.normalizeCategory(createProductDto.category),
      source: ProductSource.MANUAL,
      status: ProductStatus.ACTIVE,
      current_price:
        typeof createProductDto.current_price === 'number'
          ? this.normalizeCurrentPrice(createProductDto.current_price)
          : undefined,
      order_mode: orderMode,
      order_config: orderConfig,
      is_available: createProductDto.is_available ?? true,
    });

    const saved = await this.getProductsRepository().save(product);
    await this.storeTenantProductCategory(tenantId, saved.category);
    await this.bumpTenantSearchCacheVersion(tenantId);
    return saved;
  }

  /**
   * Creates a product by copying data from a catalog item.
   */
  async createFromCatalog(
    tenantId: number,
    payload: AddProductFromCatalogDto,
  ): Promise<Product> {
    const catalogItem = await this.getCatalogItemsRepository().findOne({
      where: { id: payload.catalog_item_id, is_active: true },
    });

    if (!catalogItem) {
      throw new NotFoundException(
        `Catalog item with ID ${payload.catalog_item_id} not found`,
      );
    }

    const catalogCategory = catalogItem.category?.trim();
    if (!catalogCategory) {
      throw new BadRequestException(
        `Catalog item with ID ${payload.catalog_item_id} has invalid category`,
      );
    }

    await this.ensureUniqueActiveProductName(tenantId, catalogItem.name);

    const product = this.getProductsRepository().create({
      tenant_id: tenantId,
      name: catalogItem.name,
      image_url: catalogItem.image_url,
      category: catalogCategory,
      source: ProductSource.CATALOG,
      status: ProductStatus.ACTIVE,
      order_mode: ProductOrderMode.QUANTITY,
      order_config: this.normalizeProductOrderConfig(ProductOrderMode.QUANTITY),
      is_available: true,
    });

    const saved = await this.getProductsRepository().save(product);
    await this.storeTenantProductCategory(tenantId, saved.category);
    await this.bumpTenantSearchCacheVersion(tenantId);
    return saved;
  }

  /**
   * Returns all active products for the authenticated tenant.
   */
  async findAll(tenantId: number): Promise<Product[]> {
    return this.getProductsRepository().find({
      where: {
        tenant_id: tenantId,
        status: ProductStatus.ACTIVE,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Returns active products for tenant filtered by text search.
   */
  async searchTenantProducts(
    tenantId: number,
    search: string,
    category?: string,
    page = 1,
    limit = 20,
    options?: TenantProductsSearchOptions,
  ): Promise<TenantProductsSearchResult> {
    const normalizedSearch = this.normalizeSearchTerm(search);
    if (normalizedSearch.length < 2) {
      throw new BadRequestException(
        'Search term must be at least 2 characters',
      );
    }

    const normalizedPage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const normalizedLimit = Number.isFinite(limit)
      ? Math.min(50, Math.max(1, limit))
      : 20;
    const normalizedCategory = this.normalizeOptionalCategory(category);
    const rankAll = options?.rankAll ?? false;
    const normalizedExcludedProductIds = this.normalizeExcludedProductIds(
      options?.excludeProductIds,
    );
    const similarityThreshold =
      this.resolveSimilarityThreshold(normalizedSearch);
    const strictMatchThresholds =
      this.resolveStrictMatchThresholds(normalizedSearch);

    const searchVersion = await this.getTenantSearchCacheVersion(tenantId);
    const cacheKey = this.buildTenantSearchCacheKey(
      tenantId,
      normalizedSearch,
      normalizedCategory,
      similarityThreshold,
      strictMatchThresholds,
      rankAll,
      normalizedExcludedProductIds,
      normalizedPage,
      normalizedLimit,
      searchVersion,
    );

    const cached =
      await this.cacheManager.get<TenantProductsSearchResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.searchWithinTenantProducts(
      tenantId,
      normalizedSearch,
      normalizedCategory,
      similarityThreshold,
      strictMatchThresholds,
      rankAll,
      normalizedExcludedProductIds,
      normalizedPage,
      normalizedLimit,
    );

    await this.cacheManager.set(
      cacheKey,
      result,
      PRODUCT_SEARCH_CACHE_TTL_SECONDS,
    );

    return result;
  }

  /**
   * Returns public active products for tenant slug filtered by text search.
   */
  async searchPublicProducts(
    slug: string,
    search: string,
    category?: string,
    page = 1,
    limit = 20,
  ): Promise<PublicProductsResult> {
    const normalizedSearch = this.normalizeSearchTerm(search);
    if (normalizedSearch.length < 2) {
      throw new BadRequestException(
        'Search term must be at least 2 characters',
      );
    }

    const normalizedPage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const normalizedLimit = Number.isFinite(limit)
      ? Math.min(50, Math.max(1, limit))
      : 20;
    const normalizedCategory = this.normalizeOptionalCategory(category);
    const similarityThreshold =
      this.resolveSimilarityThreshold(normalizedSearch);
    const strictMatchThresholds =
      this.resolveStrictMatchThresholds(normalizedSearch);

    return this.searchWithinPublicProducts(
      slug,
      normalizedSearch,
      normalizedCategory,
      similarityThreshold,
      strictMatchThresholds,
      normalizedPage,
      normalizedLimit,
    );
  }

  /**
   * Returns all active products by public tenant slug.
   */
  async findAllByTenantSlug(
    slug: string,
    page = 1,
    limit = 20,
    category?: string,
  ): Promise<PublicProductsResult> {
    const normalizedPage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const normalizedLimit = Number.isFinite(limit)
      ? Math.min(50, Math.max(1, limit))
      : 20;
    const normalizedCategory = category?.trim();

    const query = this.getProductsRepository()
      .createQueryBuilder('product')
      .innerJoin('product.tenant', 'tenant')
      .where('tenant.slug = :slug', { slug })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE });

    if (normalizedCategory) {
      query.andWhere('product.category = :category', {
        category: normalizedCategory,
      });
    }

    query
      .orderBy('product.created_at', 'DESC')
      .addOrderBy('product.id', 'DESC')
      .skip((normalizedPage - 1) * normalizedLimit)
      .take(normalizedLimit);

    const [data, total] = await query.getManyAndCount();
    const lastPage = total > 0 ? Math.ceil(total / normalizedLimit) : 1;

    return {
      data,
      meta: {
        total,
        page: normalizedPage,
        limit: normalizedLimit,
        last_page: lastPage,
        has_next: normalizedPage < lastPage,
      },
    };
  }

  /**
   * Returns category summaries for a public tenant storefront.
   */
  async findPublicCategoriesByTenantSlug(
    slug: string,
  ): Promise<PublicProductCategorySummary[]> {
    const normalizedCategoryExpression = `COALESCE(NULLIF(TRIM(product.category), ''), '${DEFAULT_PRODUCT_CATEGORY}')`;

    const categoryRows = await this.getProductsRepository()
      .createQueryBuilder('product')
      .innerJoin('product.tenant', 'tenant')
      .select(normalizedCategoryExpression, 'category')
      .addSelect('COUNT(product.id)', 'count')
      .where('tenant.slug = :slug', { slug })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .groupBy(normalizedCategoryExpression)
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string; count: string }>();

    if (categoryRows.length === 0) {
      return [];
    }

    const categories = categoryRows.map((row) => row.category);

    const catalogRows = await this.getCatalogItemsRepository()
      .createQueryBuilder('catalog')
      .select('catalog.category', 'category')
      .addSelect('catalog.image_url', 'image_url')
      .where('catalog.is_active = :isActive', { isActive: true })
      .andWhere('catalog.category IN (:...categories)', { categories })
      .andWhere('catalog.image_url IS NOT NULL')
      .andWhere("TRIM(catalog.image_url) <> ''")
      .orderBy('catalog.category', 'ASC')
      .addOrderBy('catalog.name', 'ASC')
      .getRawMany<{ category: string; image_url: string }>();

    const categoryImages = new Map<string, string>();
    for (const row of catalogRows) {
      if (!categoryImages.has(row.category)) {
        categoryImages.set(row.category, row.image_url);
      }
    }

    return categoryRows.map((row) => ({
      category: row.category,
      count: Number(row.count),
      image_url: categoryImages.get(row.category),
    }));
  }

  /**
   * Returns active catalog categories for product onboarding.
   */
  async findCatalogCategories(): Promise<string[]> {
    const rows = await this.getCatalogItemsRepository()
      .createQueryBuilder('catalog')
      .select('DISTINCT catalog.category', 'category')
      .where('catalog.is_active = :isActive', { isActive: true })
      .orderBy('catalog.category', 'ASC')
      .getRawMany<{ category: string }>();

    return rows.map((row) => row.category);
  }

  /**
   * Returns merged catalog + tenant categories for merchant onboarding.
   */
  async findTenantProductCategories(tenantId: number): Promise<string[]> {
    const [catalogRows, tenantRows] = await Promise.all([
      this.getCatalogItemsRepository()
        .createQueryBuilder('catalog')
        .select('DISTINCT catalog.category', 'category')
        .where('catalog.is_active = :isActive', { isActive: true })
        .getRawMany<{ category: string }>(),
      this.getTenantProductCategoriesRepository()
        .createQueryBuilder('tenantCategory')
        .select('tenantCategory.name', 'category')
        .where('tenantCategory.tenant_id = :tenantId', { tenantId })
        .getRawMany<{ category: string }>(),
    ]);

    const uniqueCategories = new Set<string>();
    for (const row of [...catalogRows, ...tenantRows]) {
      const normalizedCategory = this.normalizeOptionalCategory(row.category);
      if (!normalizedCategory) {
        continue;
      }

      uniqueCategories.add(normalizedCategory);
    }

    return Array.from(uniqueCategories).sort((left, right) =>
      left.localeCompare(right, 'ar'),
    );
  }

  /**
   * Returns active catalog items, optionally filtered by category.
   */
  async findCatalogItems(category?: string): Promise<CatalogItem[]> {
    const where = category
      ? { is_active: true, category }
      : { is_active: true };

    return this.getCatalogItemsRepository().find({
      where,
      order: {
        category: 'ASC',
        name: 'ASC',
      },
    });
  }

  /**
   * Returns a single product owned by tenant.
   */
  async findOne(id: number, tenantId: number): Promise<Product> {
    const product = await this.getProductsRepository().findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Updates product fields for tenant-owned product.
   */
  async update(
    id: number,
    tenantId: number,
    updateProductDto: UpdateProductDto,
    file?: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.findOne(id, tenantId);

    const previousImageUrl = product.image_url;

    if (typeof updateProductDto.name === 'string') {
      const normalizedName = updateProductDto.name.trim();
      if (!normalizedName) {
        throw new BadRequestException('Product name is required');
      }

      await this.ensureUniqueActiveProductName(tenantId, normalizedName, id);
      product.name = normalizedName;
    }

    if (updateProductDto.status) {
      product.status = updateProductDto.status;
    }

    if (updateProductDto.is_available !== undefined) {
      product.is_available = updateProductDto.is_available;
    }

    if (typeof updateProductDto.category === 'string') {
      product.category = this.normalizeCategory(updateProductDto.category);
    }

    if (typeof updateProductDto.current_price === 'number') {
      product.current_price = this.normalizeCurrentPrice(
        updateProductDto.current_price,
      );
    }

    if (
      updateProductDto.order_mode !== undefined ||
      updateProductDto.order_config !== undefined
    ) {
      const nextOrderMode = this.resolveProductOrderMode(
        updateProductDto.order_mode ?? product.order_mode,
      );
      product.order_mode = nextOrderMode;
      product.order_config = this.normalizeProductOrderConfig(
        nextOrderMode,
        updateProductDto.order_config ?? product.order_config ?? undefined,
      );
    }

    if (file?.path) {
      product.image_url =
        await this.imageProcessorService.processProductThumbnail(file.path);
    } else if (typeof updateProductDto.image_url === 'string') {
      const normalizedImageUrl = updateProductDto.image_url.trim();
      product.image_url = normalizedImageUrl || undefined;
    }

    const updatedProduct = await this.getProductsRepository().save(product);
    if (typeof updateProductDto.category === 'string') {
      await this.storeTenantProductCategory(tenantId, updatedProduct.category);
    }
    await this.bumpTenantSearchCacheVersion(tenantId);

    if (previousImageUrl && previousImageUrl !== updatedProduct.image_url) {
      await this.imageProcessorService.deleteManagedProductImage(
        previousImageUrl,
      );
    }

    return updatedProduct;
  }

  /**
   * Soft archives a product so historical order records stay intact.
   */
  async remove(id: number, tenantId: number): Promise<void> {
    const product = await this.findOne(id, tenantId);
    product.status = ProductStatus.ARCHIVED;
    await this.getProductsRepository().save(product);
    await this.bumpTenantSearchCacheVersion(tenantId);
  }

  private async searchWithinTenantProducts(
    tenantId: number,
    normalizedSearch: string,
    category: string | undefined,
    similarityThreshold: number,
    strictMatchThresholds: StrictMatchThresholds,
    rankAll: boolean,
    excludedProductIds: number[],
    page: number,
    limit: number,
  ): Promise<TenantProductsSearchResult> {
    const query = this.getProductsRepository()
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE });

    // When rankAll=true, category is a hard filter (suggested similar products).
    // When rankAll=false (text search), category is a ranking boost instead.
    const useCategoryAsFilter = rankAll && !!category;
    const useCategoryAsBoost = !rankAll && !!category;

    if (useCategoryAsFilter) {
      query.andWhere('product.category = :category', { category });
    }

    if (excludedProductIds.length > 0) {
      query.andWhere('product.id NOT IN (:...excludedProductIds)', {
        excludedProductIds,
      });
    }

    this.applySimilarityRanking(
      query,
      normalizedSearch,
      similarityThreshold,
      strictMatchThresholds,
      rankAll,
      useCategoryAsBoost ? category : undefined,
    );

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return this.buildSearchResult(data, total, page, limit);
  }

  private async searchWithinPublicProducts(
    slug: string,
    normalizedSearch: string,
    category: string | undefined,
    similarityThreshold: number,
    strictMatchThresholds: StrictMatchThresholds,
    page: number,
    limit: number,
  ): Promise<PublicProductsResult> {
    const query = this.getProductsRepository()
      .createQueryBuilder('product')
      .innerJoin('product.tenant', 'tenant')
      .where('tenant.slug = :slug', { slug })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE });

    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    this.applySimilarityRanking(
      query,
      normalizedSearch,
      similarityThreshold,
      strictMatchThresholds,
    );

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return this.buildSearchResult(data, total, page, limit);
  }

  private applySimilarityRanking(
    query: SelectQueryBuilder<Product>,
    normalizedSearch: string,
    similarityThreshold: number,
    strictMatchThresholds: StrictMatchThresholds,
    rankAll = false,
    boostCategory?: string,
  ): void {
    const comparableNameSql =
      this.buildComparableProductNameExpression('product.name');
    const prefixPattern = `${normalizedSearch}%`;
    const containsPattern = `%${normalizedSearch}%`;

    query
      .setParameter('normalizedSearch', normalizedSearch)
      .setParameter('prefixPattern', prefixPattern)
      .setParameter('containsPattern', containsPattern)
      .setParameter('similarityThreshold', similarityThreshold)
      .setParameter(
        'strictSimilarityThreshold',
        strictMatchThresholds.strictSimilarityThreshold,
      )
      .setParameter(
        'strictWordSimilarityThreshold',
        strictMatchThresholds.strictWordSimilarityThreshold,
      )
      .addSelect(
        `similarity(${comparableNameSql}, :normalizedSearch)`,
        'name_similarity',
      )
      .addSelect(
        `word_similarity(${comparableNameSql}, :normalizedSearch)`,
        'word_sim',
      )
      .addSelect(
        `CASE WHEN ${comparableNameSql} LIKE :prefixPattern THEN 1 ELSE 0 END`,
        'prefix_score',
      )
      .addSelect(
        `CASE WHEN ${comparableNameSql} LIKE :containsPattern THEN 1 ELSE 0 END`,
        'contains_score',
      );

    // Category boost: add +0.10 to search_rank for products matching the boost category
    if (boostCategory) {
      query
        .setParameter('boostCategory', boostCategory)
        .addSelect(
          `(word_similarity(${comparableNameSql}, :normalizedSearch) * 0.50) + (similarity(${comparableNameSql}, :normalizedSearch) * 0.25) + (CASE WHEN ${comparableNameSql} LIKE :prefixPattern THEN 1 ELSE 0 END) * 0.15 + (CASE WHEN product.category = :boostCategory THEN 0.10 ELSE 0 END)`,
          'search_rank',
        );
    } else {
      query.addSelect(
        `(word_similarity(${comparableNameSql}, :normalizedSearch) * 0.55) + (similarity(${comparableNameSql}, :normalizedSearch) * 0.30) + (CASE WHEN ${comparableNameSql} LIKE :prefixPattern THEN 1 ELSE 0 END) * 0.15`,
        'search_rank',
      );
    }

    if (!rankAll) {
      query.andWhere(
        `(
          ${comparableNameSql} LIKE :prefixPattern
          OR ${comparableNameSql} LIKE :containsPattern
          OR (
            similarity(${comparableNameSql}, :normalizedSearch) >= :strictSimilarityThreshold
            AND word_similarity(${comparableNameSql}, :normalizedSearch) >= :strictWordSimilarityThreshold
          )
        )`,
      );
    }

    query
      .orderBy('search_rank', 'DESC')
      .addOrderBy('word_sim', 'DESC')
      .addOrderBy('name_similarity', 'DESC')
      .addOrderBy('contains_score', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('product.id', 'DESC');
  }

  private buildSearchResult(
    data: Product[],
    total: number,
    page: number,
    limit: number,
  ): TenantProductsSearchResult {
    const lastPage = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        last_page: lastPage,
        has_next: page < lastPage,
      },
    };
  }

  private normalizeCategory(category?: string): string {
    const normalizedCategory = category?.trim();
    if (!normalizedCategory) {
      return DEFAULT_PRODUCT_CATEGORY;
    }

    return normalizedCategory.slice(0, 64);
  }

  /**
   * Enforces tenant-level uniqueness for active products using normalized names.
   */
  private async ensureUniqueActiveProductName(
    tenantId: number,
    name: string,
    excludedProductId?: number,
  ): Promise<void> {
    const normalizedName = this.normalizeProductName(name);
    if (!normalizedName) {
      return;
    }

    const query = this.getProductsRepository()
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere(
        "LOWER(REGEXP_REPLACE(TRIM(product.name), '\\s+', ' ', 'g')) = :normalizedName",
        { normalizedName },
      );

    if (excludedProductId) {
      query.andWhere('product.id != :excludedProductId', {
        excludedProductId,
      });
    }

    const duplicateCount = await query.getCount();
    if (duplicateCount > 0) {
      throw new ConflictException(DUPLICATE_PRODUCT_NAME_MESSAGE);
    }
  }

  private normalizeProductName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private normalizeSearchTerm(search: string): string {
    return this.normalizeArabic(search);
  }

  private resolveSimilarityThreshold(normalizedSearch: string): number {
    const length = normalizedSearch.length;
    if (length <= 3) {
      return 0.08;
    }

    if (length <= 5) {
      return 0.14;
    }

    return 0.22;
  }

  private resolveStrictMatchThresholds(
    normalizedSearch: string,
  ): StrictMatchThresholds {
    const length = normalizedSearch.length;
    if (length <= 3) {
      return {
        strictSimilarityThreshold: 0.32,
        strictWordSimilarityThreshold: 0.58,
      };
    }

    if (length <= 5) {
      return {
        strictSimilarityThreshold: 0.28,
        strictWordSimilarityThreshold: 0.5,
      };
    }

    return {
      strictSimilarityThreshold: 0.24,
      strictWordSimilarityThreshold: 0.42,
    };
  }

  private normalizeOptionalCategory(category?: string): string | undefined {
    const normalizedCategory = category?.trim();
    if (!normalizedCategory) {
      return undefined;
    }

    return normalizedCategory.slice(0, 64);
  }

  private normalizeArabic(input: string): string {
    return (
      input
        .toLowerCase()
        // Strip Arabic diacritics (tashkeel/harakat)
        .replace(
          /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g,
          '',
        )
        .replace(/[أإآ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        // eslint-disable-next-line sonarjs/slow-regex -- false positive: negated char class [^)]* is O(n)
        .replace(/\([^)]*\)/g, ' ')
        // eslint-disable-next-line sonarjs/slow-regex
        .replace(/\d+\s*(?:جم|جرام|كجم|كيلو|ك|g|kg)/gi, ' ')
        .replace(/(?:جم|جرام|كجم|كيلو|ك|g|kg)\s*\d+/gi, ' ')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        // Strip Arabic definite article "ال" at word boundaries
        .replace(/\bال/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  private buildComparableProductNameExpression(columnName: string): string {
    return `
      BTRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(
                    REGEXP_REPLACE(
                      REGEXP_REPLACE(
                        LOWER(${columnName}),
                        '[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]',
                        '',
                        'g'
                      ),
                      '[أإآ]',
                      'ا',
                      'g'
                    ),
                    'ى',
                    'ي',
                    'g'
                  ),
                  'ة',
                  'ه',
                  'g'
                ),
                '\\\\([^\\\\)]*\\\\)',
                ' ',
                'g'
              ),
              '(\\\\m\\\\d+\\\\s*(جم|جرام|كجم|كيلو|ك|g|kg)\\\\M)|(\\\\m(جم|جرام|كجم|كيلو|ك|g|kg)\\\\s*\\\\d+\\\\M)',
              ' ',
              'gi'
            ),
            '\\mال',
            '',
            'g'
          ),
          '\\\\s+',
          ' ',
          'g'
        )
      )
    `;
  }

  private normalizeCurrentPrice(price: number): number {
    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestException('Product price must be a positive number');
    }

    return Number(price.toFixed(2));
  }

  private resolveProductOrderMode(mode?: ProductOrderMode): ProductOrderMode {
    if (!mode) {
      return ProductOrderMode.QUANTITY;
    }

    return mode;
  }

  private normalizeProductOrderConfig(
    mode: ProductOrderMode,
    rawConfig?: unknown,
  ): ProductOrderConfig {
    const config =
      rawConfig && typeof rawConfig === 'object'
        ? (rawConfig as Record<string, unknown>)
        : {};

    switch (mode) {
      case ProductOrderMode.WEIGHT:
        return this.normalizeWeightOrderConfig(config.weight);
      case ProductOrderMode.PRICE:
        return this.normalizePriceOrderConfig(config.price);
      case ProductOrderMode.QUANTITY:
      default:
        return this.normalizeQuantityOrderConfig(config.quantity);
    }
  }

  private normalizeQuantityOrderConfig(rawValue: unknown): ProductOrderConfig {
    const quantityConfig =
      rawValue && typeof rawValue === 'object'
        ? (rawValue as Record<string, unknown>)
        : {};

    const unitLabel = this.normalizeOptionalText(quantityConfig.unit_label, 32);
    const unitOptions = this.normalizeQuantityUnitOptions(
      quantityConfig.unit_options,
    );

    return {
      quantity: {
        unit_label: unitLabel || DEFAULT_QUANTITY_UNIT_LABEL,
        ...(unitOptions.length > 0 ? { unit_options: unitOptions } : {}),
      },
    };
  }

  private normalizeWeightOrderConfig(rawValue: unknown): ProductOrderConfig {
    const weightConfig =
      rawValue && typeof rawValue === 'object'
        ? (rawValue as Record<string, unknown>)
        : {};

    const presetGrams = this.normalizeNumericPresets(
      weightConfig.preset_grams,
      DEFAULT_WEIGHT_PRESET_GRAMS,
    );
    const allowCustomGrams =
      typeof weightConfig.allow_custom_grams === 'boolean'
        ? weightConfig.allow_custom_grams
        : true;

    return {
      weight: {
        preset_grams: presetGrams,
        allow_custom_grams: allowCustomGrams,
      },
    };
  }

  private normalizePriceOrderConfig(rawValue: unknown): ProductOrderConfig {
    const priceConfig =
      rawValue && typeof rawValue === 'object'
        ? (rawValue as Record<string, unknown>)
        : {};

    const presetAmounts = this.normalizeNumericPresets(
      priceConfig.preset_amounts_egp,
      DEFAULT_PRICE_PRESET_AMOUNTS,
    );
    const allowCustomAmount =
      typeof priceConfig.allow_custom_amount === 'boolean'
        ? priceConfig.allow_custom_amount
        : true;

    return {
      price: {
        preset_amounts_egp: presetAmounts,
        allow_custom_amount: allowCustomAmount,
      },
    };
  }

  private normalizeNumericPresets(
    rawValue: unknown,
    fallback: readonly number[],
  ): number[] {
    if (!Array.isArray(rawValue)) {
      return [...fallback];
    }

    const uniquePresets = new Set<number>();
    for (const value of rawValue) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        continue;
      }

      uniquePresets.add(Math.round(parsed));

      if (uniquePresets.size >= MAX_ORDER_PRESETS) {
        break;
      }
    }

    if (uniquePresets.size === 0) {
      return [...fallback];
    }

    return Array.from(uniquePresets).sort((left, right) => left - right);
  }

  private normalizeQuantityUnitOptions(
    rawValue: unknown,
  ): QuantityUnitOptionConfig[] {
    if (!Array.isArray(rawValue)) {
      return [];
    }

    const normalizedOptions: QuantityUnitOptionConfig[] = [];
    const optionIds = new Set<string>();

    for (const option of rawValue) {
      if (!option || typeof option !== 'object') {
        continue;
      }

      const optionRecord = option as Record<string, unknown>;
      const label = this.normalizeOptionalText(optionRecord.label, 64);
      const multiplier = Number(optionRecord.multiplier);
      if (!label || !Number.isFinite(multiplier) || multiplier <= 0) {
        continue;
      }

      const providedId = this.normalizeOptionalText(optionRecord.id, 64);
      const candidateId = providedId || `unit_${normalizedOptions.length + 1}`;
      if (optionIds.has(candidateId)) {
        continue;
      }

      optionIds.add(candidateId);
      normalizedOptions.push({
        id: candidateId,
        label,
        multiplier: Number(multiplier.toFixed(3)),
      });

      if (normalizedOptions.length >= MAX_ORDER_PRESETS) {
        break;
      }
    }

    return normalizedOptions;
  }

  private normalizeOptionalText(value: unknown, maxLength: number): string {
    if (typeof value !== 'string') {
      return '';
    }

    const normalized = value.trim();
    if (!normalized) {
      return '';
    }

    return normalized.slice(0, maxLength);
  }

  private async storeTenantProductCategory(
    tenantId: number,
    category: string | undefined,
  ): Promise<void> {
    const normalizedCategory = this.normalizeOptionalCategory(category);
    if (!normalizedCategory) {
      return;
    }

    await this.getTenantProductCategoriesRepository()
      .createQueryBuilder()
      .insert()
      .into(TenantProductCategory)
      .values({
        tenant_id: tenantId,
        name: normalizedCategory,
      })
      .orIgnore()
      .execute();
  }

  private getTenantSearchCacheVersionKey(tenantId: number): string {
    return `merchant:products:search:version:${tenantId}`;
  }

  private buildTenantSearchCacheKey(
    tenantId: number,
    normalizedSearch: string,
    category: string | undefined,
    similarityThreshold: number,
    strictMatchThresholds: StrictMatchThresholds,
    rankAll: boolean,
    excludedProductIds: number[],
    page: number,
    limit: number,
    version: string,
  ): string {
    const normalizedCategory = category || 'all';
    const normalizedExcludedIds =
      excludedProductIds.length > 0 ? excludedProductIds.join(',') : 'none';
    const rankingMode = rankAll ? 'rank_all' : 'strict';
    return `merchant:products:search:${tenantId}:${version}:${normalizedCategory}:${normalizedSearch}:${similarityThreshold}:${strictMatchThresholds.strictSimilarityThreshold}:${strictMatchThresholds.strictWordSimilarityThreshold}:${rankingMode}:${normalizedExcludedIds}:${page}:${limit}`;
  }

  private normalizeExcludedProductIds(rawIds?: number[]): number[] {
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return [];
    }

    return Array.from(
      new Set(
        rawIds.filter(
          (id): id is number =>
            Number.isInteger(id) && Number.isFinite(id) && id > 0,
        ),
      ),
    ).sort((left, right) => left - right);
  }

  private async getTenantSearchCacheVersion(tenantId: number): Promise<string> {
    const versionKey = this.getTenantSearchCacheVersionKey(tenantId);
    const cachedVersion = await this.cacheManager.get<string>(versionKey);
    if (cachedVersion) {
      return cachedVersion;
    }

    const initialVersion = Date.now().toString();
    await this.cacheManager.set(versionKey, initialVersion);
    return initialVersion;
  }

  private async bumpTenantSearchCacheVersion(tenantId: number): Promise<void> {
    const versionKey = this.getTenantSearchCacheVersionKey(tenantId);
    await this.cacheManager.set(versionKey, Date.now().toString());
  }

  /**
   * Returns product repository bound to request manager when present.
   */
  private getProductsRepository(): Repository<Product> {
    const manager = DbTenantContext.getManager();
    return manager ? manager.getRepository(Product) : this.productsRepository;
  }

  /**
   * Returns catalog repository bound to request manager when present.
   */
  private getCatalogItemsRepository(): Repository<CatalogItem> {
    const manager = DbTenantContext.getManager();
    return manager
      ? manager.getRepository(CatalogItem)
      : this.catalogItemsRepository;
  }

  /**
   * Returns tenant category repository bound to request manager when present.
   */
  private getTenantProductCategoriesRepository(): Repository<TenantProductCategory> {
    const manager = DbTenantContext.getManager();
    return manager
      ? manager.getRepository(TenantProductCategory)
      : this.tenantProductCategoriesRepository;
  }
}

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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSource } from 'src/common/enums/product-source.enum';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { AddProductFromCatalogDto } from './dto/add-product-from-catalog.dto';
import { ImageProcessorService } from 'src/common/services/image-processor.service';
import { DbTenantContext } from 'src/common/contexts/db-tenant.context';

const DEFAULT_PRODUCT_CATEGORY = 'أخرى';
const DUPLICATE_PRODUCT_NAME_MESSAGE = 'Product with this name already exists';
const PRODUCT_SEARCH_CACHE_TTL_SECONDS = 60;

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
    });

    const saved = await this.getProductsRepository().save(product);
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
    });

    const saved = await this.getProductsRepository().save(product);
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
    const similarityThreshold =
      this.resolveSimilarityThreshold(normalizedSearch);

    const searchVersion = await this.getTenantSearchCacheVersion(tenantId);
    const cacheKey = this.buildTenantSearchCacheKey(
      tenantId,
      normalizedSearch,
      normalizedCategory,
      similarityThreshold,
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

    return this.searchWithinPublicProducts(
      slug,
      normalizedSearch,
      normalizedCategory,
      similarityThreshold,
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

    if (typeof updateProductDto.category === 'string') {
      product.category = this.normalizeCategory(updateProductDto.category);
    }

    if (typeof updateProductDto.current_price === 'number') {
      product.current_price = this.normalizeCurrentPrice(
        updateProductDto.current_price,
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
    page: number,
    limit: number,
  ): Promise<TenantProductsSearchResult> {
    const query = this.getProductsRepository()
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE });

    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    this.applySimilarityRanking(query, normalizedSearch, similarityThreshold);

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return this.buildSearchResult(data, total, page, limit);
  }

  private async searchWithinPublicProducts(
    slug: string,
    normalizedSearch: string,
    category: string | undefined,
    similarityThreshold: number,
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

    this.applySimilarityRanking(query, normalizedSearch, similarityThreshold);

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return this.buildSearchResult(data, total, page, limit);
  }

  private applySimilarityRanking(
    query: SelectQueryBuilder<Product>,
    normalizedSearch: string,
    similarityThreshold: number,
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
      .addSelect(
        `similarity(${comparableNameSql}, :normalizedSearch)`,
        'name_similarity',
      )
      .addSelect(
        `CASE WHEN ${comparableNameSql} LIKE :prefixPattern THEN 1 ELSE 0 END`,
        'prefix_score',
      )
      .addSelect(
        `CASE WHEN ${comparableNameSql} LIKE :containsPattern THEN 1 ELSE 0 END`,
        'contains_score',
      )
      .addSelect(
        `(similarity(${comparableNameSql}, :normalizedSearch) * 0.85) + (CASE WHEN ${comparableNameSql} LIKE :prefixPattern THEN 1 ELSE 0 END) * 0.15`,
        'search_rank',
      )
      .andWhere(
        `(${comparableNameSql} LIKE :prefixPattern OR ${comparableNameSql} LIKE :containsPattern OR LOWER(product.name) % :normalizedSearch)`,
      )
      .andWhere(
        `(${comparableNameSql} LIKE :prefixPattern OR ${comparableNameSql} LIKE :containsPattern OR similarity(${comparableNameSql}, :normalizedSearch) >= :similarityThreshold)`,
      );

    query
      .orderBy('search_rank', 'DESC')
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

  private normalizeOptionalCategory(category?: string): string | undefined {
    const normalizedCategory = category?.trim();
    if (!normalizedCategory) {
      return undefined;
    }

    return normalizedCategory.slice(0, 64);
  }

  private normalizeArabic(input: string): string {
    return input
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/\(([^)]*)\)/g, ' ')
      .replace(
        /(?:\d+\s*(?:جم|جرام|كجم|كيلو|ك|g|kg)|(?:جم|جرام|كجم|كيلو|ك|g|kg)\s*\d+)/gi,
        ' ',
      )
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
                    LOWER(${columnName}),
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

  private getTenantSearchCacheVersionKey(tenantId: number): string {
    return `merchant:products:search:version:${tenantId}`;
  }

  private buildTenantSearchCacheKey(
    tenantId: number,
    normalizedSearch: string,
    category: string | undefined,
    similarityThreshold: number,
    page: number,
    limit: number,
    version: string,
  ): string {
    const normalizedCategory = category || 'all';
    return `merchant:products:search:${tenantId}:${version}:${normalizedCategory}:${normalizedSearch}:${similarityThreshold}:${page}:${limit}`;
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
}

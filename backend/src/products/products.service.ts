import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CatalogItem } from './entities/catalog-item.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSource } from 'src/common/enums/product-source.enum';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { AddProductFromCatalogDto } from './dto/add-product-from-catalog.dto';
import { ImageProcessorService } from 'src/common/services/image-processor.service';

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

    const product = this.productsRepository.create({
      tenant_id: tenantId,
      name: normalizedName,
      image_url: createProductDto.image_url,
      source: ProductSource.MANUAL,
      status: ProductStatus.ACTIVE,
    });

    return this.productsRepository.save(product);
  }

  /**
   * Creates a product by copying data from a catalog item.
   */
  async createFromCatalog(
    tenantId: number,
    payload: AddProductFromCatalogDto,
  ): Promise<Product> {
    const catalogItem = await this.catalogItemsRepository.findOne({
      where: { id: payload.catalog_item_id, is_active: true },
    });

    if (!catalogItem) {
      throw new NotFoundException(
        `Catalog item with ID ${payload.catalog_item_id} not found`,
      );
    }

    const product = this.productsRepository.create({
      tenant_id: tenantId,
      name: catalogItem.name,
      image_url: catalogItem.image_url,
      source: ProductSource.CATALOG,
      status: ProductStatus.ACTIVE,
    });

    return this.productsRepository.save(product);
  }

  /**
   * Returns all active products for the authenticated tenant.
   */
  async findAll(tenantId: number): Promise<Product[]> {
    return this.productsRepository.find({
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
   * Returns all active products by public tenant slug.
   */
  async findAllByTenantSlug(slug: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: {
        tenant: { slug },
        status: ProductStatus.ACTIVE,
      },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Returns active catalog categories for product onboarding.
   */
  async findCatalogCategories(): Promise<string[]> {
    const rows = await this.catalogItemsRepository
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

    return this.catalogItemsRepository.find({
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
    const product = await this.productsRepository.findOne({
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
      product.name = normalizedName;
    }

    if (updateProductDto.status) {
      product.status = updateProductDto.status;
    }

    if (file?.path) {
      product.image_url =
        await this.imageProcessorService.processProductThumbnail(file.path);
    } else if (typeof updateProductDto.image_url === 'string') {
      const normalizedImageUrl = updateProductDto.image_url.trim();
      product.image_url = normalizedImageUrl || undefined;
    }

    const updatedProduct = await this.productsRepository.save(product);

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
    await this.productsRepository.save(product);
  }
}

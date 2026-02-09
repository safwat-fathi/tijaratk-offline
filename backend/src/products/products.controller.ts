import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import CONSTANTS from 'src/common/constants';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddProductFromCatalogDto } from './dto/add-product-from-catalog.dto';
import { UploadFile } from 'src/common/decorators/upload-file.decorator';
import { imageFileFilter } from 'src/common/utils/file-filters';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { GetPublicProductsDto } from './dto/get-public-products.dto';
import { GetTenantProductsDto } from './dto/get-tenant-products.dto';

type AuthenticatedRequest = Request & {
  user?: {
    tenant_id?: number;
  };
};

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Create product (quick manual add)' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
  })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createProductDto: CreateProductDto,
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    return this.productsService.create(tenantId, createProductDto);
  }

  @Post('from-catalog')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Create product from catalog item' })
  @ApiBody({ type: AddProductFromCatalogDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created from catalog successfully',
  })
  createFromCatalog(
    @Req() req: AuthenticatedRequest,
    @Body() body: AddProductFromCatalogDto,
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    return this.productsService.createFromCatalog(tenantId, body);
  }

  @Get('catalog/categories')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Get catalog categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return active catalog categories',
  })
  findCatalogCategories() {
    return this.productsService.findCatalogCategories();
  }

  @Get('catalog')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Get catalog items' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter items by category',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return catalog items' })
  findCatalogItems(@Query('category') category?: string) {
    return this.productsService.findCatalogItems(category);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Get all tenant products' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return tenant products' })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetTenantProductsDto,
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    if (query.search?.trim()) {
      return this.productsService.searchTenantProducts(
        tenantId,
        query.search,
        query.page,
        query.limit,
      );
    }

    return this.productsService.findAll(tenantId);
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get all active products by tenant slug (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return active products for tenant',
  })
  findAllByTenantSlug(
    @Param('slug') slug: string,
    @Query() query: GetPublicProductsDto,
  ) {
    return this.productsService.findAllByTenantSlug(
      slug,
      query.page,
      query.limit,
      query.category,
    );
  }

  @Get('public/:slug/categories')
  @ApiOperation({
    summary: 'Get public product categories by tenant slug (Public)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return public storefront category summaries',
  })
  findPublicCategoriesByTenantSlug(@Param('slug') slug: string) {
    return this.productsService.findPublicCategoriesByTenantSlug(slug);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the product' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    return this.productsService.findOne(+id, tenantId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Update a product' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        image_url: { type: 'string' },
        status: { type: 'string', enum: Object.values(ProductStatus) },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UploadFile('file', {
    fileFilter: imageFileFilter,
    limits: { fileSize: 1024 * 1024 * 5 },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
  })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    return this.productsService.update(+id, tenantId, updateProductDto, file);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Archive a product' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product archived successfully',
  })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    return this.productsService.remove(+id, tenantId);
  }
}

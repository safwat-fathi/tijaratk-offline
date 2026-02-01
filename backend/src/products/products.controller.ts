import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import CONSTANTS from 'src/common/constants';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Product created successfully' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all products' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get all products by tenant slug (Public)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all products for tenant' })
  findAllByTenantSlug(@Param('slug') slug: string) {
    return this.productsService.findAllByTenantSlug(slug);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the product' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Update a product' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product updated successfully' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product deleted successfully' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}

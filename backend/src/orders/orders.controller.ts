import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import CONSTANTS from 'src/common/constants';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders')
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @UseGuards(AuthGuard(CONSTANTS.AUTH.JWT))
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created successfully',
  })
  create(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }
    return this.ordersService.createForTenantId(tenantId, createOrderDto);
  }

  @Post(':tenant_slug')
  @ApiOperation({ summary: 'Create a new order (Public)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created successfully',
  })
  createPublic(
    @Param('tenant_slug') tenantSlug: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createForTenantSlug(tenantSlug, createOrderDto);
  }

  @Get()
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @UseGuards(AuthGuard(CONSTANTS.AUTH.JWT))
  @ApiOperation({
    summary: 'Get all orders',
    description: 'Get all orders for the authenticated tenant',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all orders' })
  findAll(@Req() req: any, @Query('date') date?: string) {
    const tenantId = req.user?.tenant_id || 1;
    return this.ordersService.findAll(tenantId, date);
  }

  @Get(':id')
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @UseGuards(AuthGuard(CONSTANTS.AUTH.JWT))
  @ApiOperation({
    summary: 'Get an order by ID',
    description: 'Get an order by ID for the authenticated tenant',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the order' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    // Check if ParseIntPipe is imported or just use it
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @UseGuards(AuthGuard(CONSTANTS.AUTH.JWT))
  @ApiOperation({
    summary: 'Update an order',
    description: 'Update an order for the authenticated tenant',
  })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order updated successfully',
  })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Get('tracking/:token')
  @ApiOperation({
    summary: 'Get an order by public token (Tracking)',
    description: 'Get an order by public token (Tracking)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the order' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found' })
  findByPublicToken(@Param('token') token: string) {
    return this.ordersService.findByPublicToken(token);
  }
}

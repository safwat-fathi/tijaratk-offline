import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  Request,
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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
@UseGuards(AuthGuard(CONSTANTS.AUTH.JWT))
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Customer created successfully',
  })
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @Request() req: { user: { tenant_id: number } },
  ) {
    return this.customersService.create(createCustomerDto, req.user.tenant_id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all customers' })
  async findAll(
    @Query('search') search: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Request() req: { user: { tenant_id: number } },
  ) {
    const result = await this.customersService.findAll(
      req.user.tenant_id,
      search,
      +page,
      +limit,
    );

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the customer' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  findOne(
    @Param('id') id: string,
    @Request() req: { user: { tenant_id: number } },
  ) {
    return this.customersService.findOne(+id, req.user.tenant_id);
  }

  @Post(':id/label')
  @ApiOperation({ summary: 'Update merchant label for a customer' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Customer updated' })
  updateLabel(
    @Param('id') id: string,
    @Body('label') label: string,
    @Request() req: { user: { tenant_id: number } },
  ) {
    return this.customersService.updateMerchantLabel(
      +id,
      label,
      req.user.tenant_id,
    );
  }
}

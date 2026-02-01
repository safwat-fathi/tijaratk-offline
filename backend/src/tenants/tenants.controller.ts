import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get tenant details by slug (Public)' })
  @ApiResponse({ status: 200, description: 'Return tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findOneBySlug(@Param('slug') slug: string) {
    const tenant = await this.tenantsService.findOneBySlug(slug);
    if (!tenant) {
        throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }
    return tenant;
  }
}

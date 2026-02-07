import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import CONSTANTS from 'src/common/constants';
import { TenantsService } from './tenants.service';

type AuthenticatedRequest = Request & {
  user?: {
    tenant_id?: number;
  };
};

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  @UseGuards(AuthGuard(CONSTANTS.AUTH.JWT))
  @ApiBearerAuth(CONSTANTS.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Get authenticated tenant details' })
  @ApiResponse({
    status: 200,
    description: 'Return authenticated tenant details',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findMe(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    const tenant = await this.tenantsService.findOneById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${tenantId} not found`);
    }

    return tenant;
  }

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

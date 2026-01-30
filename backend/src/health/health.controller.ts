import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('API Health')
@Controller('health')
export class HealthController {
  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get app status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return ok' })
  @ApiResponse({ status: 500, description: 'Return error' })
  status() {
    return 'ok';
  }
}

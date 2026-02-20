import { Controller, Post, Body, Header } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  @Post()
  @Header('Content-Type', 'text/xml')
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  receive(@Body() body: any) {
    console.log('Incoming WhatsApp:', JSON.stringify(body, null, 2));
    return 'OK';
  }
}

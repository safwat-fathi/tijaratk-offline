import { Module } from '@nestjs/common';
import { WhatsAppWebhookController } from './whatsapp.controller';

@Module({
  controllers: [WhatsAppWebhookController],
})
export class WebhooksModule {}

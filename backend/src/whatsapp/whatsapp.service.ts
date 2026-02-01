import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async sendWelcomeMessage(phone: string, storeName: string): Promise<void> {
    this.logger.log(
      `[DUMMY] Sending WhatsApp welcome message to ${phone} for store "${storeName}"`,
    );
    // In a real implementation, this would call the WhatsApp API
    return Promise.resolve();
  }
}

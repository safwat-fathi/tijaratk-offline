import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';


@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private twilioClient: twilio.Twilio | null = null;

  private getClient(): twilio.Twilio | null {
    try {
      if (this.twilioClient) {
        return this.twilioClient;
      }

      const start = Date.now();
      const accountSid = process.env.ACCOUNT_SID;
      const authToken = process.env.AUTH_TOKEN;

      if (!accountSid || !authToken) {
        this.logger.warn('Twilio env vars are missing; skipping message send.');
        return null;
      }

      this.twilioClient = twilio(accountSid, authToken);

      this.logger.debug(`Twilio client initialized in ${Date.now() - start}ms`);
      return this.twilioClient;
    } catch (e) {
      this.logger.error('Failed to initialize Twilio client', e);
      return null;
    }
  }

  async sendMessage(to: string, body: string): Promise<void> {
    const client = this.getClient();
    const from = process.env.WHATSAPP_PHONE_NUMBER;

    if (!client || !from) {
      if (!from) this.logger.warn('WHATSAPP_PHONE_NUMBER is missing');
      return;
    }

    try {
      this.logger.log(`Sending WhatsApp message to ${to}: ${body}`);
      // Ensure number has whatsapp: prefix if not present, though typically passed cleanly.
      // Twilio requires 'whatsapp:+1234567890' format.
      const toStr = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const fromStr = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

      await client.messages.create({
        body,
        from: fromStr,
        to: toStr,
      });
      this.logger.log(`Message sent to ${to}`);
    } catch (error) {
      const details =
        error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(`Failed to send WhatsApp message to ${to}`, details);
    }
  }

  async sendWelcomeMessage(phone: string, storeName: string): Promise<void> {
    const message = `مرحبًا بك في Tijaratk، ${storeName}`;
    await this.sendMessage(phone, message);
  }
}

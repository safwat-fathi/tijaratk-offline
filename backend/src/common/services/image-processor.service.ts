import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { mkdir, rm } from 'fs/promises';
import { basename, join } from 'path';
import sharp from 'sharp';
import * as crypto from 'crypto';

/**
 * Handles image normalization and thumbnail generation for uploaded assets.
 */
@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);
  private readonly unsupportedImageFormatMessage =
    'Unsupported image format. Use JPG, PNG, WEBP, HEIC, or HEIF.';

  /**
   * Processes an uploaded product image into a normalized 256x256 WebP thumbnail.
   *
   * @param inputPath Absolute path of multer temporary file.
   * @returns Public URL path for stored thumbnail.
   */
  async processProductThumbnail(inputPath: string): Promise<string> {
    const uploadsRoot = join(process.cwd(), 'uploads');
    const productsDir = join(uploadsRoot, 'products');

    await mkdir(productsDir, { recursive: true });

    const outputFilename = this.createOutputFilename();
    const outputPath = join(productsDir, outputFilename);

    try {
      await sharp(inputPath)
        .resize(256, 256, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({
          quality: 82,
          effort: 4,
        })
        .toFile(outputPath);

      await this.deleteFileQuietly(inputPath);

      return `/uploads/products/${outputFilename}`;
    } catch (error) {
      await this.deleteFileQuietly(inputPath);
      await this.deleteFileQuietly(outputPath);

      this.logger.error(
        `Failed to process uploaded image ${basename(inputPath)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (this.isUnsupportedImageError(error)) {
        throw new BadRequestException(this.unsupportedImageFormatMessage);
      }

      throw new InternalServerErrorException('Failed to process product image');
    }
  }

  /**
   * Deletes a previously generated product image if it is a managed uploads file.
   *
   * @param imageUrl Public image URL value stored on product entity.
   */
  async deleteManagedProductImage(imageUrl?: string | null): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith('/uploads/products/')) {
      return;
    }

    const absolutePath = join(process.cwd(), imageUrl.replace(/^\//, ''));
    await this.deleteFileQuietly(absolutePath);
  }

  /**
   * Creates a unique deterministic output filename for generated thumbnails.
   */
  private createOutputFilename(): string {
    const suffix = `${Date.now()}-${crypto.randomBytes(4).readUInt32LE(0)}`;
    return `product-${suffix}.webp`;
  }

  /**
   * Deletes a file while swallowing ENOENT and other cleanup-only errors.
   */
  private async deleteFileQuietly(filePath: string): Promise<void> {
    try {
      await rm(filePath, { force: true });
    } catch {
      // Best effort cleanup only.
    }
  }

  /**
   * Detects decode/parsing errors caused by unsupported or invalid image inputs.
   */
  private isUnsupportedImageError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes('unsupported image format') ||
      message.includes('unsupported codec') ||
      message.includes('input file is missing') ||
      message.includes('input buffer has corrupt header') ||
      message.includes('vips_foreign_load')
    );
  }
}

// import { Injectable, Logger } from '@nestjs/common';
// import * as fs from 'fs';
// import * as path from 'path';
// import sharp from 'sharp';

// @Injectable()
// export class ImageProcessorService {
//   private readonly logger = new Logger(ImageProcessorService.name);

//   /**
//    * Converts an uploaded image to WebP format for optimal web delivery.
//    * Deletes the original file after successful conversion.
//    *
//    * @param filePath - Absolute path to the uploaded file
//    * @returns New filename with .webp extension
//    */
//   async convertToWebP(filePath: string): Promise<string> {
//     const directory = path.dirname(filePath);
//     const originalFilename = path.basename(filePath);
//     const nameWithoutExt = path.parse(originalFilename).name;
//     const webpFilename = `${nameWithoutExt}.webp`;
//     const webpPath = path.join(directory, webpFilename);

//     try {
//       // Convert to WebP with good quality settings
//       await sharp(filePath)
//         .webp({
//           quality: 85,
//           effort: 4, // Balance between speed and compression
//         })
//         .toFile(webpPath);

//       // Delete original file after successful conversion
//       await fs.promises.unlink(filePath);

//       this.logger.log(`Converted ${originalFilename} to ${webpFilename}`);
//       return webpFilename;
//     } catch (error) {
//       this.logger.error(`Failed to convert ${originalFilename} to WebP`, error);
//       // Return original filename if conversion fails
//       return originalFilename;
//     }
//   }

//   /**
//    * Resizes and converts an image to WebP format.
//    * Maintains aspect ratio while limiting max dimensions.
//    *
//    * @param filePath - Absolute path to the uploaded file
//    * @param maxWidth - Maximum width in pixels (default: 1920)
//    * @param maxHeight - Maximum height in pixels (default: 1080)
//    * @returns New filename with .webp extension
//    */
//   async optimizeImage(
//     filePath: string,
//     maxWidth: number = 1920,
//     maxHeight: number = 1080,
//   ): Promise<string> {
//     const directory = path.dirname(filePath);
//     const originalFilename = path.basename(filePath);
//     const nameWithoutExt = path.parse(originalFilename).name;
//     const webpFilename = `${nameWithoutExt}.webp`;
//     const webpPath = path.join(directory, webpFilename);

//     try {
//       await sharp(filePath)
//         .resize(maxWidth, maxHeight, {
//           fit: 'inside',
//           withoutEnlargement: true,
//         })
//         .webp({
//           quality: 85,
//           effort: 4,
//         })
//         .toFile(webpPath);

//       // Delete original file after successful conversion
//       await fs.promises.unlink(filePath);

//       this.logger.log(
//         `Optimized and converted ${originalFilename} to ${webpFilename}`,
//       );
//       return webpFilename;
//     } catch (error) {
//       this.logger.error(
//         `Failed to optimize ${originalFilename}`,
//         error.message,
//       );
//       return originalFilename;
//     }
//   }
// }

import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

type MulterLikeFile = {
  mimetype: string;
};

/**
 * Multer file filter that accepts common web image MIME types only.
 */
export const imageFileFilter = (
  _req: Request,
  file: MulterLikeFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const imageRegex = /\/(jpg|jpeg|png|webp)$/i;
  if (!imageRegex.test(file.mimetype)) {
    return callback(
      new BadRequestException('Only image files are allowed!'),
      false,
    );
  }

  callback(null, true);
};

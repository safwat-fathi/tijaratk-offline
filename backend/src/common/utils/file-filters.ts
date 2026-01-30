// import { BadRequestException } from '@nestjs/common';
// import { Request } from 'express';

// export const imageFileFilter = (
//   _req: Request,
//   file: Express.Multer.File,
//   callback: (error: Error | null, acceptFile: boolean) => void,
// ) => {
//   const imageRegex = /\/(jpg|jpeg|png|webp)$/i; // case-insensitive
//   if (!imageRegex.test(file.mimetype)) {
//     return callback(
//       new BadRequestException('Only image files are allowed!'),
//       false,
//     );
//   }
//   callback(null, true);
// };

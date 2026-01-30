// import { applyDecorators, UseInterceptors } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
// import { diskStorage } from 'multer';
// import { extname } from 'path';

// export function UploadFile(
//   fieldName: string = 'file',
//   options: Partial<MulterOptions> = {},
// ) {
//   return applyDecorators(
//     UseInterceptors(
//       FileInterceptor(fieldName, {
//         storage: diskStorage({
//           destination: './uploads',
//           filename: (req, file, callback) => {
//             const uniqueSuffix =
//               Date.now() + '-' + Math.round(Math.random() * 1e9);
//             const ext = extname(file.originalname);
//             callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
//           },
//         }),
//         ...options,
//       }),
//     ),
//   );
// }

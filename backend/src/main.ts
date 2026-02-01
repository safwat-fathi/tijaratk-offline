import { NestFactory } from '@nestjs/core';
import { NestInterceptor, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import CONSTANTS from './common/constants';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from './auth/auth.module';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.transform';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Remove COOP header to fix Swagger UI issues
  app.use((_req, res, next) => {
    res.removeHeader('Cross-Origin-Opener-Policy');
    next();
  });

  // remove header x-powered-by
  app.use((_, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
  });

  // helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for Swagger UI
      crossOriginEmbedderPolicy: false, // Required for Swagger UI
      crossOriginResourcePolicy: false, // Allow cross-origin resource loading
    }),
  );

  // cookies
  app.use(cookieParser());

  // cors
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.use('/docs', (_req, res, next) => {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Swagger docs
  const options = new DocumentBuilder()
    .setTitle('Tijaratk API')
    .setDescription('Tijaratk API documentation')
    .setVersion('1.0')
    .setExternalDoc('API Documentation', '/docs')
    .setContact('Tijaratk', 'https://www.tijaratk.com', 'help@tijaratk.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token **_only_**',
        in: 'header',
      },
      CONSTANTS.ACCESS_TOKEN, // This name should match the name in @ApiBearerAuth() decorator in your controller
    );

  // Ensure HTTP scheme is used (replace https with http if present)
  // const appUrl = (process.env.APP_URL || '').replace(/^https:\/\//, 'http://');

  if (process.env.NODE_ENV === 'development') {
    options.addServer(process.env.APP_URL, 'Local environment');
  } else {
    options.addServer(process.env.APP_URL, 'Production environment');
  }

  const config = options.build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Tijaratk API docs - ' + process.env.NODE_ENV,
    customfavIcon: '/favicon.ico',
  });

  // Global Pipe for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory(errors) {
        return errors;
      },
    }),
  );

  // Global Interceptor for success responses
  const interceptors: NestInterceptor[] = [new ResponseTransformInterceptor()];
  app.useGlobalInterceptors(...interceptors);

  await app.listen(process.env.HTTP_SERVER_PORT, '127.0.0.1');
}
bootstrap();

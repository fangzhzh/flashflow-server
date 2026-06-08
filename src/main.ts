import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowedOrigins = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
        : [];
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^https?:\/\/.*\.idx-dev\.googleusercontent\.com$/.test(origin) ||
        /^https?:\/\/.*\.vercel\.app$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS: Origin ${origin} allowed but not explicitly in list`);
        callback(null, true);
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Flashcard API running on http://localhost:${port}/api`);
}

bootstrap();

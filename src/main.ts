import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(4000);
    console.log('Application is running on: http://localhost:4000');
  } catch (error) {
    console.error('Error starting the server:', error);
  }
}
bootstrap();

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductService } from './product/product.service';
import { ProductRepository } from './product/product.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductModule } from './product/product.module';
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    ProductModule,
    ConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService, ProductService, ProductRepository],
})
export class AppModule {}

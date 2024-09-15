import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { Product, ProductSchema } from '../schemas/product.schema';
import {
  Manufacturer,
  ManufacturerSchema,
} from '../schemas/manufacturer.schema';
import { ConfigModule } from '../config/config.module';
import { ProductController } from './product.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Manufacturer.name, schema: ManufacturerSchema },
    ]),
    ConfigModule,
  ],
  providers: [ProductService, ProductRepository],
  exports: [ProductService, ProductRepository, MongooseModule],
  controllers: [ProductController],
})
export class ProductModule {}

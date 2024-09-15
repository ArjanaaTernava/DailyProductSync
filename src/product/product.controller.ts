import { Controller, Get, Param } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('import')
  import() {
    return this.productService.importProducts();
  }

  @Get('details/:productId')
  getProductDetails(@Param('productId') productId: string) {
    return this.productService.getProductDetails(productId);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../schemas/product.schema';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { nanoid } = require('fix-esm').require('nanoid');

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<Product>,
  ) {}

  async upsertProducts(products: any[]) {
    const bulkOps = products.map((product) => {
      const { _id, variants, ...productData } = product.toObject();

      return {
        updateOne: {
          filter: { productId: product.productId },
          update: {
            $set: productData,
            $addToSet: { variants: { $each: variants } },
          },
          upsert: true,
        },
      };
    });

    await this.productModel.bulkWrite(bulkOps);
  }

  async getRecentProducts(limit: number) {
    return this.productModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  async updateProductDescription(productId: string, newDescription: string) {
    await this.productModel.updateOne(
      { productId },
      { $set: { description: newDescription } },
    );
  }

  async getProductDetails(productId: string) {
    const product = await this.productModel
      .aggregate([
        { $match: { productId } },
        {
          $lookup: {
            from: 'manufacturers',
            localField: 'manufacturerId',
            foreignField: '_id',
            as: 'manufacturerDetails',
          },
        },
        { $unwind: '$manufacturerDetails' },
        {
          $group: {
            _id: '$productId',
            productDetails: { $first: '$$ROOT' },
            variants: { $push: '$variants' },
          },
        },
        {
          $project: {
            _id: 0,
            productDetails: 1,
            variants: 1,
          },
        },
      ])
      .exec();

    return {
      docId: nanoid(),
      ...product[0].productDetails,
    };
  }
}

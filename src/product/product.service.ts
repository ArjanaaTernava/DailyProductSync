import { parse } from 'fast-csv';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createReadStream } from 'fs';
import { resolve } from 'path';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { ProductRepository } from './product.repository';
import { Product, Variant } from 'src/schemas/product.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Manufacturer } from 'src/schemas/manufacturer.schema';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { nanoid } = require('fix-esm').require('nanoid');
import { PromptTemplate } from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { ConfigService } from '@nestjs/config';

type ProductCSVRow = {
  SiteSource: string;
  ItemID: string;
  ManufacturerID: string;
  ManufacturerCode: string;
  ManufacturerName: string;
  ProductID: string;
  ProductName: string;
  ProductDescription: string;
  ManufacturerItemCode: string;
  ItemDescription: string;
  ImageFileName: string;
  ItemImageURL: string;
  NDCItemCode: string;
  PKG: string;
  UnitPrice: string;
  QuantityOnHand: string;
  PriceDescription: string;
  Availability: string;
  PrimaryCategoryID: string;
  PrimaryCategoryName: string;
  SecondaryCategoryID: string;
  SecondaryCategoryName: string;
  CategoryID: string;
  CategoryName: string;
  IsRX: string;
  IsTBD: string;
};

@Injectable()
export class ProductService {
  private model: ChatOpenAI<ChatOpenAICallOptions>;

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Manufacturer.name)
    private manufacturerModel: Model<Manufacturer>,
    private readonly productRepository: ProductRepository,
    readonly configService: ConfigService,
  ) {
    this.model = new ChatOpenAI({
      apiKey: configService.getOrThrow<string>('OPENAI_API_KEY'),
      temperature: 0.5,
      modelName: 'gpt-3.5-turbo',
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async importProducts() {
    console.log('Importing products...');
    const csvFilePath = resolve('src/data/products.csv');

    const csvStream = createReadStream(csvFilePath, {
      highWaterMark: 64 * 1024, // 64KB
    }).pipe(
      parse<ProductCSVRow, ProductCSVRow>({
        delimiter: '\t',
        headers: true,
      }),
    );

    let rowIndex = 0;
    let productData: Product[] = [];

    csvStream.on('error', (err: any) => {
      console.error('Error in CSV stream:', err);
    });

    try {
      for await (const row of csvStream) {
        rowIndex++;
        try {
          const product = await this.transformCSVToProduct(row);
          productData.push(product);

          if (productData.length % 1000 === 0) {
            await this.productRepository.upsertProducts(productData);
            productData = [];
          }
        } catch (err) {
          console.error(`Error while processing row ${rowIndex}:`, row, err);
        }
      }

      if (productData.length > 0) {
        await this.productRepository.upsertProducts(productData);
      }

      console.log('Product import completed successfully');

      await this.enhanceDescriptions();
    } catch (err) {
      console.error('Error during CSV parsing:', err);
    }
  }

  async transformCSVToProduct(row: ProductCSVRow) {
    let manufacturer = await this.manufacturerModel.findOne({
      name: row.ManufacturerName,
    });
    if (!manufacturer) {
      manufacturer = new this.manufacturerModel({
        name: row.ManufacturerName || 'ManufacturerName',
      });
      await manufacturer.save();
    }

    const variant: Variant = {
      id: row.ItemID,
      available: parseInt(row.QuantityOnHand) > 0,
      description: row.ItemDescription,
      cost: parseFloat(row.UnitPrice),
      price: parseFloat(row.UnitPrice),
      sku: row.ItemID,
      packaging: row.PKG,
      itemCode: row.ManufacturerItemCode,
      images: [
        {
          fileName: row.ImageFileName,
          cdnLink: row.ItemImageURL,
        },
      ],
    };

    let product = await this.productModel.findOne({ productId: row.ProductID });

    if (product) {
      const existingVariantIndex = product.variants.findIndex(
        (v) => v.id === row.ItemID,
      );

      if (existingVariantIndex === -1) {
        product.variants.push(variant);
      } else {
        product.variants[existingVariantIndex] = variant;
      }
    } else {
      product = new this.productModel({
        productId: row.ProductID,
        name: row.ProductName,
        description: row.ProductDescription,
        shortDescription: row.ItemDescription,
        vendorId: nanoid(),
        manufacturerId: manufacturer?._id,
        variants: [variant],
        storefrontPriceVisibility: 'Visible',
        availability: row.Availability,
        images: [
          {
            fileName: row.ImageFileName,
            cdnLink: row.ItemImageURL,
          },
        ],
        category: {
          primaryCategoryId: row.PrimaryCategoryID,
          primaryCategoryName: row.PrimaryCategoryName,
          secondaryCategoryId: row.SecondaryCategoryID,
          secondaryCategoryName: row.SecondaryCategoryName,
        },
      });
    }

    return product;
  }

  async enhanceDescriptions() {
    const products = await this.productRepository.getRecentProducts(10);

    for (const product of products) {
      const enhancedDescription = await this.enhanceDescription(product);
      await this.productRepository.updateProductDescription(
        product.id,
        enhancedDescription.toString(),
      );
    }
  }

  async enhanceDescription(product: Product) {
    const promptText = `
      You are an expert in medical sales. Your specialty is medical consumables used by hospitals on a daily basis.
      Your task is to enhance the description of a product based on the information provided.
      Product name: ${product.name}
      Product description: ${product.description}
      Category: ${product.category}
      New Description:
    `;

    try {
      const prompt = PromptTemplate.fromTemplate(promptText);

      const outputParser = new HttpResponseOutputParser();
      const chain = prompt.pipe(this.model).pipe(outputParser);
      const response = await chain.invoke({
        input: `Product name: ${product.name}\nProduct description: ${product.description}\nCategory: ${product.category}`,
      });

      return Object.values(response)
        .map((code) => String.fromCharCode(code))
        .join('');
    } catch (error) {
      console.error(
        `Error enhancing description for product ${product._id}: ${error.message}`,
      );
      return product.description;
    }
  }

  async getProductDetails(productId: string) {
    return this.productRepository.getProductDetails(productId);
  }
}

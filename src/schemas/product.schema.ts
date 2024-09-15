import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class Image {
  @Prop()
  fileName: string;

  @Prop()
  cdnLink: string;
}

export class Variant {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  available: boolean;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  cost: number;

  @Prop({ required: true })
  price: number;

  @Prop()
  sku: string;

  @Prop()
  packaging: string;

  @Prop()
  itemCode: string;

  @Prop({ type: [Image], default: [] })
  images: Image[];
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, unique: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  shortDescription: string;

  @Prop({ required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  manufacturerId: Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  variants: Variant[];

  @Prop({ required: true })
  storefrontPriceVisibility: string;

  @Prop({ required: true })
  availability: string;

  @Prop()
  images: Image[];
  category: any;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

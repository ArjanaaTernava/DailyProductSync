import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Manufacturer extends Document {
  @Prop({ required: true })
  name?: string;
}

export const ManufacturerSchema = SchemaFactory.createForClass(Manufacturer);

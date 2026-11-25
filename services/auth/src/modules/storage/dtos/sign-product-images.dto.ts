
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

export class SignProductImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(512, { each: true })
  @Matches(
    /^tenants\/[0-9a-f-]{36}\/products\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i,
    { each: true },
  )
  imageKeys!: string[];
}

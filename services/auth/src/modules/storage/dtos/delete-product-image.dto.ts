
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeleteProductImageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  imageKey!: string;
}

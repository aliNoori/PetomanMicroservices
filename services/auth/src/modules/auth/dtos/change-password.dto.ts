import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  current_password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  new_password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  confirm_password!: string;
}
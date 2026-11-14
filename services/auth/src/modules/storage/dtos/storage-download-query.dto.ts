import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'isSafeStorageKey', async: false })
class IsSafeStorageKeyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.length === 0) {
      return false;
    }

    const segments = value.split('/');

    return (
      /^[a-zA-Z0-9/_\-.]+$/.test(value) &&
      !value.startsWith('/') &&
      segments.every(
        (segment) => segment.length > 0 && segment !== '.' && segment !== '..',
      )
    );
  }

  defaultMessage(): string {
    return 'Storage key is invalid.';
  }
}

export class StorageDownloadQueryDto {
  @IsString()
  @Validate(IsSafeStorageKeyConstraint)
  key!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999999999)
  expires!: number;

  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  signature!: string;
}

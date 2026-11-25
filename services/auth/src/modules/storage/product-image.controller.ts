
import {
  Body,
  Controller,
  Delete,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import {
  InternalJwtGuard,
  type InternalAuthenticatedRequest,
} from '@petoman/security';

import { ProductImageService } from './product-image.service';
import { ProductImageUrlService } from './product-image-url.service';

import { DeleteProductImageDto } from './dtos/delete-product-image.dto';
import { SignProductImagesDto } from './dtos/sign-product-images.dto';

interface UploadedProductImage {
  readonly buffer: Buffer;
  readonly size: number;
}

@Controller('storage/products/images')
@UseGuards(InternalJwtGuard)
export class ProductImageController {
  constructor(
    private readonly productImageService: ProductImageService,
    private readonly productImageUrlService: ProductImageUrlService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async upload(
    @UploadedFile() file: UploadedProductImage | undefined,
    @Req() request: InternalAuthenticatedRequest,
  ): Promise<{ imageKey: string }> {
    return this.productImageService.upload(
      file,
      request.internalAuth,
    );
  }

  @Post('signed-urls')
  async signUrls(
    @Body() dto: SignProductImagesDto,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    return this.productImageUrlService.sign(
      dto.imageKeys,
      request.internalAuth,
    );
  }

  @Delete()
  async delete(
    @Body() dto: DeleteProductImageDto,
    @Req() request: InternalAuthenticatedRequest,
  ): Promise<{ deleted: boolean }> {
    return this.productImageService.delete(
      dto.imageKey,
      request.internalAuth,
    );
  }
}

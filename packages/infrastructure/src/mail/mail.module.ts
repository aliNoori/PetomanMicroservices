import {
  DynamicModule,
  Module,
  Global,
  Provider,
} from '@nestjs/common';
import nodemailer from 'nodemailer';

import {
  MAIL_OPTIONS,
  MAIL_TRANSPORT,
} from './mail.constants';

import { MailService } from './mail.service';
import { MailOptions } from './mail.interfaces';

export interface MailModuleAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory: (...args: any[]) => Promise<MailOptions> | MailOptions;
}

@Global()
@Module({})
export class MailModule {
  static forRootAsync(options: MailModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: MAIL_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const transportProvider: Provider = {
      provide: MAIL_TRANSPORT,
      inject: [MAIL_OPTIONS],
      useFactory: (mailOptions: MailOptions) =>
        nodemailer.createTransport({
          host: mailOptions.host,
          port: mailOptions.port,
          secure: mailOptions.secure,
          auth: {
            user: mailOptions.auth.user,
            pass: mailOptions.auth.pass,
          },
        }),
    };

    return {
      module: MailModule,
      imports: options.imports ?? [],
      providers: [
        optionsProvider,
        transportProvider,
        MailService,
      ],
      exports: [MailService],
    };
  }
}
import { Inject, Injectable } from '@nestjs/common';
import { Transporter } from 'nodemailer';

import { MAIL_TRANSPORT } from './mail.constants';
import { SendMailOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORT)
    private readonly transporter: Transporter,
  ) {}

  async send(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }
}
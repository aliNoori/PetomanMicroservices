import { registerAs } from '@nestjs/config';

export interface MailConfig {
  readonly verificationUrl: string;
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly password: string;
  readonly from: string;
}

export default registerAs('mail', (): MailConfig => ({
  verificationUrl:
    process.env.MAIL_VERIFICATION_URL ?? 'http://localhost:5173/verify-email',
  host: process.env.MAIL_HOST ?? '127.0.0.1',
  port: Number(process.env.MAIL_PORT ?? 587),
  secure: process.env.MAIL_SECURE === 'true',
  user: process.env.MAIL_USER ?? '',
  password: process.env.MAIL_PASSWORD ?? '',
  from: process.env.MAIL_FROM ?? '',
}));

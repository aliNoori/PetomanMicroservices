export interface MailOptions {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly auth: {
    readonly user: string;
    readonly pass: string;
  };
  readonly from: string;
}

export interface SendMailOptions {
  readonly from: string;
  readonly to: string | string[];
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
}

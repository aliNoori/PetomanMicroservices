import { Controller, Get, Headers } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
@Controller('health')
export class HealthController {
  @Get()
  async check(): Promise<{ status: string; data: string }> {
    const hash = await bcrypt.hash('Test1234!', 12);

    console.log(hash);
    return {
      status: 'ok',
      data: 'Im Auth Service',
    };
  }

  @Get('slow')
  async slow(): Promise<{ status: string }> {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      status: 'ok',
    };
  }

  @Get('auth-header')
  authHeader(@Headers('authorization') authorization?: string): {
    authorization: string | null;
  } {
    return {
      authorization: authorization ?? null,
    };
  }
}

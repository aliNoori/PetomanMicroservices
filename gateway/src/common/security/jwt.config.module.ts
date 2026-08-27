import { Module } from '@nestjs/common';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
 JwtSecurityModule,
} from '@petoman/security';


@Module({

 imports:[

  JwtSecurityModule.register({

    publicKey:
      readFileSync(
        join(
          process.cwd(),
          'keys/public.pem',
        ),
        'utf8',
      ),


    issuer:
      'petoman-auth',


    audience:
      'petoman-api',

  }),

 ],


 exports:[

  JwtSecurityModule,

 ]

})
export class JwtConfigModule {}
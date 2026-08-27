import { registerAs } from '@nestjs/config';


/**
 * Runtime configuration for a single downstream microservice.
 *
 * prefix:
 *   Public API prefix exposed by the Gateway.
 *
 * url:
 *   Internal/base URL of the downstream service.
 *
 * timeoutMs:
 *   Maximum time allowed for Gateway -> Service communication.
 */
export interface ServiceConfig {

  readonly prefix: string;

  readonly url: string;

  readonly timeoutMs: number;

}


/**
 * Central configuration for all downstream services.
 *
 * Gateway routing and proxying must resolve service configuration
 * through this structure instead of hard-coding URLs or timeouts.
 */
export interface ServicesConfig {

  readonly auth: ServiceConfig;

  readonly financial: ServiceConfig;

  readonly vet: ServiceConfig;

  readonly market: ServiceConfig;

  readonly pharmacy: ServiceConfig;

}


/**
 * Central microservice configuration.
 *
 * Environment variables are read only here.
 *
 * Other Gateway components should consume the resolved
 * ServicesConfig instead of reading process.env directly.
 */
export default registerAs(
  'services',
  (): ServicesConfig => ({

    auth: {

      prefix:
        process.env.AUTH_SERVICE_PREFIX!,

      url:
        process.env.AUTH_SERVICE_URL!,

      timeoutMs:
        Number(
          process.env.AUTH_SERVICE_TIMEOUT_MS,
        ),

    },


    financial: {

      prefix:
        process.env.FINANCIAL_SERVICE_PREFIX!,

      url:
        process.env.FINANCIAL_SERVICE_URL!,

      timeoutMs:
        Number(
          process.env.FINANCIAL_SERVICE_TIMEOUT_MS,
        ),

    },


    vet: {

      prefix:
        process.env.VET_SERVICE_PREFIX!,

      url:
        process.env.VET_SERVICE_URL!,

      timeoutMs:
        Number(
          process.env.VET_SERVICE_TIMEOUT_MS,
        ),

    },


    market: {

      prefix:
        process.env.MARKET_SERVICE_PREFIX!,

      url:
        process.env.MARKET_SERVICE_URL!,

      timeoutMs:
        Number(
          process.env.MARKET_SERVICE_TIMEOUT_MS,
        ),

    },


    pharmacy: {

      prefix:
        process.env.PHARMACY_SERVICE_PREFIX!,

      url:
        process.env.PHARMACY_SERVICE_URL!,

      timeoutMs:
        Number(
          process.env.PHARMACY_SERVICE_TIMEOUT_MS,
        ),

    },

  }),
);
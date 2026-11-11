import { Injectable } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  device: string | null;
  operatingSystem: string | null;
  browser: string | null;
  userAgent: string | null;
}

@Injectable()
export class DeviceInfoService {
  parse(userAgent: string | null): DeviceInfo {
    if (!userAgent) {
      return {
        device: 'Unknown',
        operatingSystem: 'Unknown',
        browser: 'Unknown',
        userAgent: null,
      };
    }

    const parser = new UAParser(userAgent);

    const result = parser.getResult();

    const deviceType = result.device.type ?? 'desktop';
    const deviceVendor = result.device.vendor;
    const deviceModel = result.device.model;

    return {
      device: [
        deviceVendor,
        deviceModel,
        deviceType,
      ]
        .filter(Boolean)
        .join(' ') || 'Unknown',

      operatingSystem: [
        result.os.name,
        result.os.version,
      ]
        .filter(Boolean)
        .join(' ') || 'Unknown',

      browser: [
        result.browser.name,
        result.browser.version,
      ]
        .filter(Boolean)
        .join(' ') || 'Unknown',

      userAgent,
    };
  }
}
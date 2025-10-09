import { PipeTransform, Injectable } from '@nestjs/common';
import xss from 'xss';

@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform<T>(value: T): T {
    return this.sanitize(value);
  }

  private sanitize<T>(value: T): T {
    if (typeof value === 'string') {
      // limpia cadenas
      return xss(value) as unknown as T;
    }

    if (Array.isArray(value)) {
      // limpia arrays recursivamente
      const sanitizedArray = (value as unknown[]).map((v) => this.sanitize(v));
      return sanitizedArray as unknown as T;
    }

    if (typeof value === 'object' && value !== null) {
      // limpia objetos recursivamente
      const sanitizedObj: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        const field = (value as Record<string, unknown>)[key];
        sanitizedObj[key] = this.sanitize(field);
      }
      return sanitizedObj as T;
    }

    // valores primitivos o null/undefined se devuelven igual
    return value;
  }
}

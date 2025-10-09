import { PipeTransform, Injectable } from '@nestjs/common';
import xss from 'xss';

@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') return xss(value);

    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        value[key] = this.transform(value[key]);
      }
    }
    return value;
  }
}

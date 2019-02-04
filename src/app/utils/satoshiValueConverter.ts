import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'satoshiValueConverter',
  pure: true
})
export class SatoshiValueConverter implements PipeTransform {
  transform(value: number): string {
    try {
      value = Number(value);
      return `${value / 1e8}`;
    } catch (err) {
      console.log('Failed to convert satoshi value');
      return 'NaN';
    }
  }
}

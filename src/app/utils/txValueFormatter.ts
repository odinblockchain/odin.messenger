import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'txValueFormatter',
  pure: true
})
export class TxValueFormatter implements PipeTransform {
  transform(value: number): string {
    try {
      value = Number(value);
      const fixedNum = Number(value).toFixed(8);
      if (Number(fixedNum[fixedNum.length - 1]) <= 5) {
        return `${Number(value.toFixed(7).replace(/\.0+$/,''))}`;
      }
      return fixedNum;
    } catch (err) {
      console.log(`Failed formatting tx value [${value}]`);
      return `${value}`;
    }
  }
}

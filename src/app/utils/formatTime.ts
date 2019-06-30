import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'formatTime',
  pure: true
})
export class FormatTime implements PipeTransform {
  constructor(
  ) { }

  transform(timestamp: number, format: string): string {
    try {
      if (timestamp === 0 || isNaN(timestamp)) return '—';
      if (`${timestamp}`.length === 10) timestamp = Number(timestamp) * 1000;

      return moment(Number(timestamp)).format(format);
    } catch (err) {
      console.log('Failed to convert blocktime');
      return 'NaN';
    }
  }
}

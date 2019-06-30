import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'formatLocalTime',
  pure: true
})
export class FormatLocalTime implements PipeTransform {
  constructor(
  ) { }

  transform(timestamp: number): string {
    try {
      if (timestamp === 0 || isNaN(timestamp)) return '—';
      if (`${timestamp}`.length === 10) timestamp = Number(timestamp) * 1000;

      const time = moment(Number(timestamp));
      if (time.isSame(moment(), 'day')) {
        return `Today, ${time.format('h:mm A')}`;
      } else if (time.isSame(moment(), 'year')) {
        return `${time.format('MMM D')} AT ${time.format('h:mm A')}`;
      } else {
        return `${time.format('MMM D, YYYY')} AT ${time.format('h:mm A')}`;
      }
    } catch (err) {
      console.log('Failed to convert formatLocalTime');
      return '–';
    }
  }
}

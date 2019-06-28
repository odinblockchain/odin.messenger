import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'relativeTime',
  pure: true
})
export class RelativeTime implements PipeTransform {
  constructor(
  ) { }

  transform(blocktime: number): string {
    try {
      if (blocktime === 0 || isNaN(blocktime)) {
        return '—';
      }

      const timeFormats = [
        'year',
        'month',
        'week',
        'day',
        'hour',
        'minute',
        'second'
      ];

      if (`${blocktime}`.length <= 10) blocktime = Number(blocktime) * 1000;

      const now   = moment();
      const then  = moment(blocktime);

      const format: any = timeFormats.find((time: any) => {
        return (now.diff(then, time) > 0)
      });
      
      const timeDiff = now.diff(then, format);
      if (timeDiff === 1) return `${timeDiff} ${format} ago`;
      else return `${timeDiff} ${format}s ago`;
    } catch (err) {
      console.log(`[App::Util::RelativeTime]
        Error: Failed to convert blocktime
        Blocktime: ${blocktime}
      `);

      return '—';
    }
  }
}

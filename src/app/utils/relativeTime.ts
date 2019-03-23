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
      let timeFormats = [
        'year',
        'month',
        'week',
        'day',
        'hour',
        'minute',
        'second'
      ];

      let now   = moment();
      let then  = moment(Number(blocktime) * 1000);

      let format: any = timeFormats.find((time: any) => {
        return (now.diff(then, time) > 0)
      });
      
      let timeDiff = now.diff(then, format);
      if (timeDiff === 1) return `${timeDiff} ${format} ago`;
      else return `${timeDiff} ${format}s ago`;

      // return `>>${format}`;

      // if (now.diff(then, 'years') > 0) return `${now.diff(then, 'years')} years ago`;
      // else if (now.diff(then, 'months') > 0) return `${now.diff(then, 'months')} months ago`;
      // else if (now.diff(then, 'weeks') > 0) return `${now.diff(then, 'weeks')} weeks ago`;
      // else if (now.diff(then, 'days') > 0) return `${now.diff(then, 'days')} days ago`;
      // else if (now.diff(then, 'hours') > 0) return `${now.diff(then, 'hours')} hours ago`;
      // else if (now.diff(then, 'minutes') > 0) return `${now.diff(then, 'minutes')} minutes ago`;
      // else if (now.diff(then, 'seconds') > 0) return `${now.diff(then, 'seconds')} seconds ago`;
      
      // if (now.diff())
      // return `nice>${blocktime}`;
    } catch (err) {
      console.log('Failed to convert blocktime');
      return 'NaN';
    }
  }
}

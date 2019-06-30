import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';

@Pipe({
  name: 'reverse',
  pure: true
})
export class Reverse implements PipeTransform {
  constructor(
  ) { }

  transform(value: any): any {
    try {
      return value.reverse();
    } catch (err) {
      return value;
    }
  }
}

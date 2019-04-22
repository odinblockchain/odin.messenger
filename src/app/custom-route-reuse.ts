import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { NSLocationStrategy } from 'nativescript-angular/router/ns-location-strategy';
import { NSRouteReuseStrategy } from 'nativescript-angular/router/ns-route-reuse-strategy';

@Injectable()
export class CustomRouteReuse extends NSRouteReuseStrategy {
  constructor(location: NSLocationStrategy) {
    super(location);
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot): boolean {
    // first use the global Reuse Strategy evaluation function,
    // which will return true, when we are navigating from the same component to itself
    let shouldReuse = super.shouldReuseRoute(future, current);

    // then check if the noReuse flag is set to true
    // if true, then don't reuse this component
    if (shouldReuse && current.data.noReuse) {
      shouldReuse = false;
    }

    return shouldReuse;
  }
}

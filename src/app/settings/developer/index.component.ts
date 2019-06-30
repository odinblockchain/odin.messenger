import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { PreferencesService } from '~/app/shared/preferences.service';
import { LogService } from '~/app/shared/services/log.service';
import { Log } from '~/app/shared/models/log.model';
import { RadListView } from 'nativescript-ui-listview';
import { Subscription } from 'rxjs';
import { Page } from 'tns-core-modules/ui/page/page';

const firebase = require('nativescript-plugin-firebase');

@Component({
  selector: 'Developer',
  moduleId: module.id,
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class DeveloperComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('listView') lv: ElementRef;
  list: RadListView;

  public subItems: Log[] = [];
  private _sub: Subscription;

  constructor(
    private _preferences: PreferencesService,
    private _router: RouterExtensions,
    private _logs: LogService,
    private _zone: NgZone,
    private _page: Page
  ) {
    if (!this._preferences.preferences.hasOwnProperty('developer')) {
      this._preferences.savePreferences({
        ...this._preferences.preferences,
        developer: false
      });
    }

    this._page.on(Page.unloadedEvent, event => {
      this.ngOnDestroy();
    });
  }

  ngAfterViewInit() {
    this.list = this.lv.nativeElement;
  }

  ngOnInit() {
    if (!this._preferences.preferences.developer) {
      this.onPreviousView();
      return;
    }
    
    this._sub = this._logs.log$.subscribe(list => {
      this._zone.run(() => {
        this.subItems = list.reverse();
      });
    });

    firebase.analytics.setScreenName({
      screenName: 'Settings Developer'
    }).then(() => {});
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
  }

  public onPreviousView() {
    this._router.navigate(['/settings'], {
      transition: {
        name: 'slideRight'
      },
    });
  }
}

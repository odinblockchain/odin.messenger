import { Component } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { PreferencesService } from '~/app/shared/preferences.service';
import { messaging } from 'nativescript-plugin-firebase/messaging';
import { SnackBar } from '@nstudio/nativescript-snackbar';
import { IdentityService } from '~/app/shared/services/identity.service';
import { connectionType, getConnectionType } from 'tns-core-modules/connectivity';

const firebase = require('nativescript-plugin-firebase');

@Component({
  selector: 'Metrics',
  moduleId: module.id,
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent {
  public metricPreferences: any;

  constructor(
    private _preferences: PreferencesService,
    private _router: RouterExtensions
  ) {
    if (!this._preferences.preferences.hasOwnProperty('metrics')) {
      this._preferences.preferences.metrics = {};
    }

    if (!this._preferences.preferences.metrics.hasOwnProperty('analytics')) {
      this._preferences.preferences.metrics.analytics = true;
    }

    this._preferences.savePreferences();
    this.metricPreferences = this._preferences.preferences.metrics;

    firebase.analytics.setScreenName({
      screenName: 'Settings Metrics'
    }).then(() => {});
  }

  public async togglePreference(key: string) {
    if (this.metricPreferences.hasOwnProperty(key)) {
      this.metricPreferences[key] = !this.metricPreferences[key];
    } else {
      this.metricPreferences[key] = true;
    }

    this._preferences.savePreferences();

    if (key === 'analytics') {
      if (this.metricPreferences[key] === true) this._captureEnableAnalytics();
      else this._captureDisableAnalytics();
    }
  }

  public onPreviousView() {
    this._router.navigate(['/settings'], {
      transition: {
        name: 'slideRight'
      },
    });
  }

  private _captureEnableAnalytics() {
    firebase.analytics.setAnalyticsCollectionEnabled(true);

    firebase.analytics.logEvent({
      key: 'settings_metrics_analytics_enable'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Settings Metrics Analytics Enable'); });
  }

  private _captureDisableAnalytics() {
    firebase.analytics.logEvent({
      key: 'settings_metrics_analytics_disable'
    })
    .then(() => {
      firebase.analytics.setAnalyticsCollectionEnabled(false);
      console.log('[Analytics] Metric logged >> Settings Metrics Analytics Disable');
    });
  }
}

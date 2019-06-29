import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';

import { IndexComponent } from './index/index.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { IdentityComponent } from './identity/identity.component';
import { MetricsComponent } from './metrics/metrics.component';
import { DeveloperComponent } from './developer/index.component';

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'identity', component: IdentityComponent },
  { path: 'metrics', component: MetricsComponent },
  { path: 'developer', component: DeveloperComponent }
];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes)
  ],
  exports: [
    NativeScriptRouterModule
  ]
})
export class SettingsRoutingModule { }

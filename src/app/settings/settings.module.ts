import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';

import { SettingsRoutingModule } from './settings-routing.module';
import { IndexComponent } from './index/index.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { IdentityComponent } from './identity/identity.component';
import { UIModule } from '../shared/ui/ui.module';
import { MetricsComponent } from './metrics/metrics.component';
import { DeveloperComponent } from './developer/index.component';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular/listview-directives';
import { FormatTime } from '../utils/formatTime';
import { Reverse } from '../utils/reverse';

@NgModule({
  imports: [
    NativeScriptUIListViewModule,
    UIModule,
    NativeScriptFormsModule,
    NativeScriptCommonModule,
    SettingsRoutingModule
  ],
  declarations: [
    FormatTime,
    Reverse,
    IndexComponent,
    NotificationsComponent,
    IdentityComponent,
    MetricsComponent,
    DeveloperComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class SettingsModule { }

import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { IndexComponent } from "./index/index.component";
import { NotificationsComponent } from "./notifications/notifications.component";

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'notifications', component: NotificationsComponent }
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

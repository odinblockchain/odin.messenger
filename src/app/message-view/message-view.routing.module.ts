import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { MessageViewComponent } from './message-view.component';

const routes: Routes = [
  { path: ":contactId", component: MessageViewComponent }
];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes)
  ],
  exports: [
    NativeScriptRouterModule
  ]
})
export class MessageViewRoutingModule { }

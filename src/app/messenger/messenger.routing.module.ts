import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { IndexComponent } from "./index/index.component";
import { MessageComponent } from "./message/message.component";

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'message/:contactId', component: MessageComponent }
];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes)
  ],
  exports: [
    NativeScriptRouterModule
  ]
})
export class MessengerRoutingModule { }

import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { MessengerComponent } from './messenger.component';
import { MessageComponent } from "./message/message.component";

const routes: Routes = [
  { path: "", component: MessengerComponent },
  { path: "message/:contactId", component: MessageComponent }
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

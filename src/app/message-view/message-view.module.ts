import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { MessageViewRoutingModule } from './message-view.routing.module';
import { MessageViewComponent } from './message-view.component';

@NgModule({
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    MessageViewRoutingModule
  ],
  declarations: [
    MessageViewComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class MessageViewModule { }

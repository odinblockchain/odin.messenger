/* Core */
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

/* Routing */
import { MessengerRoutingModule } from './messenger.routing.module';

/* Components */
import { MessengerComponent } from './messenger.component';
import { MessageComponent } from "./message/message.component";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    MessengerRoutingModule
  ],
  declarations: [
    MessengerComponent,
    MessageComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class MessengerModule { }
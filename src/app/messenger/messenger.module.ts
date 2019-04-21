/* Core */
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';

/* Routing */
import { MessengerRoutingModule } from './messenger.routing.module';

/* Components */
import { MessageComponent } from "./message/message.component";
import { IndexComponent } from "./index/index.component";

@NgModule({
  imports: [
    NativeScriptUIListViewModule,
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    MessengerRoutingModule
  ],
  declarations: [
    IndexComponent,
    MessageComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class MessengerModule { }

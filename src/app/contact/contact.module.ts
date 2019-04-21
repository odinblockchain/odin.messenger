import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms"

import { ContactRoutingModule } from './contact.routing.module';
import { AddComponent } from './add/add.component';

@NgModule({
  imports: [
    NativeScriptCommonModule,
    ContactRoutingModule,
    NativeScriptFormsModule
  ],
  declarations: [
    AddComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class ContactModule { }

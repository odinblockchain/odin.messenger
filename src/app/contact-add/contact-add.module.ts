import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms"

import { ContactAddRoutingModule } from './contact-add.routing.module';
import { ContactAddComponent } from './contact-add.component';

@NgModule({
  imports: [
    NativeScriptCommonModule,
    ContactAddRoutingModule,
    NativeScriptFormsModule
  ],
  declarations: [
    ContactAddComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class ContactAddModule { }

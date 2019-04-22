import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms"

import { ContactRoutingModule } from './contact.routing.module';
import { AddComponent } from './add/add.component';
import { EditComponent } from "./edit/edit.component";
import { UIModule } from "~/app/shared/ui/ui.module";

@NgModule({
  imports: [
    UIModule,
    NativeScriptCommonModule,
    ContactRoutingModule,
    NativeScriptFormsModule
  ],
  declarations: [
    AddComponent,
    EditComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class ContactModule { }

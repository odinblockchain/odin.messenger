import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms"

import { ContactRoutingModule } from './contact.routing.module';
import { AddComponent } from './add/add.component';
import { EditComponent } from "./edit/edit.component";
import { InputFieldComponent } from "~/app/shared/ui/input-field/input-field.component";
import { RoundButtonComponent } from "~/app/shared/ui/round-button/round-button.component";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    ContactRoutingModule,
    NativeScriptFormsModule
  ],
  declarations: [
    InputFieldComponent,
    RoundButtonComponent,
    AddComponent,
    EditComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class ContactModule { }

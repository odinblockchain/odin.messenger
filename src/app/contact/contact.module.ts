/** Core */
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms"

/** Routing */
import { ContactRoutingModule } from './contact.routing.module';

/** Components */
import { UIModule } from "~/app/shared/ui/ui.module";
import { AddComponent } from './add/add.component';
import { EditComponent } from "./edit/edit.component";
import { ListComponent } from "./list/list.component";

@NgModule({
  imports: [
    UIModule,
    NativeScriptCommonModule,
    ContactRoutingModule,
    NativeScriptFormsModule
  ],
  declarations: [
    ListComponent,
    AddComponent,
    EditComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class ContactModule { }

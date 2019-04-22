import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";


import { AddComponent } from './add/add.component';
import { EditComponent } from "./edit/edit.component";

const routes: Routes = [
  { path: 'add', component: AddComponent },
  { path: 'edit/:contactUsername', component: EditComponent, data: { noReuse: true } }
];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes)
  ],
  exports: [
    NativeScriptRouterModule
  ]
})
export class ContactRoutingModule { }

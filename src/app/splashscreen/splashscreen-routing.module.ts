import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { SplashscreenComponent } from "./splashscreen.component";

const routes: Routes = [
    { path: "", component: SplashscreenComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class SplashscreenRoutingModule { }

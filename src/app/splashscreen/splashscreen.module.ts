import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { SplashscreenRoutingModule } from "./splashscreen-routing.module";
import { SplashscreenComponent } from "./splashscreen.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        SplashscreenRoutingModule
    ],
    declarations: [
        SplashscreenComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class SplashscreenModule { }

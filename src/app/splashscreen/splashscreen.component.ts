import { Component, ElementRef, ViewChild, OnInit } from "@angular/core";
import { Page } from "ui/page";
import { alert } from "tns-core-modules/ui/dialogs";

@Component({
    selector: "Splashscreen",
    moduleId: module.id,
    templateUrl: "./splashscreen.component.html",
    styleUrls: ['./splashscreen.component.scss']
})
export class SplashscreenComponent implements OnInit {
  @ViewChild("createAccountBtn") createAccountBtnRef: ElementRef;

  constructor(page: Page) {
    page.actionBarHidden = true;
  }
  
  ngOnInit(): void {
  }

  onImport(): void {
    alert('ODIN Account importing is not available at this time.');
  }
}

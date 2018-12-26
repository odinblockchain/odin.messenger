import { Component, ElementRef, ViewChild, OnInit } from "@angular/core";
import { Page } from "ui/page";

@Component({
    selector: "Splashscreen",
    moduleId: module.id,
    templateUrl: "./splashscreen.component.html",
    styleUrls: ['./splashscreen.component.scss']
})
export class SplashscreenComponent implements OnInit {

  constructor(page: Page) {
    page.actionBarHidden = true;
  }

  ngOnInit(): void {
  }
}

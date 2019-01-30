import { Component, OnInit } from "@angular/core";
import { Page } from "ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { UserModel } from "~/app/shared/user.model";

@Component({
    selector: "Splashscreen",
    moduleId: module.id,
    templateUrl: "./home.component.html",
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(
    private _page: Page,
    private _router: RouterExtensions,
    private _user: UserModel) {
    this._page.actionBarHidden = true;
  }

  ngOnInit(): void {
    if (this._user.saveData.registered) {
      console.log('>> Session exists, redirect to messages home');
      this._router.navigate(['/messages'], { clearHistory: true });
    } else {
      console.log('>> No session exists, redirect to splashscreen');
      this._router.navigate(['/splashscreen'], { clearHistory: true });
    }
  }
}


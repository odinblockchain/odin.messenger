import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { View } from "tns-core-modules/ui/core/view";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { alert } from "ui/dialogs";
import * as app from "tns-core-modules/application";
import * as appSettings from "application-settings";
import { UserModel } from '../shared/user.model';

@Component({
  selector: "Settings",
  moduleId: module.id,
  templateUrl: "./settings.component.html",
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  // @ViewChild("btn") btnRef: ElementRef;
  @ViewChild("item") angularItem: ElementRef;

  private item: View;
  private btnItem: View;

  public num: string;
  public str: string;
  public bool: boolean;
  
  constructor(
    private _user: UserModel
  ) {
    // Use the component constructor to inject providers.
    this.num = '0';
    this.str = '';
    this.bool = false;
  }

  ngOnInit(): void {
    // Init your component properties here.
    const num   = appSettings.getNumber("someNumber", 0);
    this.num    = num === 0 ? '0' : num.toString();
    this.str    = appSettings.getString("someString", "");
    this.bool   = appSettings.getBoolean("someBoolean", false);
    // this.btnItem = this.btnRef.nativeElement;
    this.item = this.angularItem.nativeElement;

    // this.btnItem.translateY = -50;
    this.item.scaleX = 0;
    this.item.scaleY = 0;
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  saveNumber() {
    console.log('save number', this.num);

    if (!isNaN(parseFloat(this.num))) {
      appSettings.setNumber("someNumber", parseFloat(this.num));
      alert("You saved: " + appSettings.getNumber("someNumber"));
    }
  }

  removeNumber() {
    appSettings.remove("someNumber");
    this.num = "";
    alert("You removed the number from app settings!");
  }

  saveString() {
    appSettings.setString("someString", this.str);
    alert("You saved: " + appSettings.getString("someString"));
  }

  removeString() {
    appSettings.remove("someString");
    this.str = "";
    alert("You removed the string from app settings!");
  }

  saveBoolean() {
    appSettings.setBoolean("someBoolean", this.bool);
    alert("You saved: " + appSettings.getBoolean("someBoolean"));
  }

  removeBoolean() {
    appSettings.remove("someBoolean");
    this.bool = false;
    alert("You removed the boolean from app settings!");
  }

  async onClearSession() {
    console.log('>> Working to clear OSM session');
    await this._user.clearSession();

    alert({
      title: "OSM Session Cleared",
      message: "We've cleared the local OSM identity session from this device. To restore your identity, you must import your details again using the mnemonic phrase you backed up.",
      okButtonText: "Ok"
    });
  }

  removeAll() {

    console.log('removeall');

    this.item.animate({
      scale: { x: 1.6, y: 1.6 },
      duration: 300
    }).then(() => {

      this.item.animate({ scale: { x: 1, y: 1 }, duration: 200 });
      appSettings.clear();
      this.num = "";
      this.str = "";
      this.bool = false;
      
      alert("All app settings values have been cleared!");
    });

    // this.btnItem.animate({
    //   translate: { x: 0, y: 0 },
    //   duration: 200
    // }).then(() => {

      

    //   this.item.animate({
    //     scale: { x: 1.6, y: 1.6 },
    //     duration: 300
    //   }).then(() => {
    //     this.item.animate({ scale: { x: 1, y: 1 }, duration: 200 })
    //   });
    // });
  }
}

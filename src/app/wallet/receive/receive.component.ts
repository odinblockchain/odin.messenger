import { Component, OnInit, Input, Output, EventEmitter, OnChanges, AfterContentChecked, NgZone } from '@angular/core';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { Address } from '~/app/shared/models/wallet';
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar } from "nativescript-snackbar";

@Component({
	moduleId: module.id,
	selector: 'Receive',
	templateUrl: './receive.component.html',
	styleUrls: ['./receive.component.css']
})

export class ReceiveComponent implements OnInit, OnChanges {
  @Input() addresses: ObservableArray<Address>;
  @Output() requestNewAddress = new EventEmitter();

  public freshAddress: Address;
  public freshAddressHelp: boolean;
  public usedAddressHelp: boolean;

  private _snackBar: SnackBar;

	constructor() {
    this._snackBar = new SnackBar();
    this.freshAddressHelp = false;
    this.usedAddressHelp = false;
  }

	ngOnInit() { }

  ngOnChanges() {
    if (!this.addresses || !this.addresses.length) return;

    const copy = this.addresses.slice(0);
    this.freshAddress = copy.find(address => {
      return !!(address.external && !address.used);
    });

    if (!this.freshAddress) {
      this.requestNewAddress.emit();
    }
  }

  public toggleFreshAddressHelp() {
    this.freshAddressHelp = !this.freshAddressHelp;
  }

  public toggleUsedAddressHelp() {
    this.usedAddressHelp = !this.usedAddressHelp;
  }

  public usedAddressFilter(item: Address): boolean {
    return !!(item.external === true &&
              item.used === true);
  }

  public onCopyText(text: string) {
    Clipboard.setText(text)
    .then(async () => {
      try {
        await this._snackBar.simple('Copied address to clipboard!', '#ffffff', '#333333', 3, false);
      } catch (err) {
        console.log('Unable to copy address to clipboard');
        console.log(err);
      }
    });
  }
}

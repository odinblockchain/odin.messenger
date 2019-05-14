import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { Address } from '~/app/shared/models/wallet';
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar } from "nativescript-snackbar";

const firebase = require('nativescript-plugin-firebase');

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
    this._captureMoreInfoFresh();
  }

  public toggleUsedAddressHelp() {
    this.usedAddressHelp = !this.usedAddressHelp;
    this._captureMoreInfoUsed();
  }

  public usedAddressFilter(item: Address): boolean {
    return !!(item.external === true &&
              item.used === true);
  }

  public copyFreshAddress(address: string) {
    this.onCopyText(address);
    this._captureCopyFreshAddress();
  }

  public copyUsedAddress(address: string) {
    this.onCopyText(address);
    this._captureCopyUsedAddress();
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

  private _captureMoreInfoFresh() {
    firebase.analytics.logEvent({
      key: 'wallet_more_info_fresh'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Wallet More Info Fresh'); });
  }

  private _captureMoreInfoUsed() {
    firebase.analytics.logEvent({
      key: 'wallet_more_info_fresh'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Wallet More Info Used'); });
  }

  private _captureCopyFreshAddress() {
    firebase.analytics.logEvent({
      key: 'wallet_copy_fresh'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Wallet Copy Fresh'); });
  }

  private _captureCopyUsedAddress() {
    firebase.analytics.logEvent({
      key: 'wallet_copy_used'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Wallet Copy Used'); });
  }
}

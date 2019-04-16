import { Component, OnInit, Input, Output, EventEmitter, OnChanges, AfterContentChecked, NgZone } from '@angular/core';
import { WalletModel } from '~/app/shared/wallet.model';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { Address, Wallet } from '~/app/shared/models/wallet';
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
import { WalletService } from '~/app/shared/services';
import { timestamp } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
	moduleId: module.id,
	selector: 'Receive',
	templateUrl: './receive.component.html',
	styleUrls: ['./receive.component.css']
})

export class ReceiveComponent implements OnInit, OnChanges {
  @Input() selectedWalletId: number;
  @Input() currentWallet: Wallet;
  @Input() addresses: ObservableArray<Address>;
  // @Output() walletSelected: EventEmitter<any> = new EventEmitter();

  public usedExternalAddresses: Array<any>;
  public unusedAddress: any;
  public selectedWallet: Wallet;

  private _snackBar: SnackBar;
  private _walletSub: Subscription;

  public freshAddress: Address;
  public usedAddresses: ObservableArray<Address>;

	constructor(
    private _wallet: WalletModel,
    private _WalletServ: WalletService,
    private _zone: NgZone
  ) {
    this._snackBar = new SnackBar();
    this.usedExternalAddresses = [];
    this.unusedAddress = {};
  }

	ngOnInit() {
    this.selectedWallet = this._WalletServ.wallets$.getItem(this.selectedWalletId);
  }

  ngOnChanges() {
    console.log('RECEIVE ON CHANGE', this.addresses);
    console.log(this.selectedWalletId, this.selectedWallet);
    console.log(this.currentWallet);

    if (!this.addresses) return;

    this._zone.run(() => {
      const copy = this.addresses.slice(0);
      this.freshAddress = copy.find(address => {
        return !!(address.external && !address.used);
      });

      // this.usedAddresses = this.addresses.filter(address => {
      //   return this.usedAddressFilter(address);
      // })

      console.log('COPY', copy.length);
      console.log('ORG', this.addresses.length);
      console.log('FRSH', this.freshAddress.serialize());
    });

    return true;
    // const copy = this.addresses.slice(0);
    // this.freshAddress = copy.find(address => {
    //   return !!(address.external && !address.used);
    // });

    // console.log('COPY', copy.length);
    // console.log('ORG', this.addresses.length);
    // console.log('FRSH', this.freshAddress.serialize());

    // console.log('FRESH ADDRESS', {
    //   id: this.freshAddress.id,
    //   bip44: this.freshAddress.bip44_index,
    //   addr: this.freshAddress.address
    // });
  }

  public usedAddressFilter(item: Address): boolean {
    console.log(`>> CHECK ${item.address} (${item.external} ${item.used})`);
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

  // ngOnChanges(simpleChanges: any) {
  //   console.log('[Wallet >> Receive] onChanges');
  //   // console.dir(simpleChanges);

  //   try {
  //     if (this.currentWallet.external.length) {
  //       this.usedExternalAddresses = this.currentWallet.external.filter(address => {
  //         if (address.balance.confirmed > 0 || address.balance.unconfirmed > 0) {
  //           return true;
  //         } else {
  //           return false;
  //         }
  //       });
  
  //       this.unusedAddress = this.currentWallet.external.find(address => {
  //         if (address.balance.confirmed === 0 && address.balance.unconfirmed === 0) {
  //           return true;
  //         } else {
  //           return false;
  //         }
  //       });
  //     } else {
  //       this.usedExternalAddresses = [];
  //     }
  //   } catch(err) {
  //     console.log('[Wallet Receive] Current Wallet not loaded yet');
  //   }
  // }

  // public proxyWalletSelection(selectedWalletId: number) {
  //   this.walletSelected.next(selectedWalletId);
  // }
}

import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { alert, confirm } from "tns-core-modules/ui/dialogs";
import { Wallet } from '~/app/shared/models/wallet';
import { Subscription } from 'rxjs';

interface TransactionDetails {
  amount: number,
  address: string
};

@Component({
	moduleId: module.id,
	selector: 'Send',
	templateUrl: './send.component.html',
	styleUrls: ['./send.component.css']
})
export class SendComponent implements OnInit, OnChanges, OnDestroy {
  @Input() currentWallet: Wallet;
  @Input() sendTransactionFn: any;

  public transactionDetails: TransactionDetails;
  public TX_FEE = 0.0001;

  private _walletSub: Subscription;

	constructor() {
    this.transactionDetails = {
      amount: null,
      address: null
    };

    this.onReturnPress = this.onReturnPress.bind(this);
    this.onWalletEvent = this.onWalletEvent.bind(this);
  }

  onWalletEvent(eventName) {
    if (eventName === 'TransactionSent') {
      this.transactionDetails.address = '';
      this.transactionDetails.amount  = 0;
    }
  }

  ngOnInit() { }

  ngOnChanges() {
    if (this.currentWallet && !this._walletSub) {
      this._walletSub = this.currentWallet.eventStream$.subscribe(this.onWalletEvent);
    }
  }

  ngOnDestroy() {
    if (this._walletSub) this._walletSub.unsubscribe();
  }

  public onAmountFocus(event): any {
    if (this.transactionDetails.amount === 0) {
      this.transactionDetails.amount = null;
    }
  }
  
  public onReturnPress(event): any {

    if (!this.sendTransactionFn) return;

    if (!this.transactionDetails.address || this.transactionDetails.address.length === 0) {
      return alert('You must enter a valid ODIN Address to send ODIN too.');
    }

    if (!this.transactionDetails.amount || isNaN(this.transactionDetails.amount)) {
      return alert('You must enter a valid amount of ODIN to send.');
    }

    const amount  = Wallet.TX_FEE + Number(this.transactionDetails.amount);
    const value   = parseInt((amount * 1e8).toFixed(0));

    if (this.currentWallet.balance_conf < value) {
      return alert('Transaction failed!\n\n'
      +`Wallet Balance:     ${this.formatBalance(this.currentWallet.balance_conf)} Ø\n\n`
      +`Transaction Fee:    ${this.TX_FEE} Ø\n\n`
      +`Transaction Total:  ${this.formatBalance(value)}`);
    }
    
    confirm({
      title: "Confirm Transaction",
      message: `Sending ${this.transactionDetails.amount} ODIN\n`
                + `To ${this.transactionDetails.address}\n\n`
                + 'Send this transaction?',
      okButtonText: "Send",
      cancelButtonText: "Cancel Transaction",
    })
    .then(result => {
      console.log(result);
      console.log('working');
      if (result) this.sendTransactionFn(this.transactionDetails);
    });
  }

  private formatBalance(amount: number): number {
    return Number((amount / 1e8).toFixed(8));
  }
}

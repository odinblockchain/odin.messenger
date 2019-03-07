import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { confirm, alert } from "tns-core-modules/ui/dialogs";
import { WalletModel } from '~/app/shared/wallet.model';

interface TransactionDetails {
  amount: number,
  recipient: string
};

@Component({
	moduleId: module.id,
	selector: 'Send',
	templateUrl: './send.component.html',
	styleUrls: ['./send.component.css']
})
export class SendComponent implements OnInit {
  @Input() selectedWalletId: number;
  @Input() currentWallet: any;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

  public transactionDetails: TransactionDetails;
  public TX_FEE = 0.0001;

	constructor(
    private _wallet: WalletModel
  ) {
    this.transactionDetails = {
      amount: null,
      recipient: null
    };

    this.onReturnPress = this.onReturnPress.bind(this);
    this.processTransaction = this.processTransaction.bind(this);
  }

  ngOnInit() { }
  
  public onReturnPress(event): any {
    console.log('send', this.currentWallet.balance);

    if (!this.transactionDetails.recipient || this.transactionDetails.recipient.length === 0) {
      return alert('You must enter a valid ODIN Address to send ODIN too.');
    }

    if (!this.transactionDetails.amount || isNaN(this.transactionDetails.amount)) {
      return alert('You must enter a valid amount of ODIN to send.');
    }

    let walletBalance = this.currentWallet.balance.confirmed;
    let amountNeeded = (this.TX_FEE + Number(this.transactionDetails.amount)) * 1e8;

    if (walletBalance < amountNeeded) {
      return alert(`The amount you are trying to send exceeds your current balance of ${(walletBalance / 1e8).toFixed(8)} ODIN. All transactions incur a fee of ${this.TX_FEE} ODIN.\n\nPlease adjust the amount or deposit more ODIN into your mobile wallet.`);
    }
    
    confirm({
      title: "Confirm Transaction",
      message: `Please confirm your transaction of ${(amountNeeded / 1e8).toFixed(8)} ODIN to ${this.transactionDetails.recipient}.\n\nA transaction fee of ${this.TX_FEE} ODIN has been applied.\n\n`,
      okButtonText: "Confirm",
      cancelButtonText: "Cancel Transaction",
    })
    .then(result => {
      console.log(result);
      if (result) this.processTransaction(this.transactionDetails);
    });
  }

  private processTransaction({ recipient, amount }) {
    console.log(`Sending [${amount}] to [${recipient}]`);
    let unspent = this.currentWallet.unspent.slice(0).sort((tx1, tx2) => {
      if (tx1['height'] < tx2['height']) return -1;
      else if (tx1['height'] > tx2['height']) return 1;
      return 0;
    });

    let coinControl = unspent.reduce((txArr, tx) => {
      let sum = txArr.reduce((sum, _tx) => sum += _tx['value'], 0);
      if (sum <= (amount * 1e8)) {
        txArr.push(tx);
      }

      return txArr;
    }, []);

    this._wallet.sendTransaction(this.currentWallet, recipient, amount, coinControl, this.TX_FEE)
    .then((txid) => {
      alert(`Transaction Sent!\n\nTXID:\n${txid}\n\nPlease allow a few minutes for this transaction to appear in your mobile wallet.`);
    })
    .catch((err) => {
      console.log('err', err);
      alert('error');
    })
  }

  public proxyWalletSelection(selectedWalletId: number) {
    this.walletSelected.next(selectedWalletId);
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { alert, confirm } from "tns-core-modules/ui/dialogs";
import { Wallet } from '~/app/shared/models/wallet';
import { WalletModel } from '~/app/shared/wallet.model';

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
export class SendComponent implements OnInit {
  // @Input() selectedWalletId: number;
  @Input() currentWallet: Wallet;
  @Input() sendTransactionFn: any;
  // @Output() walletSelected: EventEmitter<any> = new EventEmitter();

  public transactionDetails: TransactionDetails;
  public TX_FEE = 0.0001;

	constructor(
    private _wallet: WalletModel
  ) {
    this.transactionDetails = {
      amount: null,
      address: null
    };

    this.onReturnPress = this.onReturnPress.bind(this);
    // this.processTransaction = this.processTransaction.bind(this);
  }

  ngOnInit() { }

  private formatBalance(amount: number): number {
    return Number((amount / 1e8).toFixed(8));
  }
  
  public onReturnPress(event): any {

    if (!this.sendTransactionFn) return;

    // console.log('send', this.currentWallet.balance);
    console.log('BALANCE', this.currentWallet.balance_conf);
    console.log('MIN', (this.TX_FEE + Number(this.transactionDetails.amount)) * 1e8);

    if (!this.transactionDetails.address || this.transactionDetails.address.length === 0) {
      return alert('You must enter a valid ODIN Address to send ODIN too.');
    }

    if (!this.transactionDetails.amount || isNaN(this.transactionDetails.amount)) {
      return alert('You must enter a valid amount of ODIN to send.');
    }

    const sendAmount = (this.TX_FEE + Number(this.transactionDetails.amount)) * 1e8;

    

    if (this.currentWallet.balance_conf < sendAmount) {
      return alert('Transaction failed!\n\n'
      +`Wallet Balance:     ${this.formatBalance(this.currentWallet.balance_conf)} Ø\n\n`
      +`Transaction Fee:    ${this.TX_FEE} Ø\n\n`
      +`Transaction Total:  ${this.formatBalance(sendAmount)}`);
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

  // private processTransaction({ address, amount }) {
  //   console.log(`Sending [${amount}] to [${address}]`);
  //   let unspent = this.currentWallet.unspent.slice(0).sort((tx1, tx2) => {
  //     if (tx1['height'] < tx2['height']) return -1;
  //     else if (tx1['height'] > tx2['height']) return 1;
  //     return 0;
  //   });

  //   let coinControl = unspent.reduce((txArr, tx) => {
  //     let sum = txArr.reduce((sum, _tx) => sum += _tx['value'], 0);
  //     if (sum <= (amount * 1e8)) {
  //       txArr.push(tx);
  //     }

  //     return txArr;
  //   }, []);

  //   this._wallet.sendTransaction(this.currentWallet, address, amount, coinControl, this.TX_FEE)
  //   .then((txid) => {
  //     alert(`Transaction Sent!\n\nTXID:\n${txid}\n\nPlease allow a few minutes for this transaction to appear in your mobile wallet.`);
  //   })
  //   .catch((err) => {
  //     console.log('err', err);
  //     alert('error');
  //   })
  // }

  // public proxyWalletSelection(selectedWalletId: number) {
  //   this.walletSelected.next(selectedWalletId);
  // }
}

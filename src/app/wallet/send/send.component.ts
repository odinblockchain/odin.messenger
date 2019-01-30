import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { confirm } from "tns-core-modules/ui/dialogs";

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
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

  public transactionDetails: TransactionDetails;
  public TX_FEE = 0.0001;

	constructor() {
    this.transactionDetails = {
      amount: null,
      recipient: null
    };
  }

  ngOnInit() { }
  
  public onReturnPress(event): void {
    console.log('send');
    confirm({
      title: "Confirm Transaction",
      message: `Please confirm your transaction of ${this.transactionDetails.amount} ODIN to ${this.transactionDetails.recipient}.\n\nA static transaction fee of ${this.TX_FEE} will be applied.\n\n`,
      okButtonText: "Confirm",
      cancelButtonText: "Cancel Transaction",
    })
    .then(result => {
      console.log(result);
    })
  }

  public proxyWalletSelection(selectedWalletId: number) {
    this.walletSelected.next(selectedWalletId);
  }
}

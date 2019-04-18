import { Component, OnInit, Input } from '@angular/core';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { Transaction, Wallet } from '~/app/shared/models/wallet';
import { confirm } from "tns-core-modules/ui/dialogs";
import * as utilityModule from "utils/utils";

@Component({
	moduleId: module.id,
	selector: 'Overview',
	templateUrl: './overview.component.html',
	styleUrls: ['./overview.component.css']
})

export class OverviewComponent implements OnInit {
  @Input() currentWallet: Wallet;
  @Input() blockheight: number;
  @Input() transactions: ObservableArray<Transaction>;

  constructor() { }
  
  ngOnInit() { }

  public onTap(tx: Transaction) {
    if (!this.currentWallet || !this.currentWallet.coin || !this.currentWallet.coin.explorer_host)
      return;
    if (!tx || !tx.txid)
      return;

    confirm({
      title: 'Open in Blockexplorer?',
      message: 'Would you like to view this transaction in the official Blockexplorer?',
      okButtonText: 'Yes',
      cancelButtonText: 'No'
    })
    .then(open => {
      if (open) utilityModule.openUrl(this.currentWallet.coin.explorer_host + `tx/${tx.txid}`);
    }).catch(console.log);
  }

  public displayBlockConf(item: Transaction) {
    if (!item || !item.hasOwnProperty('height')) return '';
    if (this.blockheight <= 0) return ` | Block #${item.height}`;
    else return ` | ${this.blockheight - item.height} conf.`;
  }
}

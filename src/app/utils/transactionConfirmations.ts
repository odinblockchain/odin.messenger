import { Pipe, PipeTransform } from '@angular/core';
import { WalletModel } from '~/app/shared/wallet.model';

@Pipe({
  name: 'transactionConfirmations',
  pure: true
})
export class TransactionConfirmations implements PipeTransform {
  constructor(
    private _wallet: WalletModel
  ) { }

  transform(txBlockheight: number): string {
    try {
      txBlockheight = Number(txBlockheight);
      let confirmations = Number(this._wallet.chainStats.blockheight) - txBlockheight;

      if (confirmations === 0) return 'Just now';
      else if (confirmations === 1)   return '1 conf.';
      else if (confirmations < 100)   return `${confirmations} confs.`;
      else if (confirmations >= 1000) return `>1000 confs.`;
      else if (confirmations >= 10000) return `>10000 confs.`;
    } catch (err) {
      console.log('Failed to convert satoshi value');
      return 'pending';
    }
  }
}

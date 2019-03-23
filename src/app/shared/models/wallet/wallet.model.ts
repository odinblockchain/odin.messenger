import { Database } from '../database.model';
import { Unspent } from './unspent.model';

export class Wallet extends Database {
  id: number;
  coin_name: string;
  account_bip44: number;
  bip44_index: number;
  balance_conf: number;
  balance_unconf: number;
  last_updated: number;
  last_tx_timestamp: number;

  constructor(props: any) {
    super();
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }

  public async upsertUnspent(unspent: Unspent) {
    if (!this.db || !this.db.isOpen()) {
      return false;
    }

    const exists = await this.db.get('SELECT id FROM unspent WHERE wallet_id=? AND txid=?', [
      this.id, unspent.txid
    ]);

    if (!exists) {
      try {
        return await this.db.execSQL(`INSERT INTO unspent (wallet_id, address_id, txid, height, txid_pos, value) values (?, ?, ?, ?, ?, ?)`, [
          this.id,
          unspent.address_id,
          unspent.txid,
          unspent.height,
          unspent.txid_pos,
          unspent.value
        ]);
      } catch (err) {
        console.log(`Unable to insert unspent txid(${unspent.txid}) into wallet(${this.id})`);
        console.log(err);
        return false;
      }
    } else {
      try {
        if (await this.db.execSQL(`UPDATE unspent SET wallet_id=?, address_id=?, txid=?, height=?, txid_pos=?, value=? WHERE wallet_id=? AND txid=?`, [
          this.id,
          unspent.address_id,
          unspent.txid,
          unspent.height,
          unspent.txid_pos,
          unspent.value,
  
          this.id,
          unspent.txid
        ])) {
          return true;
        } else {
          throw new Error(`unspent txid(${unspent.txid}) NOT UPDATED`);
        }
      } catch (err) {
        console.log(`Unable to update txid(${unspent.txid}) for wallet(${this.id})`);
        console.log(err);
        return false;
      }
    }
  }

  public async getUnspent() {
    if (!this.db || !this.db.isOpen()) {
      return [];
    }
    
    return await this.db.all(`SELECT unspent.height, unspent.txid, unspent.txid_pos, unspent.value, addresses.address, addresses.hash FROM unspent INNER JOIN wallets ON unspent.wallet_id = wallets.id INNER JOIN addresses ON unspent.address_id = addresses.id WHERE unspent.wallet_id = ?`, this.id);
  }
}

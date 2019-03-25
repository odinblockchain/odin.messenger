import { Database } from '../database.model';
import { Transaction } from './transaction.model';

export class Address extends Database {
  id: number;
  wallet_id: number;
  bip44_index: number;
  address: string;
  hash: string;
  balance_conf: number;
  balance_unconf: number;
  external: number;
  last_updated: number;
  last_tx_timestamp: number;

  constructor(props: any) {
    super('Address');
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }

  public async upsertTransaction(transaction: Transaction) {
    if (!this.db || !this.db.isOpen()) {
      return false;
    }

    const exists = await this.db.get('SELECT id FROM transactions WHERE wallet_id=? AND txid=?', [
      this.wallet_id, transaction.txid
    ]);

    if (!exists) {
      try {
        return await this.db.execSQL(`INSERT INTO transactions (wallet_id, address_id, txid, height, vin_addresses, vout_addresses, value, timestamp) values (?, ?, ?, ?, ?, ?, ?, ?)`, [
          this.wallet_id,
          this.id,
          transaction.txid,
          transaction.height,
          JSON.stringify(transaction.vin_addresses),
          JSON.stringify(transaction.vout_addresses),
          transaction.value,
          transaction.timestamp
        ]);
      } catch (err) {
        this.log(`Unable to insert txid(${transaction.txid}) into address(${this.address})`);
        console.log(err);
        return false;
      }
    } else {
      try {
        if (await this.db.execSQL(`UPDATE transactions SET wallet_id=?, address_id=?, txid=?, height=?, vin_addresses=?, vout_addresses=?, value=?, timestamp=? WHERE wallet_id=? AND txid=?`, [
          this.wallet_id,
          this.id,
          transaction.txid,
          transaction.height,
          JSON.stringify(transaction.vin_addresses),
          JSON.stringify(transaction.vout_addresses),
          transaction.value,
          transaction.timestamp,
  
          this.wallet_id,
          transaction.txid
        ])) {
          return true;
        } else {
          throw new Error(`txid(${transaction.txid}) NOT UPDATED`);
        }
      } catch (err) {
        this.log(`Unable to update txid(${transaction.txid}) for address(${this.address})`);
        console.log(err);
        return false;
      }
    }
  }

  public async getTransactions() {
    if (!this.db || !this.db.isOpen()) {
      return [];
    }
    
    return await this.db.all(`SELECT addresses.wallet_id, txid, height, vin_addresses, vout_addresses, value, timestamp FROM transactions INNER JOIN addresses ON transactions.address_id = addresses.id WHERE addresses.id = ?`, this.id);
  }
}

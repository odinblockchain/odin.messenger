import { Database } from '../database.model';
import { Transaction } from './transaction.model';
import * as moment from 'moment';

export class Address extends Database {
  id: number;
  wallet_id: number;
  bip44_index: number;
  address: string;
  hash: string;
  balance_conf: number;
  balance_unconf: number;
  external: boolean;
  used: boolean;
  last_updated: number;
  last_tx_timestamp: number;

  constructor(props?: any) {
    super('Address');
    
    this.id = -1;
    this.wallet_id = -1;
    this.bip44_index = -1;
    this.address = '';
    this.hash = '';
    this.balance_conf = 0;
    this.balance_unconf = 0;
    this.external = false;
    this.used = false;
    this.last_updated = 0;
    this.last_tx_timestamp = 0;

    this.deserialize(props);
  }

  deserialize(input?: any) {
    if (input.hasOwnProperty('external') && input.external === 'false') {
      input.external = false;
    } else if (input.hasOwnProperty('external') && input.external === 'true') {
      input.external = true;
    } 

    if (input.hasOwnProperty('used') && input.used === 'false') {
      input.used = false;
    } else if (input.hasOwnProperty('used') && input.used === 'true') {
      input.used = true;
    } 

    Object.assign(this, input);
    return this;
  }

  serialize() {
    return {
      id: this.id,
      wallet_id: this.wallet_id,
      bip44_index: this.bip44_index,
      address: this.address,
      hash: this.hash,
      balance_conf: this.balance_conf,
      balance_unconf: this.balance_unconf,
      external: this.external,
      used: this.used,
      last_updated: this.last_updated,
      last_tx_timestamp: this.last_tx_timestamp
    };
  }

  /**
   * Executes a SQL `UPDATE` on the current Account user saving the current account back to the table.
   */
  public async save(): Promise<any> {
    if (!await this.dbReady()) {
      return false;
    }

    // this.log('ATTEMPTING TO SAVE');
    // this.dir(this.serialize());
    this.log(`saving ${this.address}...`);

    const updated = await this.db.execSQL(`UPDATE addresses SET wallet_id=?, bip44_index=?, address=?, hash=?, balance_conf=?, balance_unconf=?, external=?, used=?, last_updated=?, last_tx_timestamp=? WHERE id=?`, [
      this.wallet_id,
      this.bip44_index,
      this.address,
      this.hash,
      this.balance_conf,
      this.balance_unconf,
      this.external,
      this.used,
      Number(moment().format('x')),
      this.last_tx_timestamp,

      this.id
    ]);

    this.log(`account [${this.address}] updated (${updated})`);
    return updated;
  }

  /**
   * Attempts to insert a new `Address` internally. Requires `input` have at least an `address`, and
   * `wallet_id`
   * 
   * After validation, it will check if the provided address already exists. If it does,
   * it will merge the existing address with the provided `input` and then execute a `save()`.
   * 
   * If it does not exist, a new one will be inserted.
   * 
   * @async
   * @function Create
   * @static
   * @param input (optional) The transaction input, should match properties of a `Transaction`
   * @returns {Promise<Transaction>}
   */
  static async Create(input?: any): Promise<Address> {
    const address = new Address(input);
    if (!await address.dbReady()) {
      throw new Error('Unable to connect to db');
    }

    if (!address.address) {
      throw new Error('Unable to create address, missing address!');
    } else if (!address.wallet_id) {
      throw new Error('Unable to create address, missing wallet id!');
    }

    const matchingAddress = await address.db.get('SELECT * FROM addresses WHERE address=? AND wallet_id=?', [
      address.address, address.wallet_id
    ]);

    if (matchingAddress) {
      address.log(`[${address.address}] already saved, merging`);
      matchingAddress.deserialize(address);
      await matchingAddress.save();
      return matchingAddress;
    } else {
      address.last_updated = Number(moment().format('x'));

      const addressId = await address.db.execSQL(`INSERT INTO addresses (wallet_id, bip44_index, address, hash, balance_conf, balance_unconf, external, used, last_updated, last_tx_timestamp) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        address.wallet_id,
        address.bip44_index,
        address.address,
        address.hash,
        address.balance_conf,
        address.balance_unconf,
        address.external,
        address.used,
        address.last_updated,
        address.last_tx_timestamp
      ]);

      address.id = addressId;
      address.log(`Stored [${address.address}] with id:${address.id}`);
    }

    return address;
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

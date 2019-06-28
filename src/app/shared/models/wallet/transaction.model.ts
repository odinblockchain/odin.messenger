import { Deserializable } from '../deserializable.model';
import { Database } from '../database.model';

export class Transaction extends Database {
  // static
  static TRANSACTION_RECEIVED = 'received';
  static TRANSACTION_SENT = 'sent';
  static TRANSACTION_UNKNOWN = 'unknown';
  static TRANSACTION_SELF = 'self';
  static TRANSACTION_PENDING = 'pending';

  // database
  id: number;
  wallet_id: number;
  address_id: number;
  type: string;
  txid: string;
  height: number;
  vin_addresses: string;
  vout_addresses: string;
  value: number;
  timestamp: number;

  constructor(props?: any) {
    super('Transaction');
    
    this.type = '';
    this.txid = '';
    this.height = -1;
    this.vin_addresses = '';
    this.vout_addresses = '';
    this.value = 0;
    this.timestamp = 0;
    
    this.deserialize(props);
  }

  deserialize(input?: any) {
    if (!input || typeof input !== 'object') return this;

    if (input.hasOwnProperty('value')) {
      input.value = Number(input.value);
    }
    
    Object.assign(this, input);
    return this;
  }

  serialize() {
    return {
      id: this.id,
      wallet_id: this.wallet_id,
      address_id: this.address_id,
      type: this.type,
      txid: this.txid,
      height: this.height,
      vin_addresses: this.vin_addresses,
      vout_addresses: this.vout_addresses,
      value: this.value,
      timestamp: this.timestamp
    };
  }

  public isTypePending() {
    return this.type === Transaction.TRANSACTION_PENDING;
  }

  public isTypeReceived() {
    return this.type === Transaction.TRANSACTION_RECEIVED;
  }

  public isTypeSent() {
    return this.type === Transaction.TRANSACTION_SENT;
  }

  public isTypeSelf() {
    return this.type === Transaction.TRANSACTION_SELF;
  }

  /**
   * Executes a SQL `UPDATE` on the current Account user saving the current account back to the table.
   */
  public async save(): Promise<any> {
    if (!await this.dbReady()) {
      return false;
    }

    // this.log('ATTEMPTING TO SAVE');
    this.log(`saving id:[${this.id}] tx:[${this.txid}]...`);
    this.dir(this.serialize());

    const updated = await this.db.execSQL(`UPDATE transactions SET wallet_id=?, address_id=?, type=?, txid=?, height=?, vin_addresses=?, vout_addresses=?, value=?, timestamp=? WHERE id=?`, [
      this.wallet_id,
      this.address_id,
      this.type,
      this.txid,
      this.height,
      (typeof this.vin_addresses === 'string')
        ? this.vin_addresses
        : JSON.stringify(this.vin_addresses),
      (typeof this.vout_addresses === 'string')
        ? this.vout_addresses
        : JSON.stringify(this.vout_addresses),
      `${this.value}`,
      this.timestamp,

      this.id
    ]);

    this.log(`transaction id:[${this.id}] tx:[${this.txid}] – updated (${updated})`);
    return updated;
  }

  /**
   * Checks if the provided `type` is a valid internal transaction type
   * @param type The type of transaction to validate
   */
  static IsValidType(type: string) {
    if (!type || !type.length) return false;
    return [Transaction.TRANSACTION_SENT,
            Transaction.TRANSACTION_RECEIVED,
            Transaction.TRANSACTION_PENDING,
            Transaction.TRANSACTION_SELF,
            Transaction.TRANSACTION_UNKNOWN].includes(type);
  }

  /**
   * Searches internally for a matching transaction and returns it as a new `Transaction` instance.
   * Returns `null` otherwise.
   * 
   * @param txid The transaction id "txid"
   * @param address_id The address id this tx is associated to
   */
  static async Find(txid: string, address_id: number): Promise<Transaction|null> {
    let transaction = new Transaction();
    if (!await transaction.dbReady()) {
      throw new Error('Unable to connect to db');
    }
    
    const matchingTransaction = await transaction.db.get('SELECT * FROM transactions WHERE txid=? AND address_id=?', [
      txid, address_id
    ]);

    if (!matchingTransaction) return null;

    transaction.log(`Found match for [${matchingTransaction.txid}]`);
    console.log(`Match ---
    balance:    ${matchingTransaction.value}
    timestamp:  ${matchingTransaction.timestamp}
    walletId:   ${matchingTransaction.wallet_id}
    addressId:  ${matchingTransaction.address_id}
    `);
    transaction.deserialize(matchingTransaction);
    return transaction;
  }

  /**
   * Attempts to insert a new `Transaction` internally. Requires `input` have at least a `txid`, `address_id`,
   * and `type`. The `type` will be validated against `IsValidType()`.
   * 
   * After validation, it will check if the provided transaction already exists. If it does,
   * it will merge the existing transaction with the provided `input` and then execute a `save()`.
   * 
   * If it does not exist, a new one will be inserted.
   * 
   * @async
   * @function Create
   * @static
   * @param input (optional) The transaction input, should match properties of a `Transaction`
   * @returns {Promise<Transaction>}
   */
  static async Create(input?: any): Promise<Transaction> {
    const transaction = new Transaction(input);
    if (!await transaction.dbReady()) {
      throw new Error('Unable to connect to db');
    }

    if (!Transaction.IsValidType(transaction.type)) {
      throw new Error('Unable to create address, missing transaction type!');
    } else if (!transaction.address_id) {
      throw new Error('Unable to create address, missing address id!');
    } else if (!transaction.txid) {
      throw new Error('Unable to create address, missing txid!');
    }

    const matchingTransaction = await Transaction.Find(transaction.txid, transaction.address_id);
    if (matchingTransaction) {
      transaction.log(`[${transaction.txid}] already saved, merging`);
      if (transaction.value < matchingTransaction.value) transaction.value = matchingTransaction.value;
      if (transaction.timestamp < matchingTransaction.timestamp) transaction.timestamp = matchingTransaction.timestamp;

      matchingTransaction.deserialize(transaction);
      await matchingTransaction.save();
      return matchingTransaction;
    }
    else {
      const transactionId = await transaction.db.execSQL(`INSERT INTO transactions (wallet_id, address_id, type, txid, height, vin_addresses, vout_addresses, value, timestamp) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        transaction.wallet_id,
        transaction.address_id,
        transaction.type,
        transaction.txid,
        transaction.height,
        (typeof transaction.vin_addresses === 'string')
          ? transaction.vin_addresses
          : JSON.stringify(transaction.vin_addresses),
        (typeof transaction.vout_addresses === 'string')
          ? transaction.vout_addresses
          : JSON.stringify(transaction.vout_addresses),
        `${transaction.value}`,
        transaction.timestamp
      ]);

      transaction.id = transactionId;
      transaction.log(`Stored [${transaction.txid}] with id:${transaction.id}`);
    }

    return transaction;
  }
}

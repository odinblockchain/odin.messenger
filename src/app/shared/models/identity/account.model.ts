import { Database } from '../database.model';
import { Message } from '../messenger/message.model';

/**
 * The Account is the primary parent of the ODIN Application modules. There can be
 * many accounts under one identity, and every account has related contacts, messages,
 * wallets, and transactions.
 */
export class Account extends Database {
  bip44_index: number;
  client_id: number;
  username: string;
  registered: boolean;

  constructor(props?: any) {
    super('Account');

    this.bip44_index = -1;
    this.client_id = -1;
    this.username = '';
    this.registered = false;
    this.deserialize(props);

    this.save = this.save.bind(this);
  }

  deserialize(input: any) {
    if (!input) return this;
    
    if (`${input.registered}` === "0") {
      input.registered = false
    } else if (`${input.registered}` === "1") {
      input.registered = true;
    }
    
    Object.assign(this, input);
    return this;
  }

  serialize() {
    return {
      index: this.bip44_index,
      client_id: this.client_id,
      username: this.username,
      registered: this.registered
    };
  }

  public async storeMessage(message: Message) {
    if (!this.dbReady()) {
      return false;
    }

    return await this.db.execSQL(`INSERT INTO messages (account_bip44, contact_username, owner_username, message, timestamp, favorite, unread) values (?, ?, ?, ?, ?, ?, ?)`, [
      this.bip44_index,
      message.contact_username,
      message.owner_username,
      message.message,
      message.timestamp,
      false,
      (message.owner_username === this.username ? false : true)
    ]);
  }

  public async getMessages() {
    if (!this.db || !this.db.isOpen()) {
      return [];
    }
    
    return await this.db.all(`SELECT messages.account_bip44, name, contact_username, owner_username, message, timestamp, messages.unread, favorite FROM messages INNER JOIN accounts ON messages.account_bip44 = accounts.bip44_index INNER JOIN contacts ON messages.contact_username = contacts.username WHERE accounts.bip44_index = ?`, this.bip44_index);
  }

  /**
   * Executes a SQL `UPDATE` on the current Account user saving the current account back to the table.
   */
  public async save(): Promise<any> {
    if (!this.dbReady()) {
      return false;
    }

    this.log('ATTEMPTING TO SAVE');
    this.dir(this.serialize());

    return new Promise((resolve, reject) => {
      this.db.execSQL(`UPDATE accounts SET bip44_index=?, client_id=?, username=?, registered=? WHERE bip44_index=? AND username=?`, [
        this.bip44_index,
        this.client_id,
        this.username,
        this.registered,
        this.bip44_index,
        this.username
      ])
      .then((updated: number) => {
        console.log(`updated account:${this.username} updated?${updated}`);
        return resolve(updated);
      })
      .catch(reject);
    });
  }
}

import { Database } from '../database.model';
import { Message } from '../messenger/message.model';
// import { ODIN } from '~/app/bundle.odin';
// import Hashids from 'hashids';

export class Account extends Database {
  bip44_index: number;
  client_id: number;
  username: string;

  constructor(props?: any) {
    super();
    this.deserialize(props);

    this.save = this.save.bind(this);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
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

    return new Promise((resolve, reject) => {
      this.db.execSQL(`UPDATE accounts SET bip44_index=?, client_id=?, username=? WHERE bip44_index=? AND username=?`, [
        this.bip44_index,
        this.client_id,
        this.username,
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

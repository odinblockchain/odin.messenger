import { Database } from '../database.model';
import { Message } from './message.model';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';

export class Contact extends Database {
  // db
  account_bip44: number;
  username: string;
  name: string;
  address: string;
  unread: boolean;
  accepted: boolean;
  blocked: boolean;
  theme: string;
  last_contacted: number;

  // local
  messages: Message[];
  private messageStream: ReplaySubject<Message>;
  private oMessages$: ObservableArray<Message>;
  public msgs: any[];

  constructor(props: any) {
    super('Contact');
    this.unread = false;
    this.accepted = false;
    this.blocked = false;
    this.last_contacted = 0;
    this.messageStream = new ReplaySubject();
    this.oMessages$ = new ObservableArray();
    this.msgs = [];
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }

  public async loadMessages() {
    this.messageStream = new ReplaySubject();
    this.messages = [];

    const messages = await this.getMessages();
    while (messages.length > 0) {
      const message = new Message(messages.shift());
      this.log(`add message ${message.message}`);
      this.messageStream.next(message);
      this.messages.push(message);
    }

    console.log('messages loaded');
    console.log(this.messages.map(m => m.timestamp));

    // this.oMessages$.sort((a: Message, b: Message) => {
    //   if (a.timestamp > b.timestamp) {
    //     return -1;
    //   } else if (a.timestamp < b.timestamp) {
    //     return 1;
    //   } else {
    //     return 0;
    //   }
    // });

    this.log(`loaded messages for [${this.username}]`);
    return this;
  }

  public get messages$() {
    return this.messageStream.asObservable();
  }

  public async getMessages() {
    if (!this.dbReady()) {
      this.log(`failed to pull messages for [${this.username}] – db not active`);
      return [];
    }

    return await this.db.all(`SELECT messages.account_bip44, key, name, contact_username, owner_username, message, timestamp, messages.unread, favorite FROM messages INNER JOIN contacts ON messages.contact_username = contacts.username WHERE contacts.username = ?`, this.username);
  }

  public async saveMessage(message: Message) {
    if (!this.dbReady()) {
      this.log(`db not active – Unable to store message`);
      return false;
    }

    this.log(`add message ${message.message}`);
    this.messageStream.next(message);
    this.oMessages$.push(message);
    this.msgs.push(message.message);

    await this.db.execSQL(`INSERT INTO messages (key, account_bip44, contact_username, owner_username, message, timestamp, favorite, unread) values (?, ?, ?, ?, ?, ?, ?, ?)`, [
      message.key,
      message.account_bip44,
      message.contact_username,
      message.owner_username,
      message.message,
      message.timestamp,
      false,
      (message.owner_username === this.username ? false : true)
    ]);

    // set contact to unread if owner === contact (outsider message)
    if (message.owner_username === message.contact_username) {
      this.log('SET UNREAD');
      await this.setUnread(true);
    }

    await this.setLastContacted(message.timestamp);
    return await this.save();
  }

  /**
   * 
   * @param {boolean} status Sets whether or not there is a new message for this contact
   */
  public async setUnread(status): Promise<Contact> {
    this.unread = status;
    return this;
  }

  /**
   * 
   * @param {number} lastContacted Sets the last contacted (timestamp) for a contact
   */
  public async setLastContacted(lastContacted): Promise<Contact> {
    this.last_contacted = lastContacted;
    return this;
  }

  // public async storeMessage() {
  //   if (!this.dbReady()) {
  //     return false;
  //   }

  //   return new Promise((resolve, reject) => {
  //     this.db.execSQL(`UPDATE contacts SET account_bip44=?, username=?, name=?, address=?, unread=?, accepted=?, blocked=?, last_contacted=? WHERE account_bip44=? username=?`, [
  //       this.account_bip44,
  //       this.username,
  //       this.name,
  //       this.address,
  //       this.unread,
  //       this.accepted,
  //       this.blocked,
  //       this.last_contacted,

  //       this.account_bip44,
  //       this.username
  //     ])
  //     .then((updated: number) => {
  //       if (updated) {
  //         this.log(`#${this.username} UPDATED`);
  //       } else {
  //         this.log(`#${this.username} NOT UPDATED`);
  //       }

  //       return resolve(updated);
  //     })
  //     .catch(reject);
  //   });
  // }

  /**
   * Executes a SQL `UPDATE` on the current Account user saving the current account back to the table.
   */
  public async save(): Promise<any> {
    if (!this.dbReady()) {
      this.log(`contact [${this.username}] not saved – db not active`);
      return false;
    }

    return new Promise((resolve, reject) => {
      this.db.execSQL(`UPDATE contacts SET account_bip44=?, username=?, name=?, address=?, unread=?, accepted=?, blocked=?, last_contacted=? WHERE account_bip44=? AND username=?`, [
        this.account_bip44,
        this.username,
        this.name,
        this.address,
        this.unread,
        this.accepted,
        this.blocked,
        this.last_contacted,

        this.account_bip44,
        this.username
      ])
      .then((updated: number) => {
        if (updated) {
          this.log(`#${this.username} UPDATED`);
        } else {
          this.log(`#${this.username} NOT UPDATED`);
        }

        return resolve(updated);
      })
      .catch(reject);
    });
  }
}

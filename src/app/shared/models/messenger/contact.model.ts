import { Database } from '../database.model';
import { Message } from './message.model';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { fromObjectRecursive, Observable, fromObject } from 'tns-core-modules/data/observable/observable';

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
  public oMessages$: ObservableArray<Observable>;
  public msgs: any[];
  private msgKeys: any[];

  constructor(props: any) {
    super('Contact');
    this.unread = false;
    this.accepted = false;
    this.blocked = false;
    this.last_contacted = 0;
    this.messageStream = new ReplaySubject();
    this.oMessages$ = new ObservableArray();
    this.msgs = [];
    this.msgKeys = [];
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }

  public async loadMessages() {
    this.messageStream = new ReplaySubject();
    this.messages = [];
    this.msgKeys = [];

    const messages = await this.getMessages();
    while (messages.length > 0) {
      const message = messages.shift();
      this.log(`added message – ${message.message}`);
      this.messageStream.next(new Message(message));
      this.oMessages$.push(fromObject(message));
      this.msgKeys.push(message.key);
    }
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
    if (!await this.dbReady()) {
      this.log(`failed to pull messages for [${this.username}] – db not active`);
      return [];
    }

    return await this.db.all(`SELECT messages.account_bip44, messages.id, key, name, contact_username, owner_username, message, timestamp, messages.unread, favorite, delivered, status FROM messages INNER JOIN contacts ON messages.contact_username = contacts.username WHERE contacts.username = ?`, this.username);
  }

  public async saveMessage(message: Message): Promise<Message> {
    if (!await this.dbReady()) {
      this.log(`db not active – Unable to store message`);
      return message;
    }

    this.log(`add message ${message.message} ${message.status}`);
    this.messageStream.next(message);
    this.oMessages$.push(fromObject(message));
    this.msgKeys.push(message.key);

    const messageId = await this.db.execSQL(`INSERT INTO messages (key, account_bip44, contact_username, owner_username, message, timestamp, favorite, unread, delivered, status) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      message.key,
      message.account_bip44,
      message.contact_username,
      message.owner_username,
      message.message,
      message.timestamp,
      false,
      (message.owner_username === this.username ? false : true),
      message.delivered,
      message.status
    ]);

    message.id = messageId;

    // set contact to unread if owner === contact (outsider message)
    if (message.owner_username === message.contact_username) {
      this.log('SET UNREAD');
      await this.setUnread(true);
    }

    if (message.delivered) {
      await this.setLastContacted(message.timestamp);
    }

    await this.save();
    message.db = this.db;
    return message;
  }

  public async updateMessage(message: Message): Promise<Message> {
    if (!await this.dbReady()) {
      this.log(`db not active – Unable to update message`);
      return message;
    }

    this.log(`update message [key=${message.key}]`);

    // close any previous db connections, add ours
    message.dbClose();
    message.db = this.db;

    const msgIndex = this.msgKeys.findIndex(k => message.key === k);
    if (msgIndex >= 0) {
      this.oMessages$.setItem(msgIndex, fromObject(message));

      await message.save();
      return message;
    } else {
      return message;
    }
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
    if (!await this.dbReady()) {
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

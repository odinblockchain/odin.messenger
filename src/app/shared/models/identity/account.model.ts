import { Database } from '../database.model';
import { Message } from '../messenger/message.model';
import { Contact } from '../messenger';
import { SignalAddress, SignedPreKey, PublicPreKey, PreKeyBundle, SignalClientContact } from '../signal';
import { Client } from '../messenger/client.model';

export interface IRemoteContact {
  address: SignalAddress;
  displayName?: string;
  identityPubKey: string;
  signedPreKey: SignedPreKey;
  publicPreKey: PublicPreKey;
} 

/**
 * The Account is the primary parent of the ODIN Application modules. There can be
 * many accounts under one identity, and every account has related contacts, messages,
 * wallets, and transactions.
 */
export class Account extends Database {
  // database
  bip44_index: number;
  client_id: number;
  username: string;
  registered: boolean;

  // runtime
  contacts: Contact[];
  client: Client;

  constructor(props?: any) {
    super('Account');

    this.bip44_index = -1;
    this.client_id = -1;
    this.username = '';
    this.registered = false;
    this.contacts = [];
    this.deserialize(props);

    this.save = this.save.bind(this);
    this.storeContact = this.storeContact.bind(this);
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

  public async loadContacts() {
    return new Promise(async (resolve, reject) => {
      if (!this.dbReady()) {
        return resolve([]);
      }

      const contacts: Contact[] = await this.db.all(`SELECT contacts.username, account_bip44, name, unread FROM contacts INNER JOIN accounts ON contacts.account_bip44 = accounts.bip44_index WHERE accounts.bip44_index = ?`, this.bip44_index);
      
      this.contacts = contacts.map(contact => {
        console.dir(contact.username);
        this.log(`Load Contact [${contact.username}]
        index:        ${contact.account_bip44}
        username:     ${contact.username}
        display:      ${contact.name}`);

        contact = new Contact(contact);
        return contact;
      });
      
      return resolve(this.contacts);
    });
  }

  /**
   * Checks for the existence of `contactIdentity` within locally stored friend cache.
   * 
   * @param contactIdentity 
   */
  hasFriend(username: string): boolean {
    let index = this.contacts.findIndex((c: Contact) => c.username === username);
    return !!(index >= 0);
  }

  /**
   * Adds a `remoteContact` to the local client's friend list. Will check if contact
   * exists already.
   * 
   * @param remoteContact 
   * @param displayName 
   * 
   * MOVED
   */
  async addFriend(newContact: any, remoteContact: IRemoteContact): Promise<boolean> {
    this.log(`Add friend [${newContact.username}]`);

    if (this.hasFriend(newContact.username)) {
      throw new Error('ContactExists');
    }

    if (typeof newContact.displayName === 'undefined') newContact.displayName = '';

    const contact: Contact = new Contact({
      account_bip44: this.bip44_index,
      username: newContact.username,
      name: newContact.displayName,
      unread: false
    })

    try {
      await this.client.storeContact(remoteContact);

      if (this.client.signalClient.hasSession(contact.username)) {
        await this.storeContact(contact);
        this.contacts.push(contact);
        return true;
      } else {
        this.log(`Failed Signal Store Contact check`);
        return false;
      }
    } catch (err) {
      this.log(`Failed to store contact [${newContact.username}]`);
      console.log(err);
      return false;
    }
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

  public async storeContact(contact: Contact) {
    if (!this.dbReady()) {
      return false;
    }

    return await this.db.execSQL(`INSERT INTO contacts (account_bip44, username, name) values (?, ?, ?)`, [
      this.bip44_index,
      contact.username,
      contact.name
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

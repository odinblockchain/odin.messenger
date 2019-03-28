import { Database } from '../database.model';
import { Message } from '../messenger/message.model';
import { Contact } from '../messenger';
import { SignalAddress, SignedPreKey, PublicPreKey, PreKeyBundle, SignalClientContact } from '../signal';
import { Client } from '../messenger/client.model';
import { request, HttpResponse } from 'http';

export interface IRemoteContact {
  address: SignalAddress;
  displayName?: string;
  identityPubKey: string;
  signedPreKey: SignedPreKey;
  publicPreKey: PublicPreKey;
}

export class RemoteMessagePayload {
  destinationDeviceId: number;
  destinationRegistrationId: number;
  deviceId: number;
  registrationId: number;
  accountHash: string;
  ciphertextMessage: string;
  timestamp: number;
}

export class RemoteMessage {
  key: string;
  value: RemoteMessagePayload;
}

export class RemoteMessages {
  status: string;
  messages: RemoteMessage[];
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
  fetchMessages: any;
  preferences: any;
  logger: any;

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
    this.verifyRemoteContact = this.verifyRemoteContact.bind(this);
    this.verifyRemoteSession = this.verifyRemoteSession.bind(this);
  }

  deserialize(input: any) {
    if (!input) return this;

    if (`${input.registered}` === '0' || input.registered === 'false') {
      input.registered = false
    } else if (`${input.registered}` === "1" || input.registered === 'true') {
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
        this.log(`db not ready, can't load contacts for account ${this.username}`);
        return resolve([]);
      }

      const contacts: Contact[] = await this.db.all(`SELECT contacts.username, account_bip44, name, unread, last_contacted FROM contacts INNER JOIN accounts ON contacts.account_bip44 = accounts.bip44_index WHERE accounts.bip44_index = ?`, this.bip44_index);
    
      while (contacts.length > 0) {
        const contact: Contact = new Contact(contacts.shift());
        if (this.contacts.find(c => c.username === contact.username)) {
          this.log(`...skipping ${contact.username}, already loaded`);
        } else {
          this.log(`Load Contact [${contact.username}]
                    index:        ${contact.account_bip44}
                    username:     ${contact.username}
                    display:      ${contact.name}`);
          contact.db = this.db;
          await contact.loadMessages();
          this.contacts.push(contact);
        }
      }
      
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
   */
  public async addFriend(newContact: any, remoteContact: IRemoteContact): Promise<boolean> {
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

        contact.db = this.db;
        await contact.loadMessages();
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

  // public async handleMessage(message: Message) {
  //   if (!this.dbReady()) {
  //     return false;
  //   }

  //   this.log(`SELECT * FROM messages WHERE contact_username=${message.contact_username} AND key=${message.key}`);
  //   const exists = await this.db.get(`SELECT * FROM messages WHERE contact_username=? AND key=?`, [message.contact_username, message.key]);

  //   console.log('exists?', exists);
  //   console.log('or...', await this.db.all('SELECT * FROM messages'));
    
  //   if (!exists) {
  //     const stored = await this.storeMessage(message);
  //     console.log('saved?', stored);
  //     return stored;
  //   } else {
  //     this.log(`Message [${message.key}] from ${message.contact_username} already saved`);
  //   }
  // }

  /**
   * Finds the local contact matching the provided `message` and sets `unread` to `true` and the
   * `last_contacted` to the message timestamp.
   * 
   * @param message The message instance that has an associated `contact_username` and `timestamp`
   */
  // public async markContactUnread(message: Message): Promise<any> {
  //   if (!this.dbReady()) {
  //     return false;
  //   }

  //   const contact: Contact = this.findContact(message.contact_username);
  //   if (!contact) {
  //     this.log(`contact [${message.contact_username}] not found`);
  //     return false;
  //   }

  //   await contact.setUnread(true)
  //   await contact.setLastContacted(message.timestamp);
  //   return await contact.save();
  // }

  public findContact(username: string) {
    return this.contacts.find((c: Contact) => c.username === username);
  }

  // public async storeMessage(message: Message) {
  //   if (!this.dbReady()) {
  //     return false;
  //   }

  //   return await this.db.execSQL(`INSERT INTO messages (key, account_bip44, contact_username, owner_username, message, timestamp, favorite, unread) values (?, ?, ?, ?, ?, ?, ?, ?)`, [
  //     message.key,
  //     this.bip44_index,
  //     message.contact_username,
  //     message.owner_username,
  //     message.message,
  //     message.timestamp,
  //     false,
  //     (message.owner_username === this.username ? false : true)
  //   ]);
  // }

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

    const updated = await this.db.execSQL(`UPDATE accounts SET bip44_index=?, client_id=?, username=?, registered=? WHERE bip44_index=? AND username=?`, [
      this.bip44_index,
      this.client_id,
      this.username,
      this.registered,

      this.bip44_index,
      this.username
    ]);

    this.log(`account [${this.username}] updated (${updated})`);
    return updated;
  }

  /**
   * Request all available messages from the message server and handle each one
   * individually
   */
  public async fetchRemoteMessages(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.log('Fetching remote messages');
      
      const res: HttpResponse = await request({
        url: `${this.preferences.api_url}/messages?deviceId=${this.client.device_id}&registrationId=${this.client.registration_id}`,
        method: "GET",
      });

      if (res.statusCode !== 200) {
        this.logger(`Unable to fetch messages d[${this.client.device_id}] r[${this.client.registration_id}] statusCode: ${res.statusCode}`);
        return resolve(false);
      }

      const content: RemoteMessages = res.content.toJSON();
      if (res.statusCode === 200 && content.status === 'ok') {
        while (content.messages.length > 0) {
          await this.handleRemoteMessage(content.messages.shift());
        }

        console.log('STORED MESSAGES');
        console.log(await this.getMessages());

        return resolve(true);
      }

      return resolve(false);
    });
  }

  /**
   * Process a provided `RemoteMessage`. Will make an attempt to decipher it through `decipherMessage()`.
   * After a message is processed (whether successful or not) a request will be made to remove it from
   * the server.
   * 
   * @param remoteMessage The remote message to decipher and handle
   */
  private async handleRemoteMessage(remoteMessage: RemoteMessage) {
    this.log('Handle remote message');
    const message = Message.importRemoteMessage(this.bip44_index, remoteMessage.key, remoteMessage.value);
    
    try {
      const plaintextMessage = await this.decipherMessage(message);
      this.log(`Message received: ${plaintextMessage}`);
      
      message.setMessage(plaintextMessage);
      const contact = this.findContact(message.contact_username);
      if (!contact) {
        throw new Error(`Contact "${message.contact_username}" not found locally, skipping message store`);
      }

      await contact.saveMessage(message);
      // await contact.setNewMessage(message)
      // await this.markContactUnread(message);
    } catch (err) {
      this.log(`Unable to handle remote message [${remoteMessage.key}]`);
      this.logger(err.message ? err.message : err);
      console.log(err);
    }

    try {
      await this.deleteRemoteMessage(message);
    } catch (err) {
      this.log('Unable to delete remote message');
    }

    return;
  }

  /**
   * Makes an attempt to decipher a provided `Message` instance. Will first verify the remote sender's
   * details both as a stored contact and a stored session.
   * 
   * In order to verify a remote sender and decipher their message, a call must be made to the server
   * to grab a fresh identity package.
   * 
   * @param message The Message instance that has an encrypted message body
   */
  private async decipherMessage(message: Message): Promise<string> {
    this.log(`Decipher [${message.key}]`);

    const remoteContactRes: HttpResponse = await request({
      url: `${this.preferences.api_url}/keys/?user=${message.contact_username}`,
      method: 'GET'
    });

    if (remoteContactRes.statusCode !== 200) {
      throw new Error(`Failed to fetch remote contact details [${message.contact_username}] statusCode: ${remoteContactRes.statusCode}`);
    }

    const remoteContact: IRemoteContact = remoteContactRes.content.toJSON();
    await this.verifyRemoteContact(remoteContact);
    await this.verifyRemoteSession(remoteContact);
    
    this.log('Contact and Session verified');
    this.log(`Total prekeys: ${this.client.remote_key_total}`);

    const plainTextMessage = await this.client.signalClient.decryptEncodedMessage(remoteContact.address.name, message.message);

    if (typeof plainTextMessage !== 'string') {
      //if ((plainTextMessage+'').indexOf('Unable to decrypt') >= 0)
      this.client.remote_key_total -= 1;
      await this.client.save();
      const extraDetails = plainTextMessage['message'] ? `ERROR === ${plainTextMessage['message']}` : '';
      throw new Error(`Failed to decipher [${message.key}] (${extraDetails})`);
    }
    
    this.log(`encrypted message: ${message.message}`);
    this.log(`plaintext message: ${plainTextMessage}`);

    this.client.remote_key_total -= 1;
    await this.client.save();
    return plainTextMessage;
  }

  /**
   * Checks internally if `remoteContact` is a stored friend locally. If not, store their
   * information and save it.
   * 
   * In the future, work could be inserted here to create a list of "unverified contacts" and
   * "verified".
   * 
   * @param remoteContact The remote contact that should be verified within the active account
   */
  private async verifyRemoteContact(remoteContact: IRemoteContact) {
    this.log(`Verify remote contact [${remoteContact.address.name}]`);

    return new Promise(async (resolve, reject) => {
      // signalClient.addSession && push to local friends
      if (!this.hasFriend(remoteContact.address.name)) {
        this.log(`...New contact discovered`);

        const contact = {
          username:     remoteContact.address.name,
          displayName:  `New: ${remoteContact.address.name}`
        };

        if (!await this.addFriend(contact, remoteContact)) {
          this.log(`Unable to add contact! [${remoteContact.address.name}]`);
          return reject(new Error('[account model] unable to add contact'));
        }
      } else {
        this.log(`...Contact already saved`);
      }

      return resolve(remoteContact);
    });
  }

  /**
   * Checks the `signalClient` if it has an active session or not with the `remoteContact`.
   * In either case, their information is stored and a new session is added. This is due
   * to a known issue where on app reload, their details are not saved properly.
   * 
   * @param remoteContact The remote contact that should be verified though the `signalClient`
   */
  private async verifyRemoteSession(remoteContact: IRemoteContact): Promise<boolean> {
    this.log(`Verify remote session [${remoteContact.address.name}]`);
    
    if (!this.client.signalClient.hasSession(remoteContact.address.name)) {
      this.log(`...New session discovered`);
    } else {
      this.log(`...Session already exists`);
    }

    // always addSession 
    // signalClient will add a new session or update an existing one
    return this.client.storeContact(remoteContact);
  }

  /**
   * Attempts to delete a message that is currently stored on the server.
   * 
   * @param message The message to attempt to delete
   */
  private async deleteRemoteMessage(message: Message) {
    this.log(`Working to delete message [${message.key}]`);
    return new Promise(async (resolve, reject) => {
      const res: HttpResponse = await request({
        url: `${this.preferences.api_url}/messages?key=${message.key}`,
        method: 'DELETE'
      });

      if (res.statusCode === 200) {
        return resolve(true);
      } else {
        return reject(false);
      }
    });
  }
}

import { Deserializable } from '../deserializable.model';
import { Database } from '../database.model';

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

export class Message extends Database {
  // database
  public id: number;
  public key: string;
  public account_bip44: number;
  public contact_username: string;
  public owner_username: string;
  public message: string;
  public timestamp: number;
  public favorite: boolean;
  public delivered: boolean;
  public status: string;
  private unread: boolean;

  /**
   * Message
   * @property {string} key
   * @property {number} account_bip44
   * @property {string} contact_username
   * @property {string} owner_username
   * @property {string} message
   * @property {number} timestamp
   * @property {boolean} favorite
   * @property {boolean} delivered
   * @property {string} status The status of a message: pending, accepted, failed
   * @private {boolean} unread
   */
  constructor(props: any) {
    super('Message');

    this.id = null;
    this.status = '';
    this.favorite = false;
    this.delivered = false;
    this.unread = true;

    this.deserialize(props);
  }
  
  deserialize(input: any) {
    if (!input || typeof input !== 'object') return this;
    
    if (input.hasOwnProperty('delivered') && input.delivered === 'false') {
      input.delivered = false;
    } else if (input.hasOwnProperty('delivered') && input.delivered === 'true') {
      input.delivered = true;
    } 

    Object.assign(this, input);
    return this;
  }

  getMessage() {
    return this.message;
  }

  isUnread() {
    return !!(this.unread);
  }

  setMessage(message: string) {
    if (!message) return;
    this.message = message;
  }

  static importRemoteMessage(accountBip44Index: number, messageKey: string, payload: RemoteMessagePayload) {
    return new this({
      account_bip44: accountBip44Index,
      key: messageKey,
      contact_username: payload.accountHash,
      owner_username: payload.accountHash,
      message: payload.ciphertextMessage,
      timestamp: payload.timestamp,
      delivered: true,
      status: 'accepted'
    });
  }

  /**
   * Executes a SQL `UPDATE` on the current Account user saving the current account back to the table.
   */
  public async save(): Promise<any> {
    if (!await this.dbReady()) {
      this.log(`message [${this.message}] not saved – db not active`);
      return false;
    } else if (!this.id) {
      this.log(`message [${this.message}] not saved - id missing`);
      return false;
    }

    return new Promise((resolve, reject) => {
      this.db.execSQL(`UPDATE messages SET account_bip44=?, contact_username=?, owner_username=?, message=?, timestamp=?, favorite=?, unread=?, delivered=?, status=? WHERE id=?`, [
        this.account_bip44,
        this.contact_username,
        this.owner_username,
        this.message,
        this.timestamp,
        this.favorite,
        this.unread,
        this.delivered,
        this.status,

        this.id
      ])
      .then((updated: number) => {
        if (updated) {
          this.log(`#${this.message} UPDATED`);
        } else {
          this.log(`#${this.message} NOT UPDATED`);
        }

        return resolve(updated);
      }).catch(reject);
    });
  }
}

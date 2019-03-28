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
   * @private {boolean} unread
   */
  constructor(props: any) {
    super('Message');

    this.favorite = false;
    this.unread = true;

    this.deserialize(props);
  }
  
  deserialize(input: any) {
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
      timestamp: payload.timestamp
    });
  }
}

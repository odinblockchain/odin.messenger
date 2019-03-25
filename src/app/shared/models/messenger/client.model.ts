import { Database } from '../database.model';
import { LibsignalProtocol } from 'nativescript-libsignal-protocol';
import { SignalClientSerialized, SignalClientContact, PreKeyBundle, LocalContact, SignalAddress, SignalClientPreKey, SignalClient } from '../signal';

export class Client extends Database {
  id: number;
  account_username: string; // foreign_key accounts(username)
  registration_id: number;
  device_id: number;
  identity_key_pair: string; // encoded string
  signed_pre_key: any; // encoded string
  pre_keys: SignalClientPreKey[];
  remote_key_total: number;
  
  signalClient: LibsignalProtocol.Client;

  constructor(props?: any) {
    super('Client');
    this.remote_key_total = 0;
    this.deserialize(props);

    this.save = this.save.bind(this);
  }

  deserialize(input: any) {
    try {
      input.pre_keys = (input.pre_keys && typeof input.pre_keys === 'string')
        ? JSON.parse(input.pre_keys)
        : [];
    } catch (e) { }
    
    Object.assign(this, input);
    return this;
  }

  serialize() {
    return {
      id: this.id,
      account_username: this.account_username,
      registration_id: this.registration_id,
      device_id: this.device_id,
      identity_key_pair: this.identity_key_pair,
      signed_pre_key: this.signed_pre_key,
      remote_key_total: this.remote_key_total,
      pre_keys: this.pre_keys
    };
  }

  /**
   * Creates a new LibsignalProtocol Client. Uses `saveData` to preload the 
   * `hashAccount`, `registrationId`, and `deviceId`.
   * 
   * Additionally, you can pass three optional parameters to restore a previously
   * used Client instance.
   * 
   * @param identityKeyPair 
   * @param signedPreKey 
   * @param preKeys 
   */
  async loadSignalClient(): Promise<SignalClient> {
    this.log(`Load signal client for [${this.account_username}]`);
    
    // TODO LibsignalProtocol.Client should accept FALSE || null parameters
    this.signalClient = await new LibsignalProtocol.Client(
      this.account_username,
      this.registration_id,
      this.device_id,
      (this.identity_key_pair && this.identity_key_pair.length)
        ? this.identity_key_pair
        : undefined,
      (this.signed_pre_key && this.signed_pre_key.length)
        ? this.signed_pre_key
        : undefined,
      (this.pre_keys && this.pre_keys.length)
        ? this.pre_keys
        : undefined
    );

    // TODO Client should allow exporting of serialized properties without first doing this
    let serializedClient: SignalClientSerialized = JSON.parse(JSON.stringify(this.signalClient));

    this.log(`Integrity check`);
    this.log(`
      account:      ${this.signalClient.username},
      regId:        ${this.signalClient.registrationId},
      devId:        ${this.signalClient.deviceId},
      idpair:       ${serializedClient.identityKeyPair}
      signedPreKey: ${serializedClient.signedPreKey}
      preKeys:      ${serializedClient.preKeys ? serializedClient.preKeys.length : 0},
      preKey0:      ${serializedClient.preKeys ? JSON.stringify(serializedClient.preKeys[0]) : ''}
    `);

    this.identity_key_pair = serializedClient.identityKeyPair;
    this.signed_pre_key = serializedClient.signedPreKey;
    this.pre_keys = serializedClient.preKeys;

    return this.signalClient;
  }

  private stringify(value) {
    if (!value || value.length === 0) return '';
    try {
      return  (typeof value === 'string')
                ? value
                : JSON.stringify(value);
    } catch (e) {
      return '';
    }
  }

  /**
   * Executes a SQL `UPDATE` on the current Account user saving the current account back to the table.
   */
  public async save(): Promise<any> {
    if (!this.dbReady()) {
      return false;
    }

    return new Promise((resolve, reject) => {
      this.db.execSQL(`UPDATE clients SET registration_id=?, device_id=?, identity_key_pair=?, signed_pre_key=?, pre_keys=?, remote_key_total=? WHERE account_username=?`, [
        this.registration_id,
        this.device_id,
        this.identity_key_pair ? this.identity_key_pair : '',
        this.signed_pre_key ? this.signed_pre_key : '',
        this.stringify(this.pre_keys),
        this.remote_key_total,
        this.account_username
      ])
      .then((updated: number) => {
        if (updated) {
          this.log(`#${this.id} UPDATED`);
        } else {
          this.log(`#${this.id} NOT UPDATED`);
        }

        return resolve(updated);
      })
      .catch(reject);
    });
  }
}

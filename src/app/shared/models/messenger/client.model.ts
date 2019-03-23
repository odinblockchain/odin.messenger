import { Database } from '../database.model';
import { LibsignalProtocol } from 'nativescript-libsignal-protocol';

export interface ISignalClientPreKey {
  id: number;
  pubKey: string;
  serialized: string;
}

export class SignalClientPreKey {
  public id: number;
  public pubKey: string;
  public serialized: string;
}

export class Client extends Database {
  id: number;
  account_username: string; // foreign_key accounts(username)
  registration_id: number;
  device_id: number;
  identity_key_pair: string; // encoded string
  signed_pre_key: any; // encoded string
  pre_keys: SignalClientPreKey[];
  
  signalClient: any;

  constructor(props?: any) {
    super();
    this.deserialize(props);
  }

  deserialize(input: any) {
    try {
      console.log('attempting to parse prekeys');
      console.dir(input.pre_keys);
      if (typeof input.pre_keys === 'string') input.pre_keys = JSON.parse(input.pre_keys);
      console.log('JSON PARSED pre_keys');
      console.dir(input.pre_keys);
    } catch (e) {
      console.log('nothing to parse, prekeys');
    }
    
    Object.assign(this, input);
    return this;
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
  async loadSignalClient(): Promise<boolean> {
    console.log(`UserModel... CREATE Signal Client`);
    console.log({
      account:    this.account_username,
      regId:      this.registration_id,
      devId:      this.device_id,
      idKeyPair:  this.identity_key_pair,
      signedPre:  this.signed_pre_key,
      preKeys:    this.pre_keys ? this.pre_keys.length : 0,
      preKey0:    this.pre_keys ? this.pre_keys[0] : ''
    });

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
    let serializedClient = JSON.parse(JSON.stringify(this.signalClient));

    console.log(`UserModel... Sanity Check`);
    console.log({
      account:      this.signalClient.username,
      regId:        this.signalClient.registrationId,
      devId:        this.signalClient.deviceId,
      idpair:       serializedClient.identityKeyPair,
      signedPreKey: serializedClient.signedPreKey,
      preKeys:      serializedClient.preKeys ? serializedClient.preKeys.length : 0,
      preKey0:      serializedClient.preKeys ? serializedClient.preKeys[0] : ''
    });

    this.identity_key_pair = serializedClient.identityKeyPair;
    this.signed_pre_key = serializedClient.signedPreKey;
    this.pre_keys = serializedClient.preKeys;

    // await this._store.setString('signalClient', JSON.stringify(this._signalClient));
    console.log(`UserModel... STORED Signal Client`);

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
      this.db.execSQL(`UPDATE clients SET registration_id=?, device_id=?, identity_key_pair=?, signed_pre_key=?, pre_keys=? WHERE account_username=?`, [
        this.registration_id,
        this.device_id,
        this.identity_key_pair ? this.identity_key_pair : '',
        this.signed_pre_key ? this.signed_pre_key : '',
        this.stringify(this.pre_keys),
        this.account_username
      ])
      .then((updated: number) => {
        console.log(`updated client [${this.account_username}] #${this.id} (${updated})`);
        return resolve(updated);
      })
      .catch(reject);
    });
  }
}

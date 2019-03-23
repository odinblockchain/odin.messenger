import { Injectable } from '@angular/core';
import { StorageService } from '../storage.service';
import { Client } from '../models/messenger/client.model';
import { LibsignalProtocol } from 'nativescript-libsignal-protocol';

@Injectable({
  providedIn: 'root'
})
export class ClientService extends StorageService {
  clients: Client[];

  constructor() {
    super('ClientService');
    this.clients = [];

    this.init = this.init.bind(this);
    this.loadClients = this.loadClients.bind(this);
  }

  public async init() {
    return new Promise((resolve, reject) => {
      this.connect()
      .then(this.loadClients)
      .then(resolve)
      .catch(err => {
        this.log('Unable to init service');
        console.log(err);
        reject(err);
      });
    });
  }

  private async loadClients() {
    if (!this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const clients: Client[] = await this.odb.all('SELECT * FROM clients');
        this.clients = clients.map(client => {
          client = new Client(client);
          client.db = this.odb;
          client.loadSignalClient()
          .then(signal => {
            this.log(`Signal loaded for [${client.account_username}]`);
            this.log(`Client [${client.account_username}] #${client.id} resolved`);

            this.clients.push(client);
            return resolve(client);
          }).catch(reject);
          
          return client;
        });

        this.log(`clients loaded...${this.clients.length}`);
        return resolve(this.clients);
      } catch (err) {
        this.log('Unable to load clients...');
        console.log(err);
        return reject(err);
      }
    });
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
   * Returns a fully established Client for the ODIN App. At bare-minimum, a `account_username` must be
   * set to the passed `client`.
   * 
   * Will generate `registration_id`, `device_id`, and load the `signalClient` before passing back a
   * ready client.
   * 
   * @param client The client to create
   */
  public async createClient(client: Client): Promise<any> {
    if (!this.dbReady()) {
      return false;
    }

    return new Promise((resolve, reject) => {
      if (this.findClient(client.account_username)) {
        return reject(new Error(`Client (${client.account_username}) already exists`));
      }

      client.registration_id = Number(LibsignalProtocol.KeyHelper.generateRegistrationId());
      client.device_id = Number(LibsignalProtocol.KeyHelper.generateRegistrationId());

      this.odb.execSQL(`INSERT INTO clients (account_username, registration_id, device_id, identity_key_pair, signed_pre_key, pre_keys) values (?, ?, ?, ?, ?, ?)`, [
        client.account_username,
        client.registration_id,
        client.device_id,
        client.identity_key_pair ? client.identity_key_pair : '',
        client.signed_pre_key ? client.signed_pre_key : '',
        this.stringify(client.pre_keys)
      ])
      .then((id: number) => {
        client.id = id;
        client.db = this.odb;

        client.loadSignalClient()
        .then(signal => {
          this.log(`Signal loaded for [${client.account_username}]`);
          this.log(`Client [${client.account_username}] #${client.id} added`);

          client.save()
          .then(async saved => {
            this.log(`saved? ${saved}`);

            const foo = await this.fetchClient(client.account_username);
            console.log('FOO?');
            console.dir(foo);

            this.clients.push(client);
            return resolve(client);
          }).catch(reject);
        }).catch(reject);
      })
      .catch(reject);
    });
  }

  public findClient(username: string) {
    return this.clients.find((c: Client) => c.account_username === username);
  }

  public fetchClient(username: string) {
    if (!this.dbReady()) {
      return false;
    }

    return this.odb.get('SELECT * FROM clients WHERE account_username=?', username);
  }
}

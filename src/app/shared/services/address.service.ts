import { Injectable } from '@angular/core';
import { Address, Wallet } from '~/app/shared/models/wallet';
import { StorageService } from '../storage.service';

@Injectable({
  providedIn: 'root'
})
export class AddressService extends StorageService {
  addresses: Address[];

  constructor() {
    super('AddressService');
    this.addresses = [];

    this.init = this.init.bind(this);
    this.loadAddresses = this.loadAddresses.bind(this);
  }

  public async init() {
    return new Promise((resolve, reject) => {
      this.connect()
      .then(this.loadAddresses)
      .then(resolve)
      .catch(err => {
        this.log('Unable to init service');
        console.log(err);
        reject(err);
      });
    });
  }

  private async loadAddresses() {
    if (!this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const addresses: Address[] = await this.odb.all('SELECT * FROM addresses');
        this.addresses = addresses.map(address => {
          address = new Address(address);
          address.db = this.odb;
          return address;
        });

        this.log(`accounts loaded...${this.addresses.length}`);
        return resolve(this.addresses);
      } catch (err) {
        this.log('Unable to load addresses...');
        console.log(err);
        return reject(err);
      }
    });
  }

  public async createAddress(address: Address) {
    if (!this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise((resolve, reject) => {
      if (this.addresses.find(a => a.address === address.address)) {
        return reject(new Error(`Address (${address.address}) already exists`));
      }

      this.odb.execSQL(`INSERT INTO addresses (wallet_id, bip44_index, address, hash, balance_conf, balance_unconf, external, last_updated) values (?, ?, ?, ?, ?, ?, ?, ?)`, [
        address.wallet_id,
        address.bip44_index,
        address.address,
        address.hash,
        address.balance_conf,
        address.balance_unconf,
        address.external,
        Date.now()
      ])
      .then((id: number) => {
        address.db = this.odb;
        address.id = id;
        this.log(`added address:${address.hash}`);
        this.addresses.push(address);
        return resolve(id);
      })
      .catch(reject);
    });
  }

  public findAddress(address) {
    return this.addresses.find(a => a.address === address);
  }
}

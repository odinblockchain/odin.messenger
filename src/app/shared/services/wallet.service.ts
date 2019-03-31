import { Injectable } from '@angular/core';
import { Wallet } from '~/app/shared/models/wallet';
import { StorageService } from '../storage.service';
const SqlLite = require('nativescript-sqlite');

@Injectable({
  providedIn: 'root'
})
export class WalletService extends StorageService {
  wallets: Wallet[];

  constructor() {
    super('WalletService');
    this.wallets = [];

    this.init = this.init.bind(this);
    this.loadWallets = this.loadWallets.bind(this);
  }

  public async init() {
    return new Promise((resolve, reject) => {
      this.connect()
      .then(this.loadWallets)
      .then(resolve)
      .catch(err => {
        this.log('Unable to init service');
        console.log(err);
        reject(err);
      });
    });
  }

  private async loadWallets() {
    if (!await this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const wallets: Wallet[] = await this.odb.all('SELECT * FROM wallets');
        this.wallets = wallets.map(wallet => {
          wallet = new Wallet(wallet);
          wallet.db = this.odb;
          return wallet;
        });

        this.log(`wallets loaded...${this.wallets.length}`);
        return resolve(this.wallets);
      } catch (err) {
        this.log('Unable to load wallets...');
        console.log(err);
        return reject(err);
      }
    });
  }

  public async createWallet(wallet: Wallet) {
    if (!await this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise((resolve, reject) => {
      if (this.wallets.find(w => this.matchingWallet(w, wallet))) {
        return reject(new Error(`Wallet (${wallet.coin_name}:${wallet.account_bip44}:${wallet.bip44_index}) already exists`));
      }

      this.odb.execSQL(`INSERT INTO wallets (coin_name, account_bip44, bip44_index, balance_conf, balance_unconf, last_updated) values (?, ?, ?, ?, ?, ?)`, [
        wallet.coin_name,
        wallet.account_bip44,
        wallet.bip44_index,
        wallet.balance_conf,
        wallet.balance_unconf,
        Date.now()
      ])
      .then((id: number) => {
        wallet.db = this.odb;
        wallet.id = id;
        this.wallets.push(wallet);
        return resolve(id);
      })
      .catch(reject);
    });
  }

  private matchingWallet(walletA: Wallet, walletB: Wallet) {
    if (!walletA || !walletB) return null;
    return (walletA.account_bip44 === walletB.account_bip44) && (walletA.bip44_index === walletB.bip44_index);
  }

  public findWalletByBip44(account_bip44: number, bip44_index: number) {
    const wallet = new Wallet({ account_bip44, bip44_index });
    return this.wallets.find(w => this.matchingWallet(w, wallet));
  }
}

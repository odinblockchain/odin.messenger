import { Inject, Injectable, Optional } from "@angular/core";
import { ReplaySubject } from "rxjs";
import { clear, getString, hasKey, setString } from "tns-core-modules/application-settings";


const SqlLite = require('nativescript-sqlite');
const DatabaseName = 'odin.db';

const AccountsSQL = `CREATE TABLE IF NOT EXISTS accounts (bip44_index INTEGER NOT NULL, client_id INTEGER, username TEXT NOT NULL PRIMARY KEY, registered BOOLEAN DEFAULT false, FOREIGN KEY (client_id) REFERENCES clients (id))`;
const ClientsSQL =  `CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, account_username STRING NOT NULL, device_id INTEGER, registration_id INTEGER, identity_key_pair STRING, signed_pre_key STRING, pre_keys STRING, remote_key_total INTEGER DEFAULT(0), FOREIGN KEY (account_username) REFERENCES accounts (username) ON DELETE CASCADE)`;
const ContactsSQL = `CREATE TABLE IF NOT EXISTS contacts (account_bip44 INTEGER NOT NULL, username TEXT PRIMARY KEY NOT NULL, name TEXT, address TEXT, unread BOOLEAN DEFAULT false, accepted BOOLEAN DEFAULT false, blocked BOOLEAN DEFAULT false, theme TEXT DEFAULT "", last_contacted INTEGER, FOREIGN KEY (account_bip44) REFERENCES accounts (bip44_index) ON DELETE CASCADE)`;
const MessagesSQL = `CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, "key" STRING, account_bip44 INTEGER NOT NULL, contact_username TEXT NOT NULL, owner_username TEXT NOT NULL, message TEXT DEFAULT "", timestamp INTEGER, favorite BOOLEAN DEFAULT false, unread BOOLEAN DEFAULT false, delivered BOOLEAN DEFAULT false, status STRING DEFAULT "", FOREIGN KEY (contact_username) REFERENCES contacts (username) ON DELETE CASCADE, FOREIGN KEY (account_bip44) REFERENCES accounts (bip44_index) ON DELETE CASCADE)`;
const CoinsSQL = `CREATE TABLE IF NOT EXISTS coins (name TEXT PRIMARY KEY NOT NULL, is_default BOOLEAN DEFAULT false, bip44 INTEGER UNIQUE, label TEXT DEFAULT "", symbol TEXT NOT NULL, icon_path TEXT DEFAULT "", explorer_host TEXT, explorer_api_host STRING, explorer_api_stats STRING, electrumx_host TEXT, electrumx_port INTEGER DEFAULT (50001))`;
const WalletsSQL = `CREATE TABLE IF NOT EXISTS wallets (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, coin_name TEXT NOT NULL, account_bip44 INTEGER NOT NULL, bip44_index INTEGER NOT NULL, balance_conf REAL DEFAULT (0), balance_unconf REAL DEFAULT (0), last_updated INTEGER, last_tx_timestamp INTEGER, FOREIGN KEY (coin_name) REFERENCES coins (name) ON DELETE CASCADE, FOREIGN KEY (account_bip44) REFERENCES accounts (bip44_index) ON DELETE CASCADE)`;
const AddressesSQL = `CREATE TABLE IF NOT EXISTS addresses (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, wallet_id INTEGER NOT NULL, bip44_index INTEGER NOT NULL, address TEXT NOT NULL, hash TEXT NOT NULL, wif TEXT NOT NULL, balance_conf REAL DEFAULT (0), balance_unconf REAL DEFAULT (0), external BOOLEAN DEFAULT false, used BOOLEAN DEFAULT false, last_updated INTEGER, last_tx_timestamp INTEGER, FOREIGN KEY (wallet_id) REFERENCES wallets (id) ON DELETE CASCADE)`;
const TransactionsSQL = `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, wallet_id INTEGER NOT NULL, address_id INTEGER NOT NULL, type TEXT, txid TEXT NOT NULL, height INTEGER, vin_addresses TEXT, vout_addresses TEXT, value REAL, timestamp INTEGER, FOREIGN KEY (address_id) REFERENCES addresses (id) ON DELETE CASCADE, FOREIGN KEY (wallet_id) REFERENCES wallets (id) ON DELETE CASCADE)`;
const UnspentSQL = `CREATE TABLE IF NOT EXISTS unspent (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, wallet_id INTEGER NOT NULL, address_id INTEGER NOT NULL, address TEXT NOT NULL, height INTEGER, txid TEXT NOT NULL, txid_pos INTEGER NOT NULL, value REAL NOT NULL DEFAULT (0), FOREIGN KEY (wallet_id) REFERENCES wallets (id) ON DELETE CASCADE, FOREIGN KEY (address_id) REFERENCES addresses (id))`;
const LogsSQL = `CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, message STRING DEFAULT "")`;

const DefaultCoinsSQL = `INSERT INTO coins (name, bip44, is_default, label, symbol, icon_path, explorer_host, explorer_api_host, explorer_api_stats, electrumx_host, electrumx_port) values ("ODIN", 2100, "true", "ODIN", "Ø", "res://coin_odin", "https://explore.odinblockchain.org/", "https://inspect.odinblockchain.org/api", "https://inspect.odinblockchain.org/api/stats", "electrumx.odinblockchain.org", 50001)`;


@Injectable()
export class StorageService {
  private eventStream: ReplaySubject<string>;
  public preferences: any;
  public databaseName: string;
  public odb: any;
  
  constructor(
    @Inject('serviceId') @Optional() public serviceId?: string) {
    this.serviceId = serviceId || 'StorageService';
    this.eventStream = new ReplaySubject();
    this.databaseName = DatabaseName;

    this.log('[Init]');
    this.emit(`Init`);

    this.loadPreferences = this.loadPreferences.bind(this);
    this.savePreferences = this.savePreferences.bind(this);
    this.loadTables = this.loadTables.bind(this);
    this.removeTables = this.removeTables.bind(this);
    this.createTable = this.createTable.bind(this);
    this.purgeTable = this.purgeTable.bind(this);
    this.connect = this.connect.bind(this);
  }

  get eventStream$() {
    return this.eventStream.asObservable();
  }

  /**
   * (protected) Logs `entry` to the console via `console.log`. Will prefix the log with
   * `serviceId` to namespace the log output.
   * 
   * @param entry The string to output to the console
   */
  protected log(entry: string): void {
    const subId = (this.serviceId === 'StorageService') ? '::Storage' : '';
    console.log(`[${this.serviceId}${subId}] ${entry}`);
  }

  /**
   * (protected) Logs `entry` to the console via `console.dir`. This method is for outputting
   * Objects/Arrays.
   * 
   * @param entry Array|Object|Any
   */
  protected dir(entry: any): void {
    const subId = (this.serviceId === 'StorageService') ? '::Storage' : '';
    console.log(`[${this.serviceId}${subId}] Inspect ---`);
    console.dir(entry);
  }

  /**
   * (protected) Emits `eventName` through the `eventStream` `ReplaySubject`. Anyone listening
   * will receive `eventName` and all previous events.
   * 
   * Will also prefix all events with `serviceId`.
   * 
   * @param eventName Name of the event
   */
  protected emit(eventName: string): void {
    this.eventStream.next(`${this.serviceId}::${eventName}`);
  }

  /**
   * Runs a query to `sqlite_master` to check for the existence of `tableName`.
   * Returns `true` if found, `false` otherwise.
   * 
   * @param tableName The name of the table
   */
  public async tableExists(tableName: string): Promise<boolean> {
    const results = await this.odb.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName]);
    return !!(results);
  }

  /**
   * Runs `sql` to create a table name. Currently does not check if the query
   * was successful or not, assumes `true`. Will convert `tableName` to lowercase.
   * 
   * @param tableName The name of the table, used for events and logging
   * @param sql The SQL query to create the table
   */
  private async createTable(tableName: string, sql: string, defaultInsert?: string): Promise<boolean> {
    tableName = tableName.toLowerCase();
    if (!await this.dbReady()) {
      this.log(`...Table: [${tableName}] Skipped -- Not Connected`);
      return false;
    }

    if (await this.tableExists(tableName)) {
      this.log(`...Table: [${tableName}] Exists`);
      this.emit(`TableCreation::Create${tableName}`);
    } else {
      await this.odb.execSQL(sql);
      this.log(`...Table: [${tableName}] Created`);
      this.emit(`TableCreation::Create${tableName}`);

      if (defaultInsert && defaultInsert.length) {
        await this.odb.execSQL(defaultInsert);
        this.log(`...Table: [${tableName}] Default Data Executed`);
      }
    }
    return true;
  }

  /**
   * Will purge/delete a given `tableName` if the table exists. Will convert
   * `tableName` to lowercase.
   * 
   * @param tableName The name of the table to purge
   */
  private async purgeTable(tableName: string): Promise<boolean> {
    tableName = tableName.toLowerCase();
    if (!await this.dbReady()) {
      this.log(`...Purge: [${tableName}] Skipped -- Not Connected`);
      return false;
    }

    await this.odb.execSQL(`DROP TABLE IF EXISTS ${tableName}`);
    this.log(`...Table: [${tableName}] Purged`);
    this.emit(`TablePurge::${tableName}`);
  }

  /**
   * Returns an array of tables from the sql_master table
   */
  public listAllTables(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!await this.dbReady()) {
        this.log(`Unable to list all tables... Not Connected`);
        return resolve([]);
      }

      const tables = await this.odb.all(`SELECT name FROM sqlite_master WHERE type='table'`);
      return resolve(Object.keys(tables).map(key => tables[key].name));
    });
  }

  /**
   * Runs through all the tables that should exists and creates them
   * if they don't.
   * 
   * Current Tables:
   * - Accounts
   * - Contacts
   * - Messages
   * - Coins
   * - Wallets
   * - Addresses
   * - Transactions
   * - Unspent
   * - Logs
   * 
   * @param forcePurge `(false)` Whether or not `StorageService` should run a purge before loading tables
   */
  private loadTables(forcePurge = false): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!await this.dbReady()) {
        this.log('setup failed, not open');
        this.emit('TableLoadFail');
        return reject('database_not_loaded');
      }

      if (forcePurge) {
        await this.removeTables();
        await this.clearStorage();
      }

      // await this.purgeTable('contacts');
      // await this.purgeTable('messages');
      await this.purgeTable('coins');
      await this.purgeTable('wallets');
      await this.purgeTable('addresses');
      await this.purgeTable('transactions');
      await this.purgeTable('unspent');


      this.emit('TableLoadBegin');
      this.log('[loadTables] Start');

      try {
        // let foo = await this.odb.all(`SELECT name FROM sqlite_master WHERE type='table'`);
        await this.createTable('accounts', AccountsSQL);
        await this.createTable('clients', ClientsSQL);
        await this.createTable('contacts', ContactsSQL);
        await this.createTable('messages', MessagesSQL);
        await this.createTable('coins', CoinsSQL, DefaultCoinsSQL);
        await this.createTable('wallets', WalletsSQL);
        await this.createTable('addresses', AddressesSQL);
        await this.createTable('transactions', TransactionsSQL);
        await this.createTable('unspent', UnspentSQL);
        await this.createTable('logs', LogsSQL);

        this.log('[loadTables] End');
        this.emit('TableLoadEnd');
        return resolve(true);
      } catch (err) {
        this.log('setup uncaught error');
        console.log(err);
        this.emit('TableLoadUncaughtError');
        return reject(new Error('table_load_failed'));
      }
    });
  }

  /**
   * Purges all the tables that were created if they exist.
   */
  private removeTables(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!await this.dbReady()) {
        log('purge failed, not open');
        this.emit('TablePurgeBeginFail');
        return reject('database_not_loaded');
      }

      this.log('[purgeTables] Start');
      this.emit('TablePurgeBegin');

      try {
        await this.purgeTable('accounts');
        await this.purgeTable('clients');
        await this.purgeTable('contacts');
        await this.purgeTable('messages');
        await this.purgeTable('coins');
        await this.purgeTable('wallets');
        await this.purgeTable('addresses');
        await this.purgeTable('transactions');
        await this.purgeTable('unspent');

        this.log('[purgeTables] End');
        this.emit('TablePurgeEnd');
        return resolve(true);
      } catch (err) {
        this.log('purge uncaught error');
        console.log(err);
        this.emit('TablePurgeUncaughtError');
        return reject(new Error('table_purge_failed'));
      }
    });
  }

  /**
   * Checks if `odb` has been created and is open.
   * Will return `true` if checks complete, `false` otherwise.
   */
  public async dbReady(): Promise<boolean> {
    if (!this.odb || !this.odb.isOpen()) {
      this.log('RESTARTING DB SERVICE');
      this.odb = await new SqlLite(this.databaseName);
      this.odb.resultType(SqlLite.RESULTSASOBJECT);
    }

    return true;
  }

  /**
   * connect
   * Establishes a connection to a SQLite Database
   */
  public connect(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        this.log('making connection');
        this.odb = await new SqlLite(this.databaseName);
        this.odb.resultType(SqlLite.RESULTSASOBJECT);
        // console.log('is SQL?', SqlLite.isSqlite(this.odb));
        // console.log('is Open?', this.odb.isOpen());
        
        this.log('connected');
        this.emit('Connected');
        return resolve(true);
      } catch (err) {
        this.log('unable to connect to sqlite storage');
        console.log(err);
        this.emit('ConnectUncaughtError')
        return reject(err);
      }
    });
  }

  /**
   * Any methods or functionality needed to load the
   * StorageService.
   */
  public loadStorage(forcePurge = false): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.emit('Load');

      this.connect()
      .then(() => this.loadTables(forcePurge))
      .then(() => {
        this.emit('Ready');
        this.emit('Set');
        setTimeout(()=>{ this.emit('GOOO'); }, 3000);
        return resolve(true);
      })
      .catch((err) => {
        this.log('unable to load storage');
        console.log(err);
        this.emit('error');
        return reject(new Error('storage_load_failed'));
      });
    });
  }

  public async loadPreferences(): Promise<boolean> {
    this.log('Loading preferences');

    const preferences = this.hasKey('preferences')
                          ? this.getString('preferences')
                          : '';

    try {
      this.preferences = JSON.parse(preferences);
    } catch (err) {
      console.log('Trouble loading preferences, applying default...');
      this.preferences = {
        api_url: 'https://osm-testnet.obsidianplatform.com',
        explorer_url: 'https://inspect.odinblockchain.org/api'
      };
    }

    return this.preferences;
  }

  public async savePreferences(preferences = this.preferences): Promise<boolean> {
    try {
      preferences = typeof preferences === 'string'
                      ? preferences
                      : JSON.stringify(preferences);
    } catch (err) {
      console.log('Trouble saving preferences, applying default...');
      preferences = JSON.stringify({
        api_url: 'https://osm-testnet.obsidianplatform.com',
        explorer_url: 'https://inspect.odinblockchain.org/api'
      });
    }

    this.log('Saving preferences');
    console.log(preferences);

    this.setString('preferences', preferences);
    this.preferences = JSON.parse(preferences);
    return true;
  }


  /* OLD METHODS BELOW */


  public hasKey(key: string) {
    return hasKey(key);
  }

  public getString(key: string, defaultString?: any) {
    if (typeof defaultString === 'undefined') defaultString = '';

    return getString(key, defaultString);
  }

  public setString(key: string, defaultString?: any) {
    if (typeof defaultString === 'undefined') defaultString = '';

    return setString(key, defaultString);
  }

  public clearStorage() {
    return clear();
  }

  // public fetchStorageKeys() {
  //   if (isAndroid) {
  //     const sharedPreferences = getNativeApplication().getApplicationContext().getSharedPreferences("prefs.db", 0);
  //     const mappedPreferences = sharedPreferences.getAll();
  //     const iterator = mappedPreferences.keySet().iterator();

  //     while (iterator.hasNext()) {
  //       const key = iterator.next();
  //       console.log(key); // myString, myNumbver, isReal
  //       const value = mappedPreferences.get(key);
  //       console.log(value); // "John Doe", 42, true
  //     }

  //   } else if (isIOS) {
  //     // tslint:disable-next-line
  //     // Note: If using TypeScript you will need tns-platform-declarations plugin to access the native APIs like NSUserDefaults
  //     const userDefaults = utils.ios.getter(NSUserDefaults, NSUserDefaults.standardUserDefaults);
  //     const dictionaryUserDefaults = userDefaults.dictionaryRepresentation();

  //     const allKeys = dictionaryUserDefaults.allKeys;
  //     console.log(allKeys);
  //     const allValues = dictionaryUserDefaults.allValues;
  //     console.log(allValues);
  //   }
  // }
}

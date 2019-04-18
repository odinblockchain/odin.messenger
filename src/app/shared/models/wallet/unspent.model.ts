import { Deserializable } from '../deserializable.model';
import { Database } from '../database.model';

export class Unspent extends Database {
  // database
  id: number;
  wallet_id: number;
  address_id: number;
  address: string;
  height: number;
  txid: string;
  txid_pos: number;
  value: number;

  // runtime
  wif: string;

  constructor(props: any) {
    super('Unspent');
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }
}

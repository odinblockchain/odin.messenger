import { Deserializable } from '../deserializable.model';
import { Database } from '../database.model';

export class Transaction extends Database {
  id: number;
  wallet_id: number;
  address_id: number;
  txid: string;
  height: number;
  vin_addresses: string;
  vout_addresses: string;
  value: number;
  timestamp: number;

  constructor(props: any) {
    super('Transaction');
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }
}

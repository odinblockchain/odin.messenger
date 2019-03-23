import { Deserializable } from '../deserializable.model';

export class Unspent implements Deserializable {
  id: number;
  wallet_id: number;
  address_id: number;
  height: number;
  txid: string;
  txid_pos: number;
  value: number;

  constructor(props: any) {
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }
}

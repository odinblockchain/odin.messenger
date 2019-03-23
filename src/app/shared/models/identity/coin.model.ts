import { Deserializable } from '../deserializable.model';

export class Coin implements Deserializable {
  name: string;
  label: string;
  symbol: string;
  icon_path: string;
  explorer_host: string;
  electrumx_host: string;
  electrumx_port: number;

  constructor(props: any) {
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }
}

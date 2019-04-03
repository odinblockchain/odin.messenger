import { Deserializable } from '../deserializable.model';

export class Coin implements Deserializable {
  name: string;
  is_default: boolean;
  bip44: number;
  label: string;
  symbol: string;
  icon_path: string;
  explorer_host: string;
  explorer_api_host: string;
  explorer_api_stats: string;
  electrumx_host: string;
  electrumx_port: number;

  constructor(props: any) {
    this.deserialize(props);
  }

  deserialize(input: any) {
    if (!input) return this;

    if (`${input.is_default}` === '0' || input.is_default === 'false') {
      input.is_default = false
    } else if (`${input.is_default}` === "1" || input.is_default === 'true') {
      input.is_default = true;
    }

    Object.assign(this, input);
    return this;
  }
}

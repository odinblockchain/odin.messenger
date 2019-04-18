import { Deserializable } from '../deserializable.model';

export class Coin implements Deserializable {
  // db
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

  constructor(props?: any) {
    this.deserialize(props);
  }

  deserialize(input?: any) {
    if (!input) return this;

    if (`${input.is_default}` === '0' || input.is_default === 'false') {
      input.is_default = false
    } else if (`${input.is_default}` === "1" || input.is_default === 'true') {
      input.is_default = true;
    }

    Object.assign(this, input);
    return this;
  }

  public serialize() {
    return {
      name: this.name,
      is_default: this.is_default,
      bip44: this.bip44,
      label: this.label,
      symbol: this.symbol,
      icon_path: this.icon_path,
      explorer_host: this.electrumx_host,
      explorer_api_host: this.explorer_api_host,
      explorer_api_stats: this.explorer_api_stats,
      electrumx_host: this.electrumx_host,
      electrumx_port: this.electrumx_port
    };
  }
}

export class ElectrumxTransaction {
  tx_hash: string;
  height: number;
  address?: string;
}

export class ElectrumxAddress {
  addressIndex: number;
  address: string;
  hash: string;
  balance: ElectrumxBalance;
  transactions: string[];
}

export class ElectrumxBalance {
  confirmed: number;
  unconfirmed: number;
}

export class ElectrumxUnspent {
  tx_hash: string;
  tx_pos: string;
  height: string;
  value: number;
  address?: string;
}

export class ElectrumxAddressDiscovery {
  addresses: ElectrumxAddress[];
  transactions: ElectrumxTransaction[];
  unspent: ElectrumxUnspent[];
}

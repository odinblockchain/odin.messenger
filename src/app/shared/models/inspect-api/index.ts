export class InspectTransactionReceived {
  addresses: string;
  amount: number;
  hex: string[];
}

export class InspectTransactionSent {
  addresses: string;
  amount: number;
}

export class InspectTransaction {
  tx_hash: string;
  height: string;
  address: string;
  blockheight: number;
  timestamp: number;
  value: number;
  received?: InspectTransactionReceived;
  sent?: InspectTransactionSent;
}


export class InspectAPITransactionVIN {
  addresses: string;
  amount: number;
}

export class InspectAPITransactionVOUT {
  addresses: string;
  amount: number;
  hex: string[];
}

export class InspectAPITransaction {
  vin: InspectAPITransactionVIN[];
  vout: InspectAPITransactionVOUT[];
  total: number;
  timestamp: number;
  blockheight: number;
  blockhash: string;
}

export class InspectAPIFetchTransaction {
  status: string;
  tx: InspectAPITransaction;
}

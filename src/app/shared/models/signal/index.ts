export class SignalClient {
  store: any; //LibsignalProtocol.Interface.ISignalProtocolStore;
  registrationId: number;
  username: string;
  deviceId: number;
}

export class SignalClientSerialized {
  username: string;
  deviceId: number;
  registrationId: number;
  address: {
    name: string,
    deviceId: number
  };
  identityKeyPair: string;
  signedPreKey: string;
  contacts: SignalClientContact[];
  preKeys: SignalClientPreKey[];
}

export class SignalClientContact {
  address: SignalAddress;
  preKeyBundle: PreKeyBundle;
}

export class PreKeyBundle {
  registrationId: number;
  deviceId: number;
  preKeyPublic: string;
  preKeyRecordId: number;
  signedPreKeyPublic: string;
  signedPreKeyRecordId: number;
  signature: string;
  identityPubKey: string;
}

export class LocalContact {
  address: SignalAddress;
  displayName: string;
  preKeyBundle: PreKeyBundle;
}

export class SignalAddress {
  name: string;
  registrationId: number;
  deviceId: number;
}

export class SignalClientPreKey {
  id: number;
  pubKey: string;
  serialized: string;
}

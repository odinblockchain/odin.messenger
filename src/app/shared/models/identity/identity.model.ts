export class Identity {
  masterSeed: string;
  mnemonicPhrase: string;
  seedHex: string;
  registrationId: number;
  deviceId: number;
  registered: boolean;

  constructor(props?: any) {
    this.setDefaults();
    this.deserialize(props);
  }

  setDefaults() {
    this.masterSeed = '';
    this.mnemonicPhrase = '';
    this.seedHex = '';
    this.registrationId = 0;
    this.deviceId = 0;
    this.registered = false;
  }

  deserialize(input: any = {}) {
    console.log('...input');
    console.dir(input);
    Object.assign(this, input);
    return this;
  }
}

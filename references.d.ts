/// <reference path="./node_modules/tns-core-modules/tns-core-modules.d.ts" /> Needed for autocompletion and compilation.

declare namespace NodeJS {
  interface Global {
    env: any;
    version: string;
  }
}

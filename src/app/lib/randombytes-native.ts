import { Buffer } from 'buffer';

declare var java: any;
declare var android: any;

export default function randomBytes(length: number, cb?: any) {
  let bytes = java.lang.reflect.Array.newInstance(java.lang.Byte.class.getField("TYPE").get(null), 10);
  new java.security.SecureRandom().nextBytes(bytes);
  let encoder = 	java.util.Base64.getUrlEncoder().withoutPadding();
  let token = encoder.encodeToString(bytes);

  if (cb) {
    cb(null, token);
  } else {
    return token;
  }
};

// import CryptoJS from "crypto-js";

/*!
* Random number generator with ArcFour PRNG
* 
* NOTE: For best results, put code like
* <body onclick='SecureRandom.seedTime();' onkeypress='SecureRandom.seedTime();'>
* in your main HTML document.
* 
* Copyright Tom Wu, bitaddress.org  BSD License.
* http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE
*/

export default class SecureRandom {
  public state;
  public pool;
  public pptr;
  public poolCopyOnInit;

  // Pool size must be a multiple of 4 and greater than 32.
  // An array of bytes the size of the pool will be passed to init()
  public poolSize = 256;

  constructor() {
    this.pool = new Array();
    this.pptr = 0;

    let t;
    while (this.pptr < this.poolSize) {  // extract some randomness from Math.random()
      t = Math.floor(65536 * Math.random());
      this.pool[this.pptr++] = t >>> 8;
      this.pool[this.pptr++] = t & 255;
    }

    this.pptr = Math.floor(this.poolSize * Math.random());
    this.seedTime();

    console.log('\t SecureRandom created');

    // entropy
    // let entropyStr = "";

    // screen size and color depth: ~4.8 to ~5.4 bits
    // entropyStr += (window.screen.height * window.screen.width * window.screen.colorDepth);
    // entropyStr += (window.screen.availHeight * window.screen.availWidth * window.screen.pixelDepth);

    // time zone offset: ~4 bits
    // let dateObj = new Date();
    // let timeZoneOffset = dateObj.getTimezoneOffset();
    
    // entropyStr += timeZoneOffset;

    // user agent: ~8.3 to ~11.6 bits
    // entropyStr += navigator.userAgent;

    // browser plugin details: ~16.2 to ~21.8 bits
    // var pluginsStr = "";
    // for (var i = 0; i < navigator.plugins.length; i++) {
    //   pluginsStr += navigator.plugins[i].name + " " + navigator.plugins[i].filename + " " + navigator.plugins[i].description + " " + navigator.plugins[i].version + ", ";
    // }
    // var mimeTypesStr = "";
    // for (var i = 0; i < navigator.mimeTypes.length; i++) {
    //   mimeTypesStr += navigator.mimeTypes[i].description + " " + navigator.mimeTypes[i].type + " " + navigator.mimeTypes[i].suffixes + ", ";
    // }
    // entropyStr += pluginsStr + mimeTypesStr;

    // cookies and storage: 1 bit
    // entropyStr += navigator.cookieEnabled + typeof (sessionStorage) + typeof (localStorage);

    // language: ~7 bit
    // entropyStr += navigator.language;
    // history: ~2 bit

    // entropyStr += window.history.length;
    // location
    // entropyStr += window.location;

    // let entropyBytes = Crypto.SHA256(entropyStr, { asBytes: true });
    // for (var i = 0 ; i < entropyBytes.length ; i++) {
    //   this.seedInt8(entropyBytes[i]);
    // }
  }

  // Mix in the current time (w/milliseconds) into the pool
  // NOTE: this method should be called from body click/keypress event handlers to increase entropy
  public seedTime = function() {
    this.seedInt(new Date().getTime());
  }

  
  public getByte = function() {

    if (this.state == null) {
      this.seedTime();
      this.state = this.ArcFour(); // Plug in your RNG constructor here
      this.state.init(this.pool);
      this.poolCopyOnInit = [];
      for (this.pptr = 0; this.pptr < this.pool.length; ++this.pptr) {
        this.poolCopyOnInit[this.pptr] = this.pool[this.pptr];
      }
      
      this.pptr = 0;
    }

    // TODO: allow reseeding after first request
    return this.state.next();
  }

  // Mix in a 32-bit integer into the pool
  public seedInt = function(x) {
    this.seedInt8(x);
    this.seedInt8((x >> 8));
    this.seedInt8((x >> 16));
    this.seedInt8((x >> 24));
  }

  // Mix in a 16-bit integer into the pool
  public seedInt16 = function(x) {
    this.seedInt8(x);
    this.seedInt8((x >> 8));
  }

  // Mix in a 8-bit integer into the pool
  public seedInt8 = function(x) {
    this.pool[this.pptr++] ^= x & 255;
    if (this.pptr >= this.poolSize) this.pptr -= this.poolSize;
  }

  // Arcfour is a PRNG
  public ArcFour = function() {
    function Arcfour() {
      this.i = 0;
      this.j = 0;
      this.S = new Array();
    }

    // Initialize arcfour context from key, an array of ints, each from [0..255]
    function ARC4init(key) {
      let i, j, t;
      for (i = 0; i < 256; ++i) {
        this.S[i] = i;
      }

      j = 0;
      for (i = 0; i < 256; ++i) {
        j = (j + this.S[i] + key[i % key.length]) & 255;
        t = this.S[i];
        this.S[i] = this.S[j];
        this.S[j] = t;
      }

      this.i = 0;
      this.j = 0;
    }

    function ARC4next() {
      let t;
      this.i = (this.i + 1) & 255;
      this.j = (this.j + this.S[this.i]) & 255;
      t = this.S[this.i];
      this.S[this.i] = this.S[this.j];
      this.S[this.j] = t;
      return this.S[(t + this.S[this.i]) & 255];
    }

    Arcfour.prototype.init = ARC4init;
    Arcfour.prototype.next = ARC4next;
    return new Arcfour();
  };
}

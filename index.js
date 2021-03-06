// Generated by CoffeeScript 1.5.0
var BParser, afn, aliaspairs, attach_word_methods, bp, bph, buf, bufpar, bufs, fn, obj, wordfuncs, _i, _len;

wordfuncs = {
  word8s: ['readInt8', 1],
  word8u: ['readUInt8', 1],
  word16bs: ['readInt16BE', 2],
  word16ls: ['readInt16LE', 2],
  word16bu: ['readUInt16BE', 2],
  word16lu: ['readUInt16LE', 2],
  word32bs: ['readInt32BE', 4],
  word32ls: ['readInt32LE', 4],
  word32bu: ['readUInt32BE', 4],
  word32lu: ['readUInt32LE', 4]
};

aliaspairs = {
  word8: 'word8u',
  word8be: 'word8u',
  word8bs: 'word8s',
  word16le: 'word16lu',
  word16be: 'word16bu',
  word32le: 'word32lu',
  word32be: 'word32bu'
};

for (fn in aliaspairs) {
  afn = aliaspairs[fn];
  wordfuncs[fn] = wordfuncs[afn];
}

BParser = (function() {

  function BParser(inbuf) {
    this.inbuf = inbuf;
    this.vars = {};
    this.offt = 0;
  }

  BParser.prototype.tap = function(cb) {
    cb.call(this, this.vars);
    return this;
  };

  BParser.prototype.into = function(key, cb) {
    if (this.vars[key] == null) {
      this.vars[key] = {};
      cb.call(this, vars);
    }
    return this;
  };

  BParser.prototype.loop = function(cb) {
    var end, ender;
    end = false;
    ender = (function() {
      return end = true;
    });
    while (end === false) {
      cb.call(this, ender, vars);
    }
    return this;
  };

  BParser.prototype.buffer = function(name, size) {
    var buf;
    if (size == null) {
      size = this.inbuf.length;
    }
    if (typeof size === 'string') {
      size = this.vars[size];
    }
    buf = this.inbuf.slice(this.offt, Math.min(this.inbuf.length, this.offt + size));
    this.offt += size;
    this.vars[name] = buf;
    return this;
  };

  BParser.prototype.string = function(name, size) {
    if (size === null) {
      size = this.inbuf.length;
    }
    this.vars[name] = this.inbuf.toString('utf8', this.offt, Math.min(this.inbuf.length, this.offt + size));
    this.offt += size;
    return this;
  };

  BParser.prototype.cstring = function(name, size) {
    var s, si;
    this.string(name, size);
    s = this.vars[name];
    si = s.indexOf('\0');
    if (si >= 0) {
      this.vars[name] = s.slice(0, s.indexOf('\0'));
    }
    return this;
  };

  BParser.prototype.skip = function(nbytes) {
    if (typeof nbytes === 'string') {
      nbytes = this.vars[nbytes];
    }
    this.offt += nbytes;
    return this;
  };

  BParser.prototype.scan = function(name, search) {
    var i, j;
    if (typeof search === 'string') {
      search = new Buffer(search);
    } else if (!Buffer.isBuffer(search)) {
      throw new Error('search must be a Buffer or a string');
    }
    this.vars[name] = null;
    i = 0;
    while ((i + this.offs) <= (this.inbuf.length - search.length + 1)) {
      j = 0;
      while (j < search.length && this.inbuf[this.offs + i + j] === search[j]) {
        if (j === search.length) {
          break;
        }
        j++;
      }
      i++;
    }
    this.vars[name] = buffer.slice(this.offt, this.offt + i);
    this.offt += i + search.length;
    return this;
  };

  BParser.prototype.peek = function(cb) {
    var offset, was;
    was = offset;
    cb.call(this, this.vars);
    offset = this.offt(offset = was);
    return this;
  };

  BParser.prototype.flush = function() {
    this.vars = {};
    return this;
  };

  BParser.prototype.tell = function() {
    return this.offt;
  };

  BParser.prototype.eof = function() {
    return this.offt >= this.inbuf.length;
  };

  return BParser;

})();

attach_word_methods = function(bpclass) {
  var methods, wfp, wm;
  methods = bpclass.prototype;
  for (wm in wordfuncs) {
    wfp = wordfuncs[wm];
    methods[wm] = (function(wfp) {
      var bm, len;
      bm = wfp[0], len = wfp[1];
      return function(nm) {
        this.vars[nm] = this.inbuf[bm](this.offt);
        this.offt += len;
        return this;
      };
    })(wfp);
  }
  return null;
};

attach_word_methods(BParser);

module.exports = function(buf) {
  return module.exports.parse(buf);
};

module.exports.parse = function(buf) {
  return new BParser(buf);
};

if (require.main === module) {
  buf = new Buffer([97, 98, 99, 99, 99, 99, 1, 65, 0, 67]);
  bufpar = new BParser(buf);
  obj = bufpar.word8('a').word16be('bc').skip(1).buffer('d', 3).cstring('e', 3).vars;
  bufs = [new Buffer([97, 65, 66, 67]), new Buffer([33, 0xf3, 0xf5])];
  for (_i = 0, _len = bufs.length; _i < _len; _i++) {
    buf = bufs[_i];
    bp = new BParser(buf);
    bph = bp.word8('type').tap(function(hdr) {
      switch (hdr.type) {
        case 97:
          return this.string('name', 3);
        case 33:
          return this.word16bs('code');
      }
    });
    console.log('obj=', bph.vars);
  }
}

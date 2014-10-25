
wordfuncs =
  word8s: ['readInt8',1]
  word8u: ['readUInt8',1]
  word16bs: [ 'readInt16BE', 2]
  word16ls: [ 'readInt16LE', 2]
  word16bu: [ 'readUInt16BE', 2]
  word16lu: [ 'readUInt16LE', 2]
  word32bs: [ 'readInt32BE', 4]
  word32ls: [ 'readInt32LE', 4]
  word32bu: [ 'readUInt32BE', 4]
  word32lu: [ 'readUInt32LE', 4]

aliaspairs=
  word8: 'word8u'
  word8be:  'word8u'
  word8bs:  'word8s'
  word16le:  'word16lu'
  word16be:  'word16bu'
  word32le:  'word32lu'
  word32be:  'word32bu'

wordfuncs[fn] = wordfuncs[afn] for fn, afn of aliaspairs
 
class BParser
  constructor: (inbuf) ->
    @inbuf = inbuf
    @vars = {}
    @offt=0
  tap: (cb)->
    cb.call @, @vars
    @
   
  into: (key, cb)->
    if not @vars[key]?
      @vars[key]= {}
      cb.call this, vars
    @
  loop: (cb)->
    end = false
    ender = (->  end = true)
    while end is false
      cb.call @, ender, vars
    @
  buffer: ( name, size)->
    size = @inbuf.length if not size?
    if typeof size is 'string'
      size = @vars[size]
    buf = @inbuf.slice @offt, Math.min(@inbuf.length, @offt + size)
    @offt += size
    @vars[name] = buf
    @
  string: ( name, size)->
    size=@inbuf.length if size is null
    @vars[name] = @inbuf.toString( 'utf8', @offt, Math.min(@inbuf.length, @offt + size))
    @offt += size
    @
  cstring: (name, size) ->
    @string name, size
    s = @vars[name]
    si = s.indexOf('\0')
    if si >=0
      @vars[name] = s.slice 0, s.indexOf('\0')
    @
  skip: (nbytes) ->
    if typeof nbytes is 'string'
      nbytes = @vars[nbytes]
    @offt += nbytes
    @
  scan: (name, search) ->
    if typeof search is 'string'
      search = new Buffer(search)
    else if not Buffer.isBuffer(search)
      throw new Error('search must be a Buffer or a string')
    @vars[name]= null
    # simple but slow string search
    i=0
    while (i + @offs) <= (@inbuf.length - search.length + 1)
      j=0
      while j < search.length and @inbuf[@offs+i+j] is search[j]
        break if j is search.length
        j++
      i++
    @vars[name]= buffer.slice @offt, @offt + i
    @offt+=i+search.length
    @
    
  peek: (cb)->
    was = offset
    cb.call @, @vars
    offset = @offt offset = was
    @
  flush:->
    @vars = {}
    @
  tell:->
    @offt
  eof:->
    @offt >= @inbuf.length

attach_word_methods = (bpclass)->
  methods = bpclass::
  for wm, wfp of wordfuncs
    methods[wm] = ((wfp)->
      [bm, len]=wfp
      (nm)->
        @vars[nm] = @inbuf[bm]( @offt)
        @offt+=len
        @
    )(wfp)
  null

attach_word_methods BParser
#exports = module.exports
module.exports = (buf)->
  module.exports.parse buf
module.exports.parse = (buf)->
  new BParser(buf)
   
if require.main == module
  #if process.argv.length <3
  buf = new Buffer([ 97, 98, 99, 99, 99, 99, 1, 65,0,67 ])
  bufpar = new BParser( buf)
  obj = bufpar.word8('a').word16be('bc').skip(1).buffer('d', 3).cstring('e', 3).vars
  
  bufs = [
    new Buffer([ 97, 65, 66, 67  ]),
    new Buffer([ 33, 0xf3, 0xf5 ])
  ]
  for buf in bufs
    bp = new BParser(buf)
    bph = bp.word8('type').tap (hdr)->
      switch hdr.type
        when 97 then this
          .string('name',3)
        when 33 then this
          .word16bs('code')
    console.log 'obj=', bph.vars

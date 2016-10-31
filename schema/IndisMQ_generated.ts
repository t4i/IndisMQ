// automatically generated by the FlatBuffers compiler, do not modify

import {flatbuffers} from "../../flatbuffers/js/tsTest/flatbuffers"
/**
 * @enum
 */
export namespace IndisMQ{
export enum MsgType{
  NONE= 0,
  PEER= 1,
  MULT= 2,
  QUEUE= 3,
  CMD= 4
}}

/**
 * @enum
 */
export namespace IndisMQ{
export enum Cmd{
  NONE= 0,
  SUB= 1,
  UNSUB= 2,
  SYN= 3
}}

/**
 * @enum
 */
export namespace IndisMQ{
export enum Sts{
  NONE= 0,
  ERROR= 1,
  REQ= 2,
  REP= 3,
  CANCEL= 4,
  SUCCESS= 5
}}

/**
 * @enum
 */
export namespace IndisMQ{
export enum Err{
  NONE= 0,
  NO_HANDLER= 1,
  INVALID= 2,
  REMOTE= 3,
  TIMEOUT= 4
}}

/**
 * @constructor
 */
export namespace IndisMQ{
export class Ver {
  /**
   * @type {flatbuffers.ByteBuffer}
   */
  bb: flatbuffers.ByteBuffer= null;

  /**
   * @type {number}
   */
  bb_pos:number = 0;
/**
 * @param {number} i
 * @param {flatbuffers.ByteBuffer} bb
 * @returns {Ver}
 */
__init(i:number, bb:flatbuffers.ByteBuffer):Ver {
  this.bb_pos = i;
  this.bb = bb;
  return this;
};

/**
 * @returns {number}
 */
Major():number {
  return this.bb.readInt8(this.bb_pos);
};

/**
 * @param {number} value
 * @returns {boolean}
 */
mutate_Major(value:number):boolean {
  var offset = this.bb.__offset(this.bb_pos, 0)

  if (offset === 0) {
    return false;
  }

  this.bb.writeInt8(this.bb_pos + offset, value);
  return true;
}

/**
 * @returns {number}
 */
Minor():number {
  return this.bb.readInt8(this.bb_pos + 1);
};

/**
 * @param {number} value
 * @returns {boolean}
 */
mutate_Minor(value:number):boolean {
  var offset = this.bb.__offset(this.bb_pos, 1)

  if (offset === 0) {
    return false;
  }

  this.bb.writeInt8(this.bb_pos + offset, value);
  return true;
}

/**
 * @param {flatbuffers.Builder} builder
 * @param {number} Major
 * @param {number} Minor
 * @returns {flatbuffers.Offset}
 */
static createVer(builder:flatbuffers.Builder, Major: number, Minor: number):flatbuffers.Offset {
  builder.prep(1, 2);
  builder.writeInt8(Minor);
  builder.writeInt8(Major);
  return builder.offset();
};

}
}
/**
 * @constructor
 */
export namespace IndisMQ{
export class Imq {
  /**
   * @type {flatbuffers.ByteBuffer}
   */
  bb: flatbuffers.ByteBuffer= null;

  /**
   * @type {number}
   */
  bb_pos:number = 0;
/**
 * @param {number} i
 * @param {flatbuffers.ByteBuffer} bb
 * @returns {Imq}
 */
__init(i:number, bb:flatbuffers.ByteBuffer):Imq {
  this.bb_pos = i;
  this.bb = bb;
  return this;
};

/**
 * @param {flatbuffers.ByteBuffer} bb
 * @param {Imq=} obj
 * @returns {Imq}
 */
static getRootAsImq(bb:flatbuffers.ByteBuffer, obj?:Imq):Imq {
  return (obj || new Imq).__init(bb.readInt32(bb.position()) + bb.position(), bb);
};

/**
 * @param {flatbuffers.ByteBuffer} bb
 * @returns {boolean}
 */
static bufferHasIdentifier(bb:flatbuffers.ByteBuffer):boolean {
  return bb.__has_identifier('0001');
};

/**
 * @param {number} index
 * @returns {number}
 */
Body(index: number):number {
  var offset = this.bb.__offset(this.bb_pos, 4);
  return offset ? this.bb.readUint8(this.bb.__vector(this.bb_pos + offset) + index) : 0;
};

/**
 * @returns {number}
 */
BodyLength():number {
  var offset = this.bb.__offset(this.bb_pos, 4);
  return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
};

/**
 * @returns {Uint8Array}
 */
BodyArray():Uint8Array {
  var offset = this.bb.__offset(this.bb_pos, 4);
  return offset ? new Uint8Array(this.bb.bytes().buffer, this.bb.__vector(this.bb_pos + offset), this.bb.__vector_len(this.bb_pos + offset)) : null;
};

/**
 * @param {flatbuffers.Encoding=} optionalEncoding
 * @returns {string|Uint8Array}
 */
From():string
From(optionalEncoding:flatbuffers.Encoding):string|Uint8Array
From(optionalEncoding?:any):string|Uint8Array {
  var offset = this.bb.__offset(this.bb_pos, 6);
  return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
};

/**
 * @param {flatbuffers.Encoding=} optionalEncoding
 * @returns {string|Uint8Array}
 */
To():string
To(optionalEncoding:flatbuffers.Encoding):string|Uint8Array
To(optionalEncoding?:any):string|Uint8Array {
  var offset = this.bb.__offset(this.bb_pos, 8);
  return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
};

/**
 * @returns {boolean}
 */
Broker():boolean {
  var offset = this.bb.__offset(this.bb_pos, 10);
  return offset ? !!this.bb.readInt8(this.bb_pos + offset) : false;
};

/**
 * @param {boolean} value
 * @returns {boolean}
 */
mutate_Broker(value:boolean):boolean {
  var offset = this.bb.__offset(this.bb_pos, 10)

  if (offset === 0) {
    return false;
  }

  this.bb.writeInt8(this.bb_pos + offset, +value);
  return true;
}

/**
 * @returns {IndisMQ.Cmd}
 */
Cmd():IndisMQ.Cmd {
  var offset = this.bb.__offset(this.bb_pos, 12);
  return offset ? /** @type {IndisMQ.Cmd} */ (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.Cmd.NONE;
};

/**
 * @param {IndisMQ.Cmd} value
 * @returns {boolean}
 */
mutate_Cmd(value:IndisMQ.Cmd):boolean {
  var offset = this.bb.__offset(this.bb_pos, 12)

  if (offset === 0) {
    return false;
  }

  this.bb.writeInt8(this.bb_pos + offset, value);
  return true;
}

/**
 * @param {flatbuffers.Encoding=} optionalEncoding
 * @returns {string|Uint8Array}
 */
MsgId():string
MsgId(optionalEncoding:flatbuffers.Encoding):string|Uint8Array
MsgId(optionalEncoding?:any):string|Uint8Array {
  var offset = this.bb.__offset(this.bb_pos, 14);
  return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
};

/**
 * @returns {IndisMQ.MsgType}
 */
MsgType():IndisMQ.MsgType {
  var offset = this.bb.__offset(this.bb_pos, 16);
  return offset ? /** @type {IndisMQ.MsgType} */ (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.MsgType.NONE;
};

/**
 * @param {IndisMQ.MsgType} value
 * @returns {boolean}
 */
mutate_MsgType(value:IndisMQ.MsgType):boolean {
  var offset = this.bb.__offset(this.bb_pos, 16)

  if (offset === 0) {
    return false;
  }

  this.bb.writeInt8(this.bb_pos + offset, value);
  return true;
}

/**
 * @returns {IndisMQ.Sts}
 */
Sts():IndisMQ.Sts {
  var offset = this.bb.__offset(this.bb_pos, 18);
  return offset ? /** @type {IndisMQ.Sts} */ (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.Sts.NONE;
};

/**
 * @param {IndisMQ.Sts} value
 * @returns {boolean}
 */
mutate_Sts(value:IndisMQ.Sts):boolean {
  var offset = this.bb.__offset(this.bb_pos, 18)

  if (offset === 0) {
    return false;
  }

  this.bb.writeInt8(this.bb_pos + offset, value);
  return true;
}

/**
 * @param {flatbuffers.Encoding=} optionalEncoding
 * @returns {string|Uint8Array}
 */
Path():string
Path(optionalEncoding:flatbuffers.Encoding):string|Uint8Array
Path(optionalEncoding?:any):string|Uint8Array {
  var offset = this.bb.__offset(this.bb_pos, 20);
  return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
};

/**
 * @returns {IndisMQ.Err}
 */
Err():IndisMQ.Err {
  var offset = this.bb.__offset(this.bb_pos, 22);
  return offset ? /** @type {IndisMQ.Err} */ (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.Err.NONE;
};

/**
 * @param {IndisMQ.Err} value
 * @returns {boolean}
 */
mutate_Err(value:IndisMQ.Err):boolean {
  var offset = this.bb.__offset(this.bb_pos, 22)

  if (offset === 0) {
    return false;
  }

  this.bb.writeInt8(this.bb_pos + offset, value);
  return true;
}

/**
 * @param {flatbuffers.Encoding=} optionalEncoding
 * @returns {string|Uint8Array}
 */
StsMsg():string
StsMsg(optionalEncoding:flatbuffers.Encoding):string|Uint8Array
StsMsg(optionalEncoding?:any):string|Uint8Array {
  var offset = this.bb.__offset(this.bb_pos, 24);
  return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
};

/**
 * @returns {boolean}
 */
Callback():boolean {
  var offset = this.bb.__offset(this.bb_pos, 26);
  return offset ? !!this.bb.readInt8(this.bb_pos + offset) : false;
};

/**
 * @param {boolean} value
 * @returns {boolean}
 */
mutate_Callback(value:boolean):boolean {
  var offset = this.bb.__offset(this.bb_pos, 26)

  if (offset === 0) {
    return false;
  }

  this.bb.writeInt8(this.bb_pos + offset, +value);
  return true;
}

/**
 * @param {IndisMQ.Ver=} obj
 * @returns {IndisMQ.Ver}
 */
Ver(obj?:IndisMQ.Ver):IndisMQ.Ver {
  var offset = this.bb.__offset(this.bb_pos, 28);
  return offset ? (obj || new IndisMQ.Ver).__init(this.bb_pos + offset, this.bb) : null;
};

/**
 * @param {flatbuffers.Builder} builder
 */
static startImq(builder:flatbuffers.Builder) {
  builder.startObject(13);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {flatbuffers.Offset} BodyOffset
 */
static addBody(builder:flatbuffers.Builder, BodyOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, BodyOffset, 0);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {Array.<number>} data
 * @returns {flatbuffers.Offset}
 */
static createBodyVector(builder:flatbuffers.Builder, data:number[] | Uint8Array):flatbuffers.Offset {
if(!data){
  return null
}
  builder.startVector(1, data.length, 1);
  for (var i = data.length - 1; i >= 0; i--) {
    builder.addInt8(data[i]);
  }
  return builder.endVector();
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {number} numElems
 */
static startBodyVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(1, numElems, 1);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {flatbuffers.Offset} FromOffset
 */
static addFrom(builder:flatbuffers.Builder, FromOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, FromOffset, 0);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {flatbuffers.Offset} ToOffset
 */
static addTo(builder:flatbuffers.Builder, ToOffset:flatbuffers.Offset) {
  builder.addFieldOffset(2, ToOffset, 0);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {boolean} Broker
 */
static addBroker(builder:flatbuffers.Builder, Broker:boolean) {
  builder.addFieldInt8(3, +Broker, +false);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {IndisMQ.Cmd} Cmd
 */
static addCmd(builder:flatbuffers.Builder, Cmd:IndisMQ.Cmd) {
  builder.addFieldInt8(4, Cmd, IndisMQ.Cmd.NONE);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {flatbuffers.Offset} MsgIdOffset
 */
static addMsgId(builder:flatbuffers.Builder, MsgIdOffset:flatbuffers.Offset) {
  builder.addFieldOffset(5, MsgIdOffset, 0);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {IndisMQ.MsgType} MsgType
 */
static addMsgType(builder:flatbuffers.Builder, MsgType:IndisMQ.MsgType) {
  builder.addFieldInt8(6, MsgType, IndisMQ.MsgType.NONE);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {IndisMQ.Sts} Sts
 */
static addSts(builder:flatbuffers.Builder, Sts:IndisMQ.Sts) {
  builder.addFieldInt8(7, Sts, IndisMQ.Sts.NONE);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {flatbuffers.Offset} PathOffset
 */
static addPath(builder:flatbuffers.Builder, PathOffset:flatbuffers.Offset) {
  builder.addFieldOffset(8, PathOffset, 0);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {IndisMQ.Err} Err
 */
static addErr(builder:flatbuffers.Builder, Err:IndisMQ.Err) {
  builder.addFieldInt8(9, Err, IndisMQ.Err.NONE);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {flatbuffers.Offset} StsMsgOffset
 */
static addStsMsg(builder:flatbuffers.Builder, StsMsgOffset:flatbuffers.Offset) {
  builder.addFieldOffset(10, StsMsgOffset, 0);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {boolean} Callback
 */
static addCallback(builder:flatbuffers.Builder, Callback:boolean) {
  builder.addFieldInt8(11, +Callback, +false);
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {flatbuffers.Offset} VerOffset
 */
static addVer(builder:flatbuffers.Builder, VerOffset:flatbuffers.Offset) {
  builder.addFieldStruct(12, VerOffset, 0);
};

/**
 * @param {flatbuffers.Builder} builder
 * @returns {flatbuffers.Offset}
 */
static endImq (builder:flatbuffers.Builder):flatbuffers.Offset {
  var offset = builder.endObject();
  return offset;
};

/**
 * @param {flatbuffers.Builder} builder
 * @param {flatbuffers.Offset} offset
 */
static finishImqBuffer(builder:flatbuffers.Builder, offset:flatbuffers.Offset) {
  builder.finish(offset, '0001');
};

}
}

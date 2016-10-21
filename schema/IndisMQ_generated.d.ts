import flatbuffers from "./flatbuffers";
export default IndisMQ;
/**
 * @enum
 */
export declare namespace IndisMQ {
    enum MsgType {
        NONE = 0,
        PEER = 1,
        MULT = 2,
        QUEUE = 3,
        CMD = 4,
    }
}
/**
 * @enum
 */
export declare namespace IndisMQ {
    enum Cmd {
        NONE = 0,
        SUB = 1,
        UNSUB = 2,
        SYN = 3,
    }
}
/**
 * @enum
 */
export declare namespace IndisMQ {
    enum Sts {
        NONE = 0,
        ERROR = 1,
        REQ = 2,
        REP = 3,
        CANCEL = 4,
        SUCCESS = 5,
    }
}
/**
 * @enum
 */
export declare namespace IndisMQ {
    enum Err {
        NONE = 0,
        NO_HANDLER = 1,
        INVALID = 2,
        REMOTE = 3,
        TIMEOUT = 4,
    }
}
/**
 * @constructor
 */
export declare namespace IndisMQ {
    class Ver {
        /**
         * @type {flatbuffers.ByteBuffer}
         */
        bb: flatbuffers.ByteBuffer;
        /**
         * @type {number}
         */
        bb_pos: number;
        /**
         * @param {number} i
         * @param {flatbuffers.ByteBuffer} bb
         * @returns {Ver}
         */
        __init(i: number, bb: flatbuffers.ByteBuffer): Ver;
        /**
         * @returns {number}
         */
        Major(): number;
        /**
         * @returns {number}
         */
        Minor(): number;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {number} Major
         * @param {number} Minor
         * @returns {flatbuffers.Offset}
         */
        static createVer(builder: flatbuffers.Builder, Major: number, Minor: number): flatbuffers.Offset;
    }
}
/**
 * @constructor
 */
export declare namespace IndisMQ {
    class Imq {
        /**
         * @type {flatbuffers.ByteBuffer}
         */
        bb: flatbuffers.ByteBuffer;
        /**
         * @type {number}
         */
        bb_pos: number;
        /**
         * @param {number} i
         * @param {flatbuffers.ByteBuffer} bb
         * @returns {Imq}
         */
        __init(i: number, bb: flatbuffers.ByteBuffer): Imq;
        /**
         * @param {flatbuffers.ByteBuffer} bb
         * @param {Imq=} obj
         * @returns {Imq}
         */
        static getRootAsImq(bb: flatbuffers.ByteBuffer, obj?: Imq): Imq;
        /**
         * @param {flatbuffers.ByteBuffer} bb
         * @returns {boolean}
         */
        static bufferHasIdentifier(bb: flatbuffers.ByteBuffer): boolean;
        /**
         * @param {number} index
         * @returns {number}
         */
        Body(index: number): number;
        /**
         * @returns {number}
         */
        BodyLength(): number;
        /**
         * @returns {Uint8Array}
         */
        BodyArray(): Uint8Array;
        /**
         * @param {flatbuffers.Encoding=} optionalEncoding
         * @returns {string|Uint8Array}
         */
        From(): string;
        From(optionalEncoding: flatbuffers.Encoding): string | Uint8Array;
        /**
         * @param {flatbuffers.Encoding=} optionalEncoding
         * @returns {string|Uint8Array}
         */
        To(): string;
        To(optionalEncoding: flatbuffers.Encoding): string | Uint8Array;
        /**
         * @returns {boolean}
         */
        Broker(): boolean;
        /**
         * @returns {IndisMQ.Cmd}
         */
        Cmd(): IndisMQ.Cmd;
        /**
         * @param {flatbuffers.Encoding=} optionalEncoding
         * @returns {string|Uint8Array}
         */
        MsgId(): string;
        MsgId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array;
        /**
         * @returns {IndisMQ.MsgType}
         */
        MsgType(): IndisMQ.MsgType;
        /**
         * @returns {IndisMQ.Sts}
         */
        Sts(): IndisMQ.Sts;
        /**
         * @param {flatbuffers.Encoding=} optionalEncoding
         * @returns {string|Uint8Array}
         */
        Path(): string;
        Path(optionalEncoding: flatbuffers.Encoding): string | Uint8Array;
        /**
         * @returns {IndisMQ.Err}
         */
        Err(): IndisMQ.Err;
        /**
         * @param {flatbuffers.Encoding=} optionalEncoding
         * @returns {string|Uint8Array}
         */
        StsMsg(): string;
        StsMsg(optionalEncoding: flatbuffers.Encoding): string | Uint8Array;
        /**
         * @returns {boolean}
         */
        Callback(): boolean;
        /**
         * @param {IndisMQ.Ver=} obj
         * @returns {IndisMQ.Ver}
         */
        Ver(obj?: IndisMQ.Ver): IndisMQ.Ver;
        /**
         * @param {flatbuffers.Builder} builder
         */
        static startImq(builder: flatbuffers.Builder): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} BodyOffset
         */
        static addBody(builder: flatbuffers.Builder, BodyOffset: flatbuffers.Offset): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {Array.<number>} data
         * @returns {flatbuffers.Offset}
         */
        static createBodyVector(builder: flatbuffers.Builder, data: number[] | Uint8Array): flatbuffers.Offset;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {number} numElems
         */
        static startBodyVector(builder: flatbuffers.Builder, numElems: number): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} FromOffset
         */
        static addFrom(builder: flatbuffers.Builder, FromOffset: flatbuffers.Offset): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} ToOffset
         */
        static addTo(builder: flatbuffers.Builder, ToOffset: flatbuffers.Offset): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {boolean} Broker
         */
        static addBroker(builder: flatbuffers.Builder, Broker: boolean): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {IndisMQ.Cmd} Cmd
         */
        static addCmd(builder: flatbuffers.Builder, Cmd: IndisMQ.Cmd): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} MsgIdOffset
         */
        static addMsgId(builder: flatbuffers.Builder, MsgIdOffset: flatbuffers.Offset): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {IndisMQ.MsgType} MsgType
         */
        static addMsgType(builder: flatbuffers.Builder, MsgType: IndisMQ.MsgType): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {IndisMQ.Sts} Sts
         */
        static addSts(builder: flatbuffers.Builder, Sts: IndisMQ.Sts): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} PathOffset
         */
        static addPath(builder: flatbuffers.Builder, PathOffset: flatbuffers.Offset): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {IndisMQ.Err} Err
         */
        static addErr(builder: flatbuffers.Builder, Err: IndisMQ.Err): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} StsMsgOffset
         */
        static addStsMsg(builder: flatbuffers.Builder, StsMsgOffset: flatbuffers.Offset): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {boolean} Callback
         */
        static addCallback(builder: flatbuffers.Builder, Callback: boolean): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} VerOffset
         */
        static addVer(builder: flatbuffers.Builder, VerOffset: flatbuffers.Offset): void;
        /**
         * @param {flatbuffers.Builder} builder
         * @returns {flatbuffers.Offset}
         */
        static endImq(builder: flatbuffers.Builder): flatbuffers.Offset;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} offset
         */
        static finishImqBuffer(builder: flatbuffers.Builder, offset: flatbuffers.Offset): void;
    }
}

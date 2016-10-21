(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var flatbuffers_1 = require("../schema/flatbuffers");
var IndisMQ_generated_1 = require("../schema/IndisMQ_generated");
exports.__esModule = true;
exports["default"] = imq;
var imq;
(function (imq_1) {
    var Msg = (function () {
        function Msg() {
        }
        return Msg;
    }());
    imq_1.Msg = Msg;
    var handlers = {};
    var messages = {};
    var subscribers = {};
    var brokerHandler;
    var relayHandler;
    var name = "unnamed";
    function setBrokerHandler(handler) {
        brokerHandler = handler;
    }
    imq_1.setBrokerHandler = setBrokerHandler;
    function setRelayHandler(handler) {
        relayHandler = handler;
    }
    imq_1.setRelayHandler = setRelayHandler;
    function parseMsg(data) {
        if (!data) {
            return null;
        }
        var m = new Msg();
        m.data = new flatbuffers_1["default"].ByteBuffer(data);
        m.fields = IndisMQ_generated_1["default"].Imq.getRootAsImq(m.data);
        return m;
    }
    function getImqMessage(id) {
        if (id in messages) {
            return messages[id];
        }
        return null;
    }
    function delMessage(id) {
        if (id in messages) {
            delete messages[id];
        }
    }
    imq_1.delMessage = delMessage;
    function addSubscriber(client, path) {
        if (!(path in subscribers)) {
            subscribers[path] = {};
        }
        subscribers[path][client] = false;
    }
    imq_1.addSubscriber = addSubscriber;
    function delSubscriber(client, path) {
        if (path in subscribers) {
            if (client in subscribers[path]) {
                delete subscribers[path][client];
            }
            if (Object.keys(subscribers[path]).length < 1) {
                delete subscribers[path];
            }
        }
    }
    imq_1.delSubscriber = delSubscriber;
    function setHandler(path, handler) {
        handlers[path] = handler;
    }
    imq_1.setHandler = setHandler;
    function getHandler(path) {
        if (path in handlers) {
            return handlers[path];
        }
        return null;
    }
    function delHandler(path) {
        if (path in handlers) {
            delete handlers[path];
        }
    }
    // export function setCallback(id: string, callback: Handler) {
    //     status[id] = status[id] | {}
    //     status[id].callback = callback
    // }
    // export function getCallback(id: string) {
    //     return status[id].callback
    // }
    function syn(stsMsg, callback) {
        var uid = newUID();
        var m = makeImq(uid, name, "", false, "", IndisMQ_generated_1["default"].MsgType.CMD, IndisMQ_generated_1["default"].Sts.REQ, IndisMQ_generated_1["default"].Err.NONE, stsMsg, IndisMQ_generated_1["default"].Cmd.SYN, null, callback);
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.syn = syn;
    function err(m, stsMsg, err) {
        return makeImq(m.fields.MsgId(), name, m.fields.From(), m.fields.Broker(), m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1["default"].Sts.ERROR, err, stsMsg, m.fields.Cmd(), null, null);
    }
    imq_1.err = err;
    function success(m, stsMsg) {
        return makeImq(m.fields.MsgId(), name, m.fields.From(), m.fields.Broker(), m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1["default"].Sts.SUCCESS, IndisMQ_generated_1["default"].Err.NONE, stsMsg, m.fields.Cmd(), null, null);
    }
    imq_1.success = success;
    function req(to, dest, msg, callback) {
        var uid = newUID();
        var m = makeImq(uid, name, to, false, dest, IndisMQ_generated_1["default"].MsgType.PEER, IndisMQ_generated_1["default"].Sts.REQ, IndisMQ_generated_1["default"].Err.NONE, "", IndisMQ_generated_1["default"].Cmd.SYN, msg, callback);
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.req = req;
    function rep(m, stsMsg, msg) {
        return makeImq(m.fields.MsgId(), name, m.fields.From(), m.fields.Broker(), m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1["default"].Sts.REP, IndisMQ_generated_1["default"].Err.NONE, stsMsg, m.fields.Cmd(), msg, null);
    }
    imq_1.rep = rep;
    function sub(path, handler, callback) {
        var uid = newUID();
        if (handler) {
            setHandler(path, handler);
        }
        var m = makeImq(uid, name, "", false, path, IndisMQ_generated_1["default"].MsgType.CMD, IndisMQ_generated_1["default"].Sts.REQ, IndisMQ_generated_1["default"].Err.NONE, "", IndisMQ_generated_1["default"].Cmd.SUB, null, callback);
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.sub = sub;
    function unSub(path, handler, callback) {
        var uid = newUID();
        delHandler(path);
        var m = makeImq(uid, name, "", false, path, IndisMQ_generated_1["default"].MsgType.CMD, IndisMQ_generated_1["default"].Sts.REQ, IndisMQ_generated_1["default"].Err.NONE, "", IndisMQ_generated_1["default"].Cmd.UNSUB, null, callback);
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.unSub = unSub;
    function brokerReplay(m, handler, callback) {
        if (m.fields.MsgType() == IndisMQ_generated_1["default"].MsgType.MULT) {
            var r = makeImq(m.fields.MsgId(), name, null, false, m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1["default"].Sts.REQ, IndisMQ_generated_1["default"].Err.NONE, m.fields.StsMsg(), m.fields.Cmd(), m.fields.BodyArray(), callback);
            sendMult(r, handler);
        }
        else {
            var r = makeImq(m.fields.MsgId(), name, null, false, m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1["default"].Sts.REQ, IndisMQ_generated_1["default"].Err.NONE, m.fields.StsMsg(), m.fields.Cmd(), m.fields.BodyArray(), callback);
            sendQueue(r, handler);
        }
    }
    function mult(broker, path, msg, handler, callback) {
        var uid = newUID();
        var m = makeImq(uid, name, "", broker, path, IndisMQ_generated_1["default"].MsgType.MULT, IndisMQ_generated_1["default"].Sts.REQ, IndisMQ_generated_1["default"].Err.NONE, "", IndisMQ_generated_1["default"].Cmd.NONE, msg, callback);
        if (!broker) {
            sendMult(m, handler);
            return null;
        }
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.mult = mult;
    function sendMult(m, handler) {
        for (var key in subscribers[m.fields.Path()]) {
            handler(key, m);
        }
    }
    function queue(broker, path, msg, handler, callback) {
        var uid = newUID();
        var m = makeImq(uid, name, "", broker, path, IndisMQ_generated_1["default"].MsgType.QUEUE, IndisMQ_generated_1["default"].Sts.REQ, IndisMQ_generated_1["default"].Err.NONE, "", IndisMQ_generated_1["default"].Cmd.NONE, msg, callback);
        if (!broker) {
            sendQueue(m, handler);
            return null;
        }
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.queue = queue;
    function sendQueue(m, handler) {
        var success = false;
        var takeNext = false;
        var path = m.fields.Path().toString();
        if (path in subscribers) {
            if (Object.keys(subscribers[path]).length < 1) {
                for (var key in subscribers[path]) {
                    if (takeNext) {
                        handler(key, m);
                        subscribers[path][key] = true;
                        success = true;
                    }
                    if (subscribers[path][key]) {
                        takeNext = true;
                        subscribers[path][key] = false;
                    }
                }
                if (!success) {
                    for (var key in subscribers[path]) {
                        handler(key, m);
                        subscribers[path][key] = true;
                        return;
                    }
                }
            }
        }
    }
    function makeImq(id, from, to, broker, path, msgType, sts, err, stsMsg, cmd, body, callback) {
        var m = new Msg();
        var builder = new flatbuffers_1["default"].Builder(1);
        var idOffset = builder.createString(id);
        var bodyOffset = IndisMQ_generated_1["default"].Imq.createBodyVector(builder, body);
        var stsMsgOffset = builder.createString(stsMsg);
        var pathOffset = builder.createString(path);
        var fromOffset = builder.createString(from);
        var toOffset = builder.createString(to);
        IndisMQ_generated_1["default"].Imq.startImq(builder);
        IndisMQ_generated_1["default"].Imq.addFrom(builder, fromOffset);
        IndisMQ_generated_1["default"].Imq.addTo(builder, toOffset);
        IndisMQ_generated_1["default"].Imq.addMsgId(builder, idOffset);
        IndisMQ_generated_1["default"].Imq.addBroker(builder, broker);
        if (callback) {
            IndisMQ_generated_1["default"].Imq.addCallback(builder, true);
            m.callback = callback;
        }
        IndisMQ_generated_1["default"].Imq.addPath(builder, pathOffset);
        IndisMQ_generated_1["default"].Imq.addSts(builder, sts);
        IndisMQ_generated_1["default"].Imq.addBody(builder, bodyOffset);
        IndisMQ_generated_1["default"].Imq.addStsMsg(builder, stsMsgOffset);
        IndisMQ_generated_1["default"].Imq.addErr(builder, err);
        IndisMQ_generated_1["default"].Imq.addMsgType(builder, msgType);
        IndisMQ_generated_1["default"].Imq.addCmd(builder, cmd);
        var imq = IndisMQ_generated_1["default"].Imq.endImq(builder);
        builder.finish(imq);
        m.data = builder.dataBuffer();
        m.fields = IndisMQ_generated_1["default"].Imq.getRootAsImq(m.data);
        return m;
    }
    function recieveRawData(data) {
        var reply;
        var m = parseMsg(data);
        if (!m) {
            return null;
        }
        if (m.fields.Broker() == true) {
            if (brokerHandler) {
                reply = brokerHandler(m);
            }
            else {
                reply = err(m, "not a broker", IndisMQ_generated_1["default"].Err.NO_HANDLER);
            }
        }
        else if (m.fields.To().length > 0 && m.fields.To() != name) {
            if (relayHandler) {
                reply = relayHandler(m);
            }
            else {
                reply = err(m, "not a relay", IndisMQ_generated_1["default"].Err.NO_HANDLER);
            }
        }
        else if (m.fields.MsgType() == IndisMQ_generated_1["default"].MsgType.CMD) {
            reply = handleCmd(m);
        }
        else if (m.fields.Sts() == IndisMQ_generated_1["default"].Sts.REQ) {
            if (m.fields.Path() in handlers) {
                reply = handlers[m.fields.Path()](m);
            }
        }
        else {
            if (m.fields.MsgId() in messages) {
                var imq = messages[m.fields.MsgId()];
                if (imq.callback) {
                    imq.callback(m);
                }
                delMessage(m.fields.MsgId());
            }
        }
        return reply;
    }
    imq_1.recieveRawData = recieveRawData;
    function handleCmd(m) {
        var r;
        if (m.fields.Sts() == IndisMQ_generated_1["default"].Sts.REQ) {
            switch (imq.fields.Cmd()) {
                case IndisMQ_generated_1["default"].Cmd.SUB:
                    addSubscriber(m.fields.From(), imq.fields.Path());
                    r = success(m, "");
                    break;
                case IndisMQ_generated_1["default"].Cmd.SYN:
                    r = success(m, "");
                    break;
                case IndisMQ_generated_1["default"].Cmd.UNSUB:
                    delSubscriber(m.fields.From(), imq.fields.Path());
                    r = success(m, "");
                    break;
                default:
                    r = err(m, "unsupported CMD", IndisMQ_generated_1["default"].Err.INVALID);
                    break;
            }
        }
        else {
            if (m.fields.MsgId() in messages) {
                var imq = messages[m.fields.MsgId()];
                if (imq.callback) {
                    imq.callback(m);
                }
                delMessage(m.fields.MsgId());
            }
        }
        return r;
    }
    function newUID() {
        var text = " ";
        var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 16; i++)
            text += charset.charAt(Math.floor(Math.random() * charset.length));
        return text;
    }
})(imq = exports.imq || (exports.imq = {}));

},{"../schema/IndisMQ_generated":3,"../schema/flatbuffers":4}],2:[function(require,module,exports){
"use strict";
var indisMQ_1 = require("./indisMQ");
var flatbuffers_1 = require("../schema/flatbuffers");
var builder = new flatbuffers_1["default"].Builder(1);
var t = indisMQ_1["default"].req("", "", null, null);
console.log("still made it");

},{"../schema/flatbuffers":4,"./indisMQ":1}],3:[function(require,module,exports){
// automatically generated by the FlatBuffers compiler, do not modify
"use strict";
exports.__esModule = true;
exports["default"] = IndisMQ;
/**
 * @enum
 */
var IndisMQ;
(function (IndisMQ) {
    (function (MsgType) {
        MsgType[MsgType["NONE"] = 0] = "NONE";
        MsgType[MsgType["PEER"] = 1] = "PEER";
        MsgType[MsgType["MULT"] = 2] = "MULT";
        MsgType[MsgType["QUEUE"] = 3] = "QUEUE";
        MsgType[MsgType["CMD"] = 4] = "CMD";
    })(IndisMQ.MsgType || (IndisMQ.MsgType = {}));
    var MsgType = IndisMQ.MsgType;
})(IndisMQ = exports.IndisMQ || (exports.IndisMQ = {}));
/**
 * @enum
 */
(function (IndisMQ) {
    (function (Cmd) {
        Cmd[Cmd["NONE"] = 0] = "NONE";
        Cmd[Cmd["SUB"] = 1] = "SUB";
        Cmd[Cmd["UNSUB"] = 2] = "UNSUB";
        Cmd[Cmd["SYN"] = 3] = "SYN";
    })(IndisMQ.Cmd || (IndisMQ.Cmd = {}));
    var Cmd = IndisMQ.Cmd;
})(IndisMQ = exports.IndisMQ || (exports.IndisMQ = {}));
/**
 * @enum
 */
(function (IndisMQ) {
    (function (Sts) {
        Sts[Sts["NONE"] = 0] = "NONE";
        Sts[Sts["ERROR"] = 1] = "ERROR";
        Sts[Sts["REQ"] = 2] = "REQ";
        Sts[Sts["REP"] = 3] = "REP";
        Sts[Sts["CANCEL"] = 4] = "CANCEL";
        Sts[Sts["SUCCESS"] = 5] = "SUCCESS";
    })(IndisMQ.Sts || (IndisMQ.Sts = {}));
    var Sts = IndisMQ.Sts;
})(IndisMQ = exports.IndisMQ || (exports.IndisMQ = {}));
/**
 * @enum
 */
(function (IndisMQ) {
    (function (Err) {
        Err[Err["NONE"] = 0] = "NONE";
        Err[Err["NO_HANDLER"] = 1] = "NO_HANDLER";
        Err[Err["INVALID"] = 2] = "INVALID";
        Err[Err["REMOTE"] = 3] = "REMOTE";
        Err[Err["TIMEOUT"] = 4] = "TIMEOUT";
    })(IndisMQ.Err || (IndisMQ.Err = {}));
    var Err = IndisMQ.Err;
})(IndisMQ = exports.IndisMQ || (exports.IndisMQ = {}));
/**
 * @constructor
 */
(function (IndisMQ) {
    var Ver = (function () {
        function Ver() {
            /**
             * @type {flatbuffers.ByteBuffer}
             */
            this.bb = null;
            /**
             * @type {number}
             */
            this.bb_pos = 0;
        }
        /**
         * @param {number} i
         * @param {flatbuffers.ByteBuffer} bb
         * @returns {Ver}
         */
        Ver.prototype.__init = function (i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
        };
        ;
        /**
         * @returns {number}
         */
        Ver.prototype.Major = function () {
            return this.bb.readInt8(this.bb_pos);
        };
        ;
        /**
         * @returns {number}
         */
        Ver.prototype.Minor = function () {
            return this.bb.readInt8(this.bb_pos + 1);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {number} Major
         * @param {number} Minor
         * @returns {flatbuffers.Offset}
         */
        Ver.createVer = function (builder, Major, Minor) {
            builder.prep(1, 2);
            builder.writeInt8(Minor);
            builder.writeInt8(Major);
            return builder.offset();
        };
        ;
        return Ver;
    }());
    IndisMQ.Ver = Ver;
})(IndisMQ = exports.IndisMQ || (exports.IndisMQ = {}));
/**
 * @constructor
 */
(function (IndisMQ) {
    var Imq = (function () {
        function Imq() {
            /**
             * @type {flatbuffers.ByteBuffer}
             */
            this.bb = null;
            /**
             * @type {number}
             */
            this.bb_pos = 0;
        }
        /**
         * @param {number} i
         * @param {flatbuffers.ByteBuffer} bb
         * @returns {Imq}
         */
        Imq.prototype.__init = function (i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
        };
        ;
        /**
         * @param {flatbuffers.ByteBuffer} bb
         * @param {Imq=} obj
         * @returns {Imq}
         */
        Imq.getRootAsImq = function (bb, obj) {
            return (obj || new Imq).__init(bb.readInt32(bb.position()) + bb.position(), bb);
        };
        ;
        /**
         * @param {flatbuffers.ByteBuffer} bb
         * @returns {boolean}
         */
        Imq.bufferHasIdentifier = function (bb) {
            return bb.__has_identifier('0001');
        };
        ;
        /**
         * @param {number} index
         * @returns {number}
         */
        Imq.prototype.Body = function (index) {
            var offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.readUint8(this.bb.__vector(this.bb_pos + offset) + index) : 0;
        };
        ;
        /**
         * @returns {number}
         */
        Imq.prototype.BodyLength = function () {
            var offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
        };
        ;
        /**
         * @returns {Uint8Array}
         */
        Imq.prototype.BodyArray = function () {
            var offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? new Uint8Array(this.bb.bytes().buffer, this.bb.__vector(this.bb_pos + offset), this.bb.__vector_len(this.bb_pos + offset)) : null;
        };
        ;
        Imq.prototype.From = function (optionalEncoding) {
            var offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
        };
        ;
        Imq.prototype.To = function (optionalEncoding) {
            var offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
        };
        ;
        /**
         * @returns {boolean}
         */
        Imq.prototype.Broker = function () {
            var offset = this.bb.__offset(this.bb_pos, 10);
            return offset ? !!this.bb.readInt8(this.bb_pos + offset) : false;
        };
        ;
        /**
         * @returns {IndisMQ.Cmd}
         */
        Imq.prototype.Cmd = function () {
            var offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.Cmd.NONE;
        };
        ;
        Imq.prototype.MsgId = function (optionalEncoding) {
            var offset = this.bb.__offset(this.bb_pos, 14);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
        };
        ;
        /**
         * @returns {IndisMQ.MsgType}
         */
        Imq.prototype.MsgType = function () {
            var offset = this.bb.__offset(this.bb_pos, 16);
            return offset ? (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.MsgType.NONE;
        };
        ;
        /**
         * @returns {IndisMQ.Sts}
         */
        Imq.prototype.Sts = function () {
            var offset = this.bb.__offset(this.bb_pos, 18);
            return offset ? (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.Sts.NONE;
        };
        ;
        Imq.prototype.Path = function (optionalEncoding) {
            var offset = this.bb.__offset(this.bb_pos, 20);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
        };
        ;
        /**
         * @returns {IndisMQ.Err}
         */
        Imq.prototype.Err = function () {
            var offset = this.bb.__offset(this.bb_pos, 22);
            return offset ? (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.Err.NONE;
        };
        ;
        Imq.prototype.StsMsg = function (optionalEncoding) {
            var offset = this.bb.__offset(this.bb_pos, 24);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
        };
        ;
        /**
         * @returns {boolean}
         */
        Imq.prototype.Callback = function () {
            var offset = this.bb.__offset(this.bb_pos, 26);
            return offset ? !!this.bb.readInt8(this.bb_pos + offset) : false;
        };
        ;
        /**
         * @param {IndisMQ.Ver=} obj
         * @returns {IndisMQ.Ver}
         */
        Imq.prototype.Ver = function (obj) {
            var offset = this.bb.__offset(this.bb_pos, 28);
            return offset ? (obj || new IndisMQ.Ver).__init(this.bb_pos + offset, this.bb) : null;
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         */
        Imq.startImq = function (builder) {
            builder.startObject(13);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} BodyOffset
         */
        Imq.addBody = function (builder, BodyOffset) {
            builder.addFieldOffset(0, BodyOffset, 0);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {Array.<number>} data
         * @returns {flatbuffers.Offset}
         */
        Imq.createBodyVector = function (builder, data) {
            builder.startVector(1, data.length, 1);
            for (var i = data.length - 1; i >= 0; i--) {
                builder.addInt8(data[i]);
            }
            return builder.endVector();
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {number} numElems
         */
        Imq.startBodyVector = function (builder, numElems) {
            builder.startVector(1, numElems, 1);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} FromOffset
         */
        Imq.addFrom = function (builder, FromOffset) {
            builder.addFieldOffset(1, FromOffset, 0);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} ToOffset
         */
        Imq.addTo = function (builder, ToOffset) {
            builder.addFieldOffset(2, ToOffset, 0);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {boolean} Broker
         */
        Imq.addBroker = function (builder, Broker) {
            builder.addFieldInt8(3, +Broker, +false);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {IndisMQ.Cmd} Cmd
         */
        Imq.addCmd = function (builder, Cmd) {
            builder.addFieldInt8(4, Cmd, IndisMQ.Cmd.NONE);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} MsgIdOffset
         */
        Imq.addMsgId = function (builder, MsgIdOffset) {
            builder.addFieldOffset(5, MsgIdOffset, 0);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {IndisMQ.MsgType} MsgType
         */
        Imq.addMsgType = function (builder, MsgType) {
            builder.addFieldInt8(6, MsgType, IndisMQ.MsgType.NONE);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {IndisMQ.Sts} Sts
         */
        Imq.addSts = function (builder, Sts) {
            builder.addFieldInt8(7, Sts, IndisMQ.Sts.NONE);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} PathOffset
         */
        Imq.addPath = function (builder, PathOffset) {
            builder.addFieldOffset(8, PathOffset, 0);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {IndisMQ.Err} Err
         */
        Imq.addErr = function (builder, Err) {
            builder.addFieldInt8(9, Err, IndisMQ.Err.NONE);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} StsMsgOffset
         */
        Imq.addStsMsg = function (builder, StsMsgOffset) {
            builder.addFieldOffset(10, StsMsgOffset, 0);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {boolean} Callback
         */
        Imq.addCallback = function (builder, Callback) {
            builder.addFieldInt8(11, +Callback, +false);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} VerOffset
         */
        Imq.addVer = function (builder, VerOffset) {
            builder.addFieldStruct(12, VerOffset, 0);
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @returns {flatbuffers.Offset}
         */
        Imq.endImq = function (builder) {
            var offset = builder.endObject();
            return offset;
        };
        ;
        /**
         * @param {flatbuffers.Builder} builder
         * @param {flatbuffers.Offset} offset
         */
        Imq.finishImqBuffer = function (builder, offset) {
            builder.finish(offset, '0001');
        };
        ;
        return Imq;
    }());
    IndisMQ.Imq = Imq;
})(IndisMQ = exports.IndisMQ || (exports.IndisMQ = {}));

},{}],4:[function(require,module,exports){
/// @file
/// @addtogroup flatbuffers_javascript_api
/// @{
/// @cond FLATBUFFERS_INTERNAL
/**
 * @const
 * @namespace
 */
//var flatbuffers = {};
"use strict";
exports.__esModule = true;
////////////////////////////////////////////////////////////////////////////////
/**
 * @constructor
 * @param {number} high
 * @param {number} low
 */
exports["default"] = flatbuffers;
var flatbuffers;
(function (flatbuffers) {
    /**
   * @type {number}
   * @const
   */
    var SIZEOF_SHORT = 2;
    /**
     * @type {number}
     * @const
     */
    var SIZEOF_INT = 4;
    /**
     * @type {number}
     * @const
     */
    var FILE_IDENTIFIER_LENGTH = 4;
    /**
     * @enum {number}
     */
    (function (Encoding) {
        Encoding[Encoding["UTF8_BYTES"] = 1] = "UTF8_BYTES";
        Encoding[Encoding["UTF16_STRING"] = 2] = "UTF16_STRING";
    })(flatbuffers.Encoding || (flatbuffers.Encoding = {}));
    var Encoding = flatbuffers.Encoding;
    ;
    /**
     * @type {Int32Array}
     * @const
     */
    var int32 = new Int32Array(2);
    /**
     * @type {Float32Array}
     * @const
     */
    var float32 = new Float32Array(int32.buffer);
    /**
     * @type {Float64Array}
     * @const
     */
    var float64 = new Float64Array(int32.buffer);
    /**
     * @type {boolean}
     * @const
     */
    var isLittleEndian = new Uint16Array(new Uint8Array([1, 0]).buffer)[0] === 1;
    /**
   * @typedef {{
   *   bb: flatbuffers.ByteBuffer,
   *   bb_pos: number
   * }}
   */
    var Table = (function () {
        function Table() {
        }
        return Table;
    }());
    flatbuffers.Table = Table;
    ;
    var Long = (function () {
        function Long(low, high) {
            /**
             * @type {number}
             * @const
             */
            this.low = low | 0;
            /**
             * @type {number}
             * @const
             */
            this.high = high | 0;
        }
        ;
        /**
         * @param {number} high
         * @param {number} low
         * @returns {flatbuffers.Long}
         */
        Long.create = function (low, high) {
            // Special-case zero to avoid GC overhead for default values
            return low == 0 && high == 0 ? Long.ZERO : new flatbuffers.Long(low, high);
        };
        ;
        /**
         * @returns {number}
         */
        Long.prototype.toFloat64 = function () {
            return this.low + this.high * 0x100000000;
        };
        ;
        /**
         * @param {flatbuffers.Long} other
         * @returns {boolean}
         */
        Long.prototype.equals = function (other) {
            return this.low == other.low && this.high == other.high;
        };
        ;
        return Long;
    }());
    flatbuffers.Long = Long;
    (function (Long) {
        Long.ZERO = new flatbuffers.Long(0, 0);
    })(Long = flatbuffers.Long || (flatbuffers.Long = {}));
    /// @endcond
    ////////////////////////////////////////////////////////////////////////////////
    /**
     * Create a FlatBufferBuilder.
     *
     * @constructor
     * @param {number=} initial_size
     */
    var Builder = (function () {
        function Builder(initial_size) {
            if (!initial_size) {
                initial_size = 1024;
            }
            /**
             * @type {flatbuffers.ByteBuffer}
             * @private
             */
            this.bb = ByteBuffer.allocate(initial_size);
            /**
             * Remaining space in the ByteBuffer.
             *
             * @type {number}
             * @private
             */
            this.space = initial_size;
            /**
             * Minimum alignment encountered so far.
             *
             * @type {number}
             * @private
             */
            this.minalign = 1;
            /**
             * The vtable for the current table.
             *
             * @type {Array.<number>}
             * @private
             */
            this.vtable = null;
            /**
             * The amount of fields we're actually using.
             *
             * @type {number}
             * @private
             */
            this.vtable_in_use = 0;
            /**
             * Whether we are currently serializing a table.
             *
             * @type {boolean}
             * @private
             */
            this.isNested = false;
            /**
             * Starting offset of the current struct/table.
             *
             * @type {number}
             * @private
             */
            this.object_start = 0;
            /**
             * List of offsets of all vtables.
             *
             * @type {Array.<number>}
             * @private
             */
            this.vtables = [];
            /**
             * For the current vector being built.
             *
             * @type {number}
             * @private
             */
            this.vector_num_elems = 0;
            /**
             * False omits default values from the serialized data
             *
             * @type {boolean}
             * @private
             */
            this.force_defaults = false;
        }
        ;
        /**
         * In order to save space, fields that are set to their default value
         * don't get serialized into the buffer. Forcing defaults provides a
         * way to manually disable this optimization.
         *
         * @param {boolean} forceDefaults true always serializes default values
         */
        Builder.prototype.forceDefaults = function (forceDefaults) {
            this.force_defaults = forceDefaults;
        };
        ;
        /**
         * Get the ByteBuffer representing the FlatBuffer. Only call this after you've
         * called finish(). The actual data starts at the ByteBuffer's current position,
         * not necessarily at 0.
         *
         * @returns {flatbuffers.ByteBuffer}
         */
        Builder.prototype.dataBuffer = function () {
            return this.bb;
        };
        ;
        /**
         * Get the bytes representing the FlatBuffer. Only call this after you've
         * called finish().
         *
         * @returns {Uint8Array}
         */
        Builder.prototype.asUint8Array = function () {
            return this.bb.bytes().subarray(this.bb.position(), this.bb.position() + this.offset());
        };
        ;
        /// @cond FLATBUFFERS_INTERNAL
        /**
         * Prepare to write an element of `size` after `additional_bytes` have been
         * written, e.g. if you write a string, you need to align such the int length
         * field is aligned to 4 bytes, and the string data follows it directly. If all
         * you need to do is alignment, `additional_bytes` will be 0.
         *
         * @param {number} size This is the of the new element to write
         * @param {number} additional_bytes The padding size
         */
        Builder.prototype.prep = function (size, additional_bytes) {
            // Track the biggest thing we've ever aligned to.
            if (size > this.minalign) {
                this.minalign = size;
            }
            // Find the amount of alignment needed such that `size` is properly
            // aligned after `additional_bytes`
            var align_size = ((~(this.bb.capacity() - this.space + additional_bytes)) + 1) & (size - 1);
            // Reallocate the buffer if needed.
            while (this.space < align_size + size + additional_bytes) {
                var old_buf_size = this.bb.capacity();
                this.bb = this.growByteBuffer(this.bb);
                this.space += this.bb.capacity() - old_buf_size;
            }
            this.pad(align_size);
        };
        ;
        /**
         * @param {number} byte_size
         */
        Builder.prototype.pad = function (byte_size) {
            for (var i = 0; i < byte_size; i++) {
                this.bb.writeInt8(--this.space, 0);
            }
        };
        ;
        /**
         * @param {number} value
         */
        Builder.prototype.writeInt8 = function (value) {
            this.bb.writeInt8(this.space -= 1, value);
        };
        ;
        /**
         * @param {number} value
         */
        Builder.prototype.writeInt16 = function (value) {
            this.bb.writeInt16(this.space -= 2, value);
        };
        ;
        /**
         * @param {number} value
         */
        Builder.prototype.writeInt32 = function (value) {
            this.bb.writeInt32(this.space -= 4, value);
        };
        ;
        /**
         * @param {flatbuffers.Long} value
         */
        Builder.prototype.writeInt64 = function (value) {
            this.bb.writeInt64(this.space -= 8, value);
        };
        ;
        /**
         * @param {number} value
         */
        Builder.prototype.writeFloat32 = function (value) {
            this.bb.writeFloat32(this.space -= 4, value);
        };
        ;
        /**
         * @param {number} value
         */
        Builder.prototype.writeFloat64 = function (value) {
            this.bb.writeFloat64(this.space -= 8, value);
        };
        ;
        /// @endcond
        /**
         * Add an `int8` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `int8` to add the the buffer.
         */
        Builder.prototype.addInt8 = function (value) {
            this.prep(1, 0);
            this.writeInt8(value);
        };
        ;
        /**
         * Add an `int16` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `int16` to add the the buffer.
         */
        Builder.prototype.addInt16 = function (value) {
            this.prep(2, 0);
            this.writeInt16(value);
        };
        ;
        /**
         * Add an `int32` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `int32` to add the the buffer.
         */
        Builder.prototype.addInt32 = function (value) {
            this.prep(4, 0);
            this.writeInt32(value);
        };
        ;
        /**
         * Add an `int64` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {flatbuffers.Long} value The `int64` to add the the buffer.
         */
        Builder.prototype.addInt64 = function (value) {
            this.prep(8, 0);
            this.writeInt64(value);
        };
        ;
        /**
         * Add a `float32` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `float32` to add the the buffer.
         */
        Builder.prototype.addFloat32 = function (value) {
            this.prep(4, 0);
            this.writeFloat32(value);
        };
        ;
        /**
         * Add a `float64` to the buffer, properly aligned, and grows the buffer (if necessary).
         * @param {number} value The `float64` to add the the buffer.
         */
        Builder.prototype.addFloat64 = function (value) {
            this.prep(8, 0);
            this.writeFloat64(value);
        };
        ;
        /// @cond FLATBUFFERS_INTERNAL
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        Builder.prototype.addFieldInt8 = function (voffset, value, defaultValue) {
            if (this.force_defaults || value != defaultValue) {
                this.addInt8(value);
                this.slot(voffset);
            }
        };
        ;
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        Builder.prototype.addFieldInt16 = function (voffset, value, defaultValue) {
            if (this.force_defaults || value != defaultValue) {
                this.addInt16(value);
                this.slot(voffset);
            }
        };
        ;
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        Builder.prototype.addFieldInt32 = function (voffset, value, defaultValue) {
            if (this.force_defaults || value != defaultValue) {
                this.addInt32(value);
                this.slot(voffset);
            }
        };
        ;
        /**
         * @param {number} voffset
         * @param {flatbuffers.Long} value
         * @param {flatbuffers.Long} defaultValue
         */
        Builder.prototype.addFieldInt64 = function (voffset, value, defaultValue) {
            if (this.force_defaults || !value.equals(defaultValue)) {
                this.addInt64(value);
                this.slot(voffset);
            }
        };
        ;
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        Builder.prototype.addFieldFloat32 = function (voffset, value, defaultValue) {
            if (this.force_defaults || value != defaultValue) {
                this.addFloat32(value);
                this.slot(voffset);
            }
        };
        ;
        /**
         * @param {number} voffset
         * @param {number} value
         * @param {number} defaultValue
         */
        Builder.prototype.addFieldFloat64 = function (voffset, value, defaultValue) {
            if (this.force_defaults || value != defaultValue) {
                this.addFloat64(value);
                this.slot(voffset);
            }
        };
        ;
        /**
         * @param {number} voffset
         * @param {flatbuffers.Offset} value
         * @param {flatbuffers.Offset} defaultValue
         */
        Builder.prototype.addFieldOffset = function (voffset, value, defaultValue) {
            if (this.force_defaults || value != defaultValue) {
                this.addOffset(value);
                this.slot(voffset);
            }
        };
        ;
        /**
         * Structs are stored inline, so nothing additional is being added. `d` is always 0.
         *
         * @param {number} voffset
         * @param {flatbuffers.Offset} value
         * @param {flatbuffers.Offset} defaultValue
         */
        Builder.prototype.addFieldStruct = function (voffset, value, defaultValue) {
            if (value != defaultValue) {
                this.nested(value);
                this.slot(voffset);
            }
        };
        ;
        /**
         * Structures are always stored inline, they need to be created right
         * where they're used.  You'll get this assertion failure if you
         * created it elsewhere.
         *
         * @param {flatbuffers.Offset} obj The offset of the created object
         */
        Builder.prototype.nested = function (obj) {
            if (obj != this.offset()) {
                throw new Error('FlatBuffers: struct must be serialized inline.');
            }
        };
        ;
        /**
         * Should not be creating any other object, string or vector
         * while an object is being constructed
         */
        Builder.prototype.notNested = function () {
            if (this.isNested) {
                throw new Error('FlatBuffers: object serialization must not be nested.');
            }
        };
        ;
        /**
         * Set the current vtable at `voffset` to the current location in the buffer.
         *
         * @param {number} voffset
         */
        Builder.prototype.slot = function (voffset) {
            this.vtable[voffset] = this.offset();
        };
        ;
        /**
         * @returns {flatbuffers.Offset} Offset relative to the end of the buffer.
         */
        Builder.prototype.offset = function () {
            return this.bb.capacity() - this.space;
        };
        ;
        /**
         * Doubles the size of the backing ByteBuffer and copies the old data towards
         * the end of the new buffer (since we build the buffer backwards).
         *
         * @param {flatbuffers.ByteBuffer} bb The current buffer with the existing data
         * @returns {flatbuffers.ByteBuffer} A new byte buffer with the old data copied
         * to it. The data is located at the end of the buffer.
         */
        Builder.prototype.growByteBuffer = function (bb) {
            var old_buf_size = bb.capacity();
            // Ensure we don't grow beyond what fits in an int.
            if (old_buf_size & 0xC0000000) {
                throw new Error('FlatBuffers: cannot grow buffer beyond 2 gigabytes.');
            }
            var new_buf_size = old_buf_size << 1;
            var nbb = ByteBuffer.allocate(new_buf_size);
            nbb.setPosition(new_buf_size - old_buf_size);
            nbb.bytes().set(bb.bytes(), new_buf_size - old_buf_size);
            return nbb;
        };
        ;
        /// @endcond
        /**
         * Adds on offset, relative to where it will be written.
         *
         * @param {flatbuffers.Offset} offset The offset to add.
         */
        Builder.prototype.addOffset = function (offset) {
            this.prep(SIZEOF_INT, 0); // Ensure alignment is already done.
            this.writeInt32(this.offset() - offset + SIZEOF_INT);
        };
        ;
        /// @cond FLATBUFFERS_INTERNAL
        /**
         * Start encoding a new object in the buffer.  Users will not usually need to
         * call this directly. The FlatBuffers compiler will generate helper methods
         * that call this method internally.
         *
         * @param {number} numfields
         */
        Builder.prototype.startObject = function (numfields) {
            this.notNested();
            if (this.vtable == null) {
                this.vtable = [];
            }
            this.vtable_in_use = numfields;
            for (var i = 0; i < numfields; i++) {
                this.vtable[i] = 0; // This will push additional elements as needed
            }
            this.isNested = true;
            this.object_start = this.offset();
        };
        ;
        /**
         * Finish off writing the object that is under construction.
         *
         * @returns {flatbuffers.Offset} The offset to the object inside `dataBuffer`
         */
        Builder.prototype.endObject = function () {
            if (this.vtable == null || !this.isNested) {
                throw new Error('FlatBuffers: endObject called without startObject');
            }
            this.addInt32(0);
            var vtableloc = this.offset();
            // Write out the current vtable.
            for (var i = this.vtable_in_use - 1; i >= 0; i--) {
                // Offset relative to the start of the table.
                this.addInt16(this.vtable[i] != 0 ? vtableloc - this.vtable[i] : 0);
            }
            var standard_fields = 2; // The fields below:
            this.addInt16(vtableloc - this.object_start);
            this.addInt16((this.vtable_in_use + standard_fields) * SIZEOF_SHORT);
            // Search for an existing vtable that matches the current one.
            var existing_vtable = 0;
            outer_loop: for (var i = 0; i < this.vtables.length; i++) {
                var vt1 = this.bb.capacity() - this.vtables[i];
                var vt2 = this.space;
                var len = this.bb.readInt16(vt1);
                if (len == this.bb.readInt16(vt2)) {
                    for (var j = SIZEOF_SHORT; j < len; j += SIZEOF_SHORT) {
                        if (this.bb.readInt16(vt1 + j) != this.bb.readInt16(vt2 + j)) {
                            continue outer_loop;
                        }
                    }
                    existing_vtable = this.vtables[i];
                    break;
                }
            }
            if (existing_vtable) {
                // Found a match:
                // Remove the current vtable.
                this.space = this.bb.capacity() - vtableloc;
                // Point table to existing vtable.
                this.bb.writeInt32(this.space, existing_vtable - vtableloc);
            }
            else {
                // No match:
                // Add the location of the current vtable to the list of vtables.
                this.vtables.push(this.offset());
                // Point table to current vtable.
                this.bb.writeInt32(this.bb.capacity() - vtableloc, this.offset() - vtableloc);
            }
            this.isNested = false;
            return vtableloc;
        };
        ;
        /// @endcond
        /**
         * Finalize a buffer, poiting to the given `root_table`.
         *
         * @param {flatbuffers.Offset} root_table
         * @param {string=} file_identifier
         */
        Builder.prototype.finish = function (root_table, file_identifier) {
            if (file_identifier) {
                this.prep(this.minalign, SIZEOF_INT +
                    FILE_IDENTIFIER_LENGTH);
                if (file_identifier.length != FILE_IDENTIFIER_LENGTH) {
                    throw new Error('FlatBuffers: file identifier must be length ' +
                        FILE_IDENTIFIER_LENGTH);
                }
                for (var i = FILE_IDENTIFIER_LENGTH - 1; i >= 0; i--) {
                    this.writeInt8(file_identifier.charCodeAt(i));
                }
            }
            this.prep(this.minalign, SIZEOF_INT);
            this.addOffset(root_table);
            this.bb.setPosition(this.space);
        };
        ;
        /// @cond FLATBUFFERS_INTERNAL
        /**
         * This checks a required field has been set in a given table that has
         * just been constructed.
         *
         * @param {flatbuffers.Offset} table
         * @param {number} field
         */
        Builder.prototype.requiredField = function (table, field) {
            var table_start = this.bb.capacity() - table;
            var vtable_start = table_start - this.bb.readInt32(table_start);
            var ok = this.bb.readInt16(vtable_start + field) != 0;
            // If this fails, the caller will show what field needs to be set.
            if (!ok) {
                throw new Error('FlatBuffers: field ' + field + ' must be set');
            }
        };
        ;
        /**
         * Start a new array/vector of objects.  Users usually will not call
         * this directly. The FlatBuffers compiler will create a start/end
         * method for vector types in generated code.
         *
         * @param {number} elem_size The size of each element in the array
         * @param {number} num_elems The number of elements in the array
         * @param {number} alignment The alignment of the array
         */
        Builder.prototype.startVector = function (elem_size, num_elems, alignment) {
            this.notNested();
            this.vector_num_elems = num_elems;
            this.prep(SIZEOF_INT, elem_size * num_elems);
            this.prep(alignment, elem_size * num_elems); // Just in case alignment > int.
        };
        ;
        /**
         * Finish off the creation of an array and all its elements. The array must be
         * created with `startVector`.
         *
         * @returns {flatbuffers.Offset} The offset at which the newly created array
         * starts.
         */
        Builder.prototype.endVector = function () {
            this.writeInt32(this.vector_num_elems);
            return this.offset();
        };
        ;
        /// @endcond
        /**
         * Encode the string `s` in the buffer using UTF-8. If a Uint8Array is passed
         * instead of a string, it is assumed to contain valid UTF-8 encoded data.
         *
         * @param {string|Uint8Array} s The string to encode
         * @return {flatbuffers.Offset} The offset in the buffer where the encoded string starts
         */
        Builder.prototype.createString = function (s) {
            var utf8;
            if (s instanceof Uint8Array) {
                utf8 = s;
            }
            else {
                utf8 = [];
                var i = 0;
                while (i < s.length) {
                    var codePoint;
                    // Decode UTF-16
                    var a = s.charCodeAt(i++);
                    if (a < 0xD800 || a >= 0xDC00) {
                        codePoint = a;
                    }
                    else {
                        var b = s.charCodeAt(i++);
                        codePoint = (a << 10) + b + (0x10000 - (0xD800 << 10) - 0xDC00);
                    }
                    // Encode UTF-8
                    if (codePoint < 0x80) {
                        utf8.push(codePoint);
                    }
                    else {
                        if (codePoint < 0x800) {
                            utf8.push(((codePoint >> 6) & 0x1F) | 0xC0);
                        }
                        else {
                            if (codePoint < 0x10000) {
                                utf8.push(((codePoint >> 12) & 0x0F) | 0xE0);
                            }
                            else {
                                utf8.push(((codePoint >> 18) & 0x07) | 0xF0, ((codePoint >> 12) & 0x3F) | 0x80);
                            }
                            utf8.push(((codePoint >> 6) & 0x3F) | 0x80);
                        }
                        utf8.push((codePoint & 0x3F) | 0x80);
                    }
                }
            }
            this.addInt8(0);
            this.startVector(1, utf8.length, 1);
            this.bb.setPosition(this.space -= utf8.length);
            for (var i = 0, offset = this.space, bytes = this.bb.bytes(); i < utf8.length; i++) {
                bytes[offset++] = utf8[i];
            }
            return this.endVector();
        };
        ;
        /**
         * A helper function to avoid generated code depending on this file directly.
         *
         * @param {number} low
         * @param {number} high
         * @returns {flatbuffers.Long}
         */
        Builder.prototype.createLong = function (low, high) {
            return flatbuffers.Long.create(low, high);
        };
        ;
        return Builder;
    }());
    flatbuffers.Builder = Builder;
    ////////////////////////////////////////////////////////////////////////////////
    /// @cond FLATBUFFERS_INTERNAL
    /**
     * Create a new ByteBuffer with a given array of bytes (`Uint8Array`).
     *
     * @constructor
     * @param {Uint8Array} bytes
     */
    var ByteBuffer = (function () {
        function ByteBuffer(bytes) {
            /**
             * @type {Uint8Array}
             * @private
             */
            this.bytes_ = bytes;
            /**
             * @type {number}
             * @private
             */
            this.position_ = 0;
        }
        ;
        /**
         * Create and allocate a new ByteBuffer with a given size.
         *
         * @param {number} byte_size
         * @returns {flatbuffers.ByteBuffer}
         */
        ByteBuffer.allocate = function (byte_size) {
            return new flatbuffers.ByteBuffer(new Uint8Array(byte_size));
        };
        ;
        /**
         * Get the underlying `Uint8Array`.
         *
         * @returns {Uint8Array}
         */
        ByteBuffer.prototype.bytes = function () {
            return this.bytes_;
        };
        ;
        /**
         * Get the buffer's position.
         *
         * @returns {number}
         */
        ByteBuffer.prototype.position = function () {
            return this.position_;
        };
        ;
        /**
         * Set the buffer's position.
         *
         * @param {number} position
         */
        ByteBuffer.prototype.setPosition = function (position) {
            this.position_ = position;
        };
        ;
        /**
         * Get the buffer's capacity.
         *
         * @returns {number}
         */
        ByteBuffer.prototype.capacity = function () {
            return this.bytes_.length;
        };
        ;
        /**
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.readInt8 = function (offset) {
            return this.readUint8(offset) << 24 >> 24;
        };
        ;
        /**
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.readUint8 = function (offset) {
            return this.bytes_[offset];
        };
        ;
        /**
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.readInt16 = function (offset) {
            return this.readUint16(offset) << 16 >> 16;
        };
        ;
        /**
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.readUint16 = function (offset) {
            return this.bytes_[offset] | this.bytes_[offset + 1] << 8;
        };
        ;
        /**
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.readInt32 = function (offset) {
            return this.bytes_[offset] | this.bytes_[offset + 1] << 8 | this.bytes_[offset + 2] << 16 | this.bytes_[offset + 3] << 24;
        };
        ;
        /**
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.readUint32 = function (offset) {
            return this.readInt32(offset) >>> 0;
        };
        ;
        /**
         * @param {number} offset
         * @returns {flatbuffers.Long}
         */
        ByteBuffer.prototype.readInt64 = function (offset) {
            return new flatbuffers.Long(this.readInt32(offset), this.readInt32(offset + 4));
        };
        ;
        /**
         * @param {number} offset
         * @returns {flatbuffers.Long}
         */
        ByteBuffer.prototype.readUint64 = function (offset) {
            return new flatbuffers.Long(this.readUint32(offset), this.readUint32(offset + 4));
        };
        ;
        /**
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.readFloat32 = function (offset) {
            int32[0] = this.readInt32(offset);
            return float32[0];
        };
        ;
        /**
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.readFloat64 = function (offset) {
            int32[isLittleEndian ? 0 : 1] = this.readInt32(offset);
            int32[isLittleEndian ? 1 : 0] = this.readInt32(offset + 4);
            return float64[0];
        };
        ;
        /**
         * @param {number} offset
         * @param {number} value
         */
        ByteBuffer.prototype.writeInt8 = function (offset, value) {
            this.bytes_[offset] = value;
        };
        ;
        /**
         * @param {number} offset
         * @param {number} value
         */
        ByteBuffer.prototype.writeInt16 = function (offset, value) {
            this.bytes_[offset] = value;
            this.bytes_[offset + 1] = value >> 8;
        };
        ;
        /**
         * @param {number} offset
         * @param {number} value
         */
        ByteBuffer.prototype.writeInt32 = function (offset, value) {
            this.bytes_[offset] = value;
            this.bytes_[offset + 1] = value >> 8;
            this.bytes_[offset + 2] = value >> 16;
            this.bytes_[offset + 3] = value >> 24;
        };
        ;
        /**
         * @param {number} offset
         * @param {flatbuffers.Long} value
         */
        ByteBuffer.prototype.writeInt64 = function (offset, value) {
            this.writeInt32(offset, value.low);
            this.writeInt32(offset + 4, value.high);
        };
        ;
        /**
         * @param {number} offset
         * @param {number} value
         */
        ByteBuffer.prototype.writeFloat32 = function (offset, value) {
            float32[0] = value;
            this.writeInt32(offset, int32[0]);
        };
        ;
        /**
         * @param {number} offset
         * @param {number} value
         */
        ByteBuffer.prototype.writeFloat64 = function (offset, value) {
            float64[0] = value;
            this.writeInt32(offset, int32[isLittleEndian ? 0 : 1]);
            this.writeInt32(offset + 4, int32[isLittleEndian ? 1 : 0]);
        };
        ;
        /**
         * Look up a field in the vtable, return an offset into the object, or 0 if the
         * field is not present.
         *
         * @param {number} bb_pos
         * @param {number} vtable_offset
         * @returns {number}
         */
        ByteBuffer.prototype.__offset = function (bb_pos, vtable_offset) {
            var vtable = bb_pos - this.readInt32(bb_pos);
            return vtable_offset < this.readInt16(vtable) ? this.readInt16(vtable + vtable_offset) : 0;
        };
        ;
        /**
         * Initialize any Table-derived type to point to the union at the given offset.
         *
         * @param {flatbuffers.Table} t
         * @param {number} offset
         * @returns {flatbuffers.Table}
         */
        ByteBuffer.prototype.__union = function (t, offset) {
            t.bb_pos = offset + this.readInt32(offset);
            t.bb = this;
            return t;
        };
        ;
        ByteBuffer.prototype.__string = function (offset, optionalEncoding) {
            offset += this.readInt32(offset);
            var length = this.readInt32(offset);
            var result = '';
            var i = 0;
            offset += SIZEOF_INT;
            if (optionalEncoding === Encoding.UTF8_BYTES) {
                return this.bytes_.subarray(offset, offset + length);
            }
            while (i < length) {
                var codePoint;
                // Decode UTF-8
                var a = this.readUint8(offset + i++);
                if (a < 0xC0) {
                    codePoint = a;
                }
                else {
                    var b = this.readUint8(offset + i++);
                    if (a < 0xE0) {
                        codePoint =
                            ((a & 0x1F) << 6) |
                                (b & 0x3F);
                    }
                    else {
                        var c = this.readUint8(offset + i++);
                        if (a < 0xF0) {
                            codePoint =
                                ((a & 0x0F) << 12) |
                                    ((b & 0x3F) << 6) |
                                    (c & 0x3F);
                        }
                        else {
                            var d = this.readUint8(offset + i++);
                            codePoint =
                                ((a & 0x07) << 18) |
                                    ((b & 0x3F) << 12) |
                                    ((c & 0x3F) << 6) |
                                    (d & 0x3F);
                        }
                    }
                }
                // Encode UTF-16
                if (codePoint < 0x10000) {
                    result += String.fromCharCode(codePoint);
                }
                else {
                    codePoint -= 0x10000;
                    result += String.fromCharCode((codePoint >> 10) + 0xD800, (codePoint & ((1 << 10) - 1)) + 0xDC00);
                }
            }
            return result;
        };
        ;
        /**
         * Retrieve the relative offset stored at "offset"
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.__indirect = function (offset) {
            return offset + this.readInt32(offset);
        };
        ;
        /**
         * Get the start of data of a vector whose offset is stored at "offset" in this object.
         *
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.__vector = function (offset) {
            return offset + this.readInt32(offset) + SIZEOF_INT; // data starts after the length
        };
        ;
        /**
         * Get the length of a vector whose offset is stored at "offset" in this object.
         *
         * @param {number} offset
         * @returns {number}
         */
        ByteBuffer.prototype.__vector_len = function (offset) {
            return this.readInt32(offset + this.readInt32(offset));
        };
        ;
        /**
         * @param {string} ident
         * @returns {boolean}
         */
        ByteBuffer.prototype.__has_identifier = function (ident) {
            if (ident.length != FILE_IDENTIFIER_LENGTH) {
                throw new Error('FlatBuffers: file identifier must be length ' +
                    FILE_IDENTIFIER_LENGTH);
            }
            for (var i = 0; i < FILE_IDENTIFIER_LENGTH; i++) {
                if (ident.charCodeAt(i) != this.readInt8(this.position_ + SIZEOF_INT + i)) {
                    return false;
                }
            }
            return true;
        };
        ;
        /**
         * A helper function to avoid generated code depending on this file directly.
         *
         * @param {number} low
         * @param {number} high
         * @returns {flatbuffers.Long}
         */
        ByteBuffer.prototype.createLong = function (low, high) {
            return flatbuffers.Long.create(low, high);
        };
        ;
        return ByteBuffer;
    }());
    flatbuffers.ByteBuffer = ByteBuffer;
})(flatbuffers = exports.flatbuffers || (exports.flatbuffers = {}));
// Exports for Node.js and RequireJS
//this.flatbuffers = flatbuffers;
/// @endcond
/// @}

},{}]},{},[2]);

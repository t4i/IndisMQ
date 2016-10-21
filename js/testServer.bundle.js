(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var flatbuffers_1 = require("../schema/flatbuffers");
var IndisMQ_generated_1 = require("../schema/IndisMQ_generated");
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
        m.data = data;
        m.fields = IndisMQ_generated_1.IndisMQ.Imq.getRootAsImq(new flatbuffers_1.flatbuffers.ByteBuffer(data));
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
        var m = makeImq(uid, name, "", false, "", IndisMQ_generated_1.IndisMQ.MsgType.CMD, IndisMQ_generated_1.IndisMQ.Sts.REQ, IndisMQ_generated_1.IndisMQ.Err.NONE, stsMsg, IndisMQ_generated_1.IndisMQ.Cmd.SYN, null, callback);
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.syn = syn;
    function err(m, stsMsg, err) {
        return makeImq(m.fields.MsgId(), name, m.fields.From(), m.fields.Broker(), m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1.IndisMQ.Sts.ERROR, err, stsMsg, m.fields.Cmd(), null, null);
    }
    imq_1.err = err;
    function success(m, stsMsg) {
        return makeImq(m.fields.MsgId(), name, m.fields.From(), m.fields.Broker(), m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1.IndisMQ.Sts.SUCCESS, IndisMQ_generated_1.IndisMQ.Err.NONE, stsMsg, m.fields.Cmd(), null, null);
    }
    imq_1.success = success;
    function req(to, dest, msg, callback) {
        var uid = newUID();
        var m = makeImq(uid, name, to, false, dest, IndisMQ_generated_1.IndisMQ.MsgType.PEER, IndisMQ_generated_1.IndisMQ.Sts.REQ, IndisMQ_generated_1.IndisMQ.Err.NONE, "", IndisMQ_generated_1.IndisMQ.Cmd.NONE, msg, callback);
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.req = req;
    function rep(m, stsMsg, msg) {
        return makeImq(m.fields.MsgId(), name, m.fields.From(), m.fields.Broker(), m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1.IndisMQ.Sts.REP, IndisMQ_generated_1.IndisMQ.Err.NONE, stsMsg, m.fields.Cmd(), msg, null);
    }
    imq_1.rep = rep;
    function sub(path, handler, callback) {
        var uid = newUID();
        if (handler) {
            setHandler(path, handler);
        }
        var m = makeImq(uid, name, "", false, path, IndisMQ_generated_1.IndisMQ.MsgType.CMD, IndisMQ_generated_1.IndisMQ.Sts.REQ, IndisMQ_generated_1.IndisMQ.Err.NONE, "", IndisMQ_generated_1.IndisMQ.Cmd.SUB, null, callback);
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.sub = sub;
    function unSub(path, handler, callback) {
        var uid = newUID();
        delHandler(path);
        var m = makeImq(uid, name, "", false, path, IndisMQ_generated_1.IndisMQ.MsgType.CMD, IndisMQ_generated_1.IndisMQ.Sts.REQ, IndisMQ_generated_1.IndisMQ.Err.NONE, "", IndisMQ_generated_1.IndisMQ.Cmd.UNSUB, null, callback);
        if (callback) {
            messages[uid] = m;
        }
        return m;
    }
    imq_1.unSub = unSub;
    function brokerReplay(m, handler, callback) {
        if (m.fields.MsgType() == IndisMQ_generated_1.IndisMQ.MsgType.MULT) {
            var r = makeImq(m.fields.MsgId(), name, null, false, m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1.IndisMQ.Sts.REQ, IndisMQ_generated_1.IndisMQ.Err.NONE, m.fields.StsMsg(), m.fields.Cmd(), m.fields.BodyArray(), callback);
            sendMult(r, handler);
        }
        else {
            var r = makeImq(m.fields.MsgId(), name, null, false, m.fields.Path(), m.fields.MsgType(), IndisMQ_generated_1.IndisMQ.Sts.REQ, IndisMQ_generated_1.IndisMQ.Err.NONE, m.fields.StsMsg(), m.fields.Cmd(), m.fields.BodyArray(), callback);
            sendQueue(r, handler);
        }
    }
    function mult(broker, path, msg, handler, callback) {
        var uid = newUID();
        var m = makeImq(uid, name, "", broker, path, IndisMQ_generated_1.IndisMQ.MsgType.MULT, IndisMQ_generated_1.IndisMQ.Sts.REQ, IndisMQ_generated_1.IndisMQ.Err.NONE, "", IndisMQ_generated_1.IndisMQ.Cmd.NONE, msg, callback);
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
        var m = makeImq(uid, name, "", broker, path, IndisMQ_generated_1.IndisMQ.MsgType.QUEUE, IndisMQ_generated_1.IndisMQ.Sts.REQ, IndisMQ_generated_1.IndisMQ.Err.NONE, "", IndisMQ_generated_1.IndisMQ.Cmd.NONE, msg, callback);
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
        var builder = new flatbuffers_1.flatbuffers.Builder(1);
        var idOffset = builder.createString(id);
        var bodyOffset = IndisMQ_generated_1.IndisMQ.Imq.createBodyVector(builder, body);
        var stsMsgOffset = builder.createString(stsMsg);
        var pathOffset = builder.createString(path);
        var fromOffset = builder.createString(from);
        var toOffset = builder.createString(to);
        IndisMQ_generated_1.IndisMQ.Imq.startImq(builder);
        IndisMQ_generated_1.IndisMQ.Imq.addFrom(builder, fromOffset);
        IndisMQ_generated_1.IndisMQ.Imq.addTo(builder, toOffset);
        IndisMQ_generated_1.IndisMQ.Imq.addMsgId(builder, idOffset);
        IndisMQ_generated_1.IndisMQ.Imq.addBroker(builder, broker);
        if (callback) {
            IndisMQ_generated_1.IndisMQ.Imq.addCallback(builder, true);
            m.callback = callback;
        }
        IndisMQ_generated_1.IndisMQ.Imq.addPath(builder, pathOffset);
        IndisMQ_generated_1.IndisMQ.Imq.addSts(builder, sts);
        IndisMQ_generated_1.IndisMQ.Imq.addBody(builder, bodyOffset);
        IndisMQ_generated_1.IndisMQ.Imq.addStsMsg(builder, stsMsgOffset);
        IndisMQ_generated_1.IndisMQ.Imq.addErr(builder, err);
        IndisMQ_generated_1.IndisMQ.Imq.addMsgType(builder, msgType);
        IndisMQ_generated_1.IndisMQ.Imq.addCmd(builder, cmd);
        var imq = IndisMQ_generated_1.IndisMQ.Imq.endImq(builder);
        builder.finish(imq);
        m.data = builder.asUint8Array();
        m.fields = IndisMQ_generated_1.IndisMQ.Imq.getRootAsImq(new flatbuffers_1.flatbuffers.ByteBuffer(m.data));
        return m;
    }
    function recieveRawData(data) {
        var reply;
        var m = parseMsg(new Uint8Array(data));
        var buf = new flatbuffers_1.flatbuffers.ByteBuffer(m.data);
        var i = IndisMQ_generated_1.IndisMQ.Imq.getRootAsImq(buf);
        //console.log("Recieved "+schema.MsgType[m.fields.MsgType()]+" "+schema.Sts[m.fields.Sts()]+" "+schema.Cmd[m.fields.Cmd()])
        if (!m) {
            return null;
        }
        if (m.fields.Broker() == true) {
            if (brokerHandler) {
                reply = brokerHandler(m);
            }
            else {
                reply = err(m, "not a broker", IndisMQ_generated_1.IndisMQ.Err.NO_HANDLER);
            }
        }
        else if (m.fields.To() && m.fields.To().length > 0 && m.fields.To() != name) {
            if (relayHandler) {
                reply = relayHandler(m);
            }
            else {
                reply = err(m, "not a relay", IndisMQ_generated_1.IndisMQ.Err.NO_HANDLER);
            }
        }
        else if (m.fields.MsgType() == IndisMQ_generated_1.IndisMQ.MsgType.CMD) {
            reply = handleCmd(m);
        }
        else if (m.fields.Sts() == IndisMQ_generated_1.IndisMQ.Sts.REQ) {
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
        if (m.fields.Sts() == IndisMQ_generated_1.IndisMQ.Sts.REQ) {
            switch (m.fields.Cmd()) {
                case IndisMQ_generated_1.IndisMQ.Cmd.SUB:
                    addSubscriber(m.fields.From(), m.fields.Path());
                    r = success(m, "");
                    break;
                case IndisMQ_generated_1.IndisMQ.Cmd.SYN:
                    r = success(m, "");
                    break;
                case IndisMQ_generated_1.IndisMQ.Cmd.UNSUB:
                    delSubscriber(m.fields.From(), m.fields.Path());
                    r = success(m, "");
                    break;
                default:
                    r = err(m, "unsupported CMD", IndisMQ_generated_1.IndisMQ.Err.INVALID);
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
    function setName(newName) {
        name = newName;
    }
    imq_1.setName = setName;
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
var t = indisMQ_1.imq.req("", "", null, null);
console.log(t.fields.MsgId());
console.log("still made it");
indisMQ_1.imq.setName("browser");
indisMQ_1.imq.setHandler("/what", function (m) {
    console.log("say what");
    return indisMQ_1.imq.success(m, "got it");
});
var ws = new WebSocket("ws://localhost:7000/test");
ws.binaryType = "arraybuffer";
ws.onopen = function (event) {
    var msg = indisMQ_1.imq.req("", "/", "hey buddy", null);
    ws.send(msg.data);
    var sub = indisMQ_1.imq.sub("/hello", function (m) {
        console.log("new message on hello " + m.fields.From() + " says " + bin2string(m.fields.BodyArray()));
        return indisMQ_1.imq.success(m, "woohoo");
    }, function (m) {
        console.log("callback called");
        return null;
    });
    ws.send(sub.data);
};
ws.onmessage = function (event) {
    var reply = indisMQ_1.imq.recieveRawData(event.data);
    if (reply) {
        ws.send(reply.data);
    }
};
function bin2string(array) {
    var result = "";
    for (var i = 0; i < array.length; ++i) {
        result += (String.fromCharCode(array[i]));
    }
    return result;
}

},{"./indisMQ":1}],3:[function(require,module,exports){
// automatically generated by the FlatBuffers compiler, do not modify
"use strict";
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
         * @param {number} value
         * @returns {boolean}
         */
        Ver.prototype.mutate_Major = function (value) {
            var offset = this.bb.__offset(this.bb_pos, 0);
            if (offset === 0) {
                return false;
            }
            this.bb.writeInt8(this.bb_pos + offset, value);
            return true;
        };
        /**
         * @returns {number}
         */
        Ver.prototype.Minor = function () {
            return this.bb.readInt8(this.bb_pos + 1);
        };
        ;
        /**
         * @param {number} value
         * @returns {boolean}
         */
        Ver.prototype.mutate_Minor = function (value) {
            var offset = this.bb.__offset(this.bb_pos, 1);
            if (offset === 0) {
                return false;
            }
            this.bb.writeInt8(this.bb_pos + offset, value);
            return true;
        };
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
         * @param {boolean} value
         * @returns {boolean}
         */
        Imq.prototype.mutate_Broker = function (value) {
            var offset = this.bb.__offset(this.bb_pos, 10);
            if (offset === 0) {
                return false;
            }
            this.bb.writeInt8(this.bb_pos + offset, +value);
            return true;
        };
        /**
         * @returns {IndisMQ.Cmd}
         */
        Imq.prototype.Cmd = function () {
            var offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.Cmd.NONE;
        };
        ;
        /**
         * @param {IndisMQ.Cmd} value
         * @returns {boolean}
         */
        Imq.prototype.mutate_Cmd = function (value) {
            var offset = this.bb.__offset(this.bb_pos, 12);
            if (offset === 0) {
                return false;
            }
            this.bb.writeInt8(this.bb_pos + offset, value);
            return true;
        };
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
         * @param {IndisMQ.MsgType} value
         * @returns {boolean}
         */
        Imq.prototype.mutate_MsgType = function (value) {
            var offset = this.bb.__offset(this.bb_pos, 16);
            if (offset === 0) {
                return false;
            }
            this.bb.writeInt8(this.bb_pos + offset, value);
            return true;
        };
        /**
         * @returns {IndisMQ.Sts}
         */
        Imq.prototype.Sts = function () {
            var offset = this.bb.__offset(this.bb_pos, 18);
            return offset ? (this.bb.readInt8(this.bb_pos + offset)) : IndisMQ.Sts.NONE;
        };
        ;
        /**
         * @param {IndisMQ.Sts} value
         * @returns {boolean}
         */
        Imq.prototype.mutate_Sts = function (value) {
            var offset = this.bb.__offset(this.bb_pos, 18);
            if (offset === 0) {
                return false;
            }
            this.bb.writeInt8(this.bb_pos + offset, value);
            return true;
        };
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
        /**
         * @param {IndisMQ.Err} value
         * @returns {boolean}
         */
        Imq.prototype.mutate_Err = function (value) {
            var offset = this.bb.__offset(this.bb_pos, 22);
            if (offset === 0) {
                return false;
            }
            this.bb.writeInt8(this.bb_pos + offset, value);
            return true;
        };
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
         * @param {boolean} value
         * @returns {boolean}
         */
        Imq.prototype.mutate_Callback = function (value) {
            var offset = this.bb.__offset(this.bb_pos, 26);
            if (offset === 0) {
                return false;
            }
            this.bb.writeInt8(this.bb_pos + offset, +value);
            return true;
        };
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
            if (!data) {
                return null;
            }
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
////////////////////////////////////////////////////////////////////////////////
/**
 * @constructor
 * @param {number} high
 * @param {number} low
 */
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
        Builder.prototype.writeUint8 = function (value) {
            this.bb.writeUint8(this.space -= 1, value);
        };
        ;
        /**
         * @param {number} value
         */
        Builder.prototype.writeUint16 = function (value) {
            this.bb.writeUint16(this.space -= 2, value);
        };
        ;
        /**
         * @param {number} value
         */
        Builder.prototype.writeUint32 = function (value) {
            this.bb.writeUint32(this.space -= 4, value);
        };
        ;
        /**
         * @param {flatbuffers.Long} value
         */
        Builder.prototype.writeUint64 = function (value) {
            this.bb.writeUint64(this.space -= 8, value);
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
        ByteBuffer.prototype.writeUint8 = function (offset, value) {
            this.writeInt8(offset, value);
        };
        ;
        /**
         * @param {number} offset
         * @param {number} value
         */
        ByteBuffer.prototype.writeUint16 = function (offset, value) {
            this.writeInt16(offset, value);
        };
        ;
        /**
         * @param {number} offset
         * @param {number} value
         */
        ByteBuffer.prototype.writeUint32 = function (offset, value) {
            this.writeInt32(offset, value);
        };
        ;
        /**
       * @param {number} offset
       * @param {number} value
       */
        ByteBuffer.prototype.writeUint64 = function (offset, value) {
            this.writeInt64(offset, value);
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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL3NhbXBhLkRFU0tUT1AtVVFGUUpDVC9BcHBEYXRhL1JvYW1pbmcvbnBtL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRpc01RLmpzIiwidGVzdFNlcnZlci5qcyIsIi4uL3NjaGVtYS9JbmRpc01RX2dlbmVyYXRlZC5qcyIsIi4uL3NjaGVtYS9mbGF0YnVmZmVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIGZsYXRidWZmZXJzXzEgPSByZXF1aXJlKFwiLi4vc2NoZW1hL2ZsYXRidWZmZXJzXCIpO1xyXG52YXIgSW5kaXNNUV9nZW5lcmF0ZWRfMSA9IHJlcXVpcmUoXCIuLi9zY2hlbWEvSW5kaXNNUV9nZW5lcmF0ZWRcIik7XHJcbnZhciBpbXE7XHJcbihmdW5jdGlvbiAoaW1xXzEpIHtcclxuICAgIHZhciBNc2cgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIE1zZygpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1zZztcclxuICAgIH0oKSk7XHJcbiAgICBpbXFfMS5Nc2cgPSBNc2c7XHJcbiAgICB2YXIgaGFuZGxlcnMgPSB7fTtcclxuICAgIHZhciBtZXNzYWdlcyA9IHt9O1xyXG4gICAgdmFyIHN1YnNjcmliZXJzID0ge307XHJcbiAgICB2YXIgYnJva2VySGFuZGxlcjtcclxuICAgIHZhciByZWxheUhhbmRsZXI7XHJcbiAgICB2YXIgbmFtZSA9IFwidW5uYW1lZFwiO1xyXG4gICAgZnVuY3Rpb24gc2V0QnJva2VySGFuZGxlcihoYW5kbGVyKSB7XHJcbiAgICAgICAgYnJva2VySGFuZGxlciA9IGhhbmRsZXI7XHJcbiAgICB9XHJcbiAgICBpbXFfMS5zZXRCcm9rZXJIYW5kbGVyID0gc2V0QnJva2VySGFuZGxlcjtcclxuICAgIGZ1bmN0aW9uIHNldFJlbGF5SGFuZGxlcihoYW5kbGVyKSB7XHJcbiAgICAgICAgcmVsYXlIYW5kbGVyID0gaGFuZGxlcjtcclxuICAgIH1cclxuICAgIGltcV8xLnNldFJlbGF5SGFuZGxlciA9IHNldFJlbGF5SGFuZGxlcjtcclxuICAgIGZ1bmN0aW9uIHBhcnNlTXNnKGRhdGEpIHtcclxuICAgICAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBtID0gbmV3IE1zZygpO1xyXG4gICAgICAgIG0uZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgbS5maWVsZHMgPSBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLmdldFJvb3RBc0ltcShuZXcgZmxhdGJ1ZmZlcnNfMS5mbGF0YnVmZmVycy5CeXRlQnVmZmVyKGRhdGEpKTtcclxuICAgICAgICByZXR1cm4gbTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGdldEltcU1lc3NhZ2UoaWQpIHtcclxuICAgICAgICBpZiAoaWQgaW4gbWVzc2FnZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2VzW2lkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBkZWxNZXNzYWdlKGlkKSB7XHJcbiAgICAgICAgaWYgKGlkIGluIG1lc3NhZ2VzKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBtZXNzYWdlc1tpZF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaW1xXzEuZGVsTWVzc2FnZSA9IGRlbE1lc3NhZ2U7XHJcbiAgICBmdW5jdGlvbiBhZGRTdWJzY3JpYmVyKGNsaWVudCwgcGF0aCkge1xyXG4gICAgICAgIGlmICghKHBhdGggaW4gc3Vic2NyaWJlcnMpKSB7XHJcbiAgICAgICAgICAgIHN1YnNjcmliZXJzW3BhdGhdID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN1YnNjcmliZXJzW3BhdGhdW2NsaWVudF0gPSBmYWxzZTtcclxuICAgIH1cclxuICAgIGltcV8xLmFkZFN1YnNjcmliZXIgPSBhZGRTdWJzY3JpYmVyO1xyXG4gICAgZnVuY3Rpb24gZGVsU3Vic2NyaWJlcihjbGllbnQsIHBhdGgpIHtcclxuICAgICAgICBpZiAocGF0aCBpbiBzdWJzY3JpYmVycykge1xyXG4gICAgICAgICAgICBpZiAoY2xpZW50IGluIHN1YnNjcmliZXJzW3BhdGhdKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgc3Vic2NyaWJlcnNbcGF0aF1bY2xpZW50XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoc3Vic2NyaWJlcnNbcGF0aF0pLmxlbmd0aCA8IDEpIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBzdWJzY3JpYmVyc1twYXRoXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGltcV8xLmRlbFN1YnNjcmliZXIgPSBkZWxTdWJzY3JpYmVyO1xyXG4gICAgZnVuY3Rpb24gc2V0SGFuZGxlcihwYXRoLCBoYW5kbGVyKSB7XHJcbiAgICAgICAgaGFuZGxlcnNbcGF0aF0gPSBoYW5kbGVyO1xyXG4gICAgfVxyXG4gICAgaW1xXzEuc2V0SGFuZGxlciA9IHNldEhhbmRsZXI7XHJcbiAgICBmdW5jdGlvbiBnZXRIYW5kbGVyKHBhdGgpIHtcclxuICAgICAgICBpZiAocGF0aCBpbiBoYW5kbGVycykge1xyXG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlcnNbcGF0aF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZGVsSGFuZGxlcihwYXRoKSB7XHJcbiAgICAgICAgaWYgKHBhdGggaW4gaGFuZGxlcnMpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGhhbmRsZXJzW3BhdGhdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIGV4cG9ydCBmdW5jdGlvbiBzZXRDYWxsYmFjayhpZDogc3RyaW5nLCBjYWxsYmFjazogSGFuZGxlcikge1xyXG4gICAgLy8gICAgIHN0YXR1c1tpZF0gPSBzdGF0dXNbaWRdIHwge31cclxuICAgIC8vICAgICBzdGF0dXNbaWRdLmNhbGxiYWNrID0gY2FsbGJhY2tcclxuICAgIC8vIH1cclxuICAgIC8vIGV4cG9ydCBmdW5jdGlvbiBnZXRDYWxsYmFjayhpZDogc3RyaW5nKSB7XHJcbiAgICAvLyAgICAgcmV0dXJuIHN0YXR1c1tpZF0uY2FsbGJhY2tcclxuICAgIC8vIH1cclxuICAgIGZ1bmN0aW9uIHN5bihzdHNNc2csIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIHVpZCA9IG5ld1VJRCgpO1xyXG4gICAgICAgIHZhciBtID0gbWFrZUltcSh1aWQsIG5hbWUsIFwiXCIsIGZhbHNlLCBcIlwiLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuTXNnVHlwZS5DTUQsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5TdHMuUkVRLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuRXJyLk5PTkUsIHN0c01zZywgSW5kaXNNUV9nZW5lcmF0ZWRfMS5JbmRpc01RLkNtZC5TWU4sIG51bGwsIGNhbGxiYWNrKTtcclxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgbWVzc2FnZXNbdWlkXSA9IG07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBtO1xyXG4gICAgfVxyXG4gICAgaW1xXzEuc3luID0gc3luO1xyXG4gICAgZnVuY3Rpb24gZXJyKG0sIHN0c01zZywgZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIG1ha2VJbXEobS5maWVsZHMuTXNnSWQoKSwgbmFtZSwgbS5maWVsZHMuRnJvbSgpLCBtLmZpZWxkcy5Ccm9rZXIoKSwgbS5maWVsZHMuUGF0aCgpLCBtLmZpZWxkcy5Nc2dUeXBlKCksIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5TdHMuRVJST1IsIGVyciwgc3RzTXNnLCBtLmZpZWxkcy5DbWQoKSwgbnVsbCwgbnVsbCk7XHJcbiAgICB9XHJcbiAgICBpbXFfMS5lcnIgPSBlcnI7XHJcbiAgICBmdW5jdGlvbiBzdWNjZXNzKG0sIHN0c01zZykge1xyXG4gICAgICAgIHJldHVybiBtYWtlSW1xKG0uZmllbGRzLk1zZ0lkKCksIG5hbWUsIG0uZmllbGRzLkZyb20oKSwgbS5maWVsZHMuQnJva2VyKCksIG0uZmllbGRzLlBhdGgoKSwgbS5maWVsZHMuTXNnVHlwZSgpLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuU3RzLlNVQ0NFU1MsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5FcnIuTk9ORSwgc3RzTXNnLCBtLmZpZWxkcy5DbWQoKSwgbnVsbCwgbnVsbCk7XHJcbiAgICB9XHJcbiAgICBpbXFfMS5zdWNjZXNzID0gc3VjY2VzcztcclxuICAgIGZ1bmN0aW9uIHJlcSh0bywgZGVzdCwgbXNnLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciB1aWQgPSBuZXdVSUQoKTtcclxuICAgICAgICB2YXIgbSA9IG1ha2VJbXEodWlkLCBuYW1lLCB0bywgZmFsc2UsIGRlc3QsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5Nc2dUeXBlLlBFRVIsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5TdHMuUkVRLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuRXJyLk5PTkUsIFwiXCIsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5DbWQuTk9ORSwgbXNnLCBjYWxsYmFjayk7XHJcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VzW3VpZF0gPSBtO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbTtcclxuICAgIH1cclxuICAgIGltcV8xLnJlcSA9IHJlcTtcclxuICAgIGZ1bmN0aW9uIHJlcChtLCBzdHNNc2csIG1zZykge1xyXG4gICAgICAgIHJldHVybiBtYWtlSW1xKG0uZmllbGRzLk1zZ0lkKCksIG5hbWUsIG0uZmllbGRzLkZyb20oKSwgbS5maWVsZHMuQnJva2VyKCksIG0uZmllbGRzLlBhdGgoKSwgbS5maWVsZHMuTXNnVHlwZSgpLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuU3RzLlJFUCwgSW5kaXNNUV9nZW5lcmF0ZWRfMS5JbmRpc01RLkVyci5OT05FLCBzdHNNc2csIG0uZmllbGRzLkNtZCgpLCBtc2csIG51bGwpO1xyXG4gICAgfVxyXG4gICAgaW1xXzEucmVwID0gcmVwO1xyXG4gICAgZnVuY3Rpb24gc3ViKHBhdGgsIGhhbmRsZXIsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIHVpZCA9IG5ld1VJRCgpO1xyXG4gICAgICAgIGlmIChoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgIHNldEhhbmRsZXIocGF0aCwgaGFuZGxlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBtID0gbWFrZUltcSh1aWQsIG5hbWUsIFwiXCIsIGZhbHNlLCBwYXRoLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuTXNnVHlwZS5DTUQsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5TdHMuUkVRLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuRXJyLk5PTkUsIFwiXCIsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5DbWQuU1VCLCBudWxsLCBjYWxsYmFjayk7XHJcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VzW3VpZF0gPSBtO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbTtcclxuICAgIH1cclxuICAgIGltcV8xLnN1YiA9IHN1YjtcclxuICAgIGZ1bmN0aW9uIHVuU3ViKHBhdGgsIGhhbmRsZXIsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIHVpZCA9IG5ld1VJRCgpO1xyXG4gICAgICAgIGRlbEhhbmRsZXIocGF0aCk7XHJcbiAgICAgICAgdmFyIG0gPSBtYWtlSW1xKHVpZCwgbmFtZSwgXCJcIiwgZmFsc2UsIHBhdGgsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5Nc2dUeXBlLkNNRCwgSW5kaXNNUV9nZW5lcmF0ZWRfMS5JbmRpc01RLlN0cy5SRVEsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5FcnIuTk9ORSwgXCJcIiwgSW5kaXNNUV9nZW5lcmF0ZWRfMS5JbmRpc01RLkNtZC5VTlNVQiwgbnVsbCwgY2FsbGJhY2spO1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBtZXNzYWdlc1t1aWRdID0gbTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG07XHJcbiAgICB9XHJcbiAgICBpbXFfMS51blN1YiA9IHVuU3ViO1xyXG4gICAgZnVuY3Rpb24gYnJva2VyUmVwbGF5KG0sIGhhbmRsZXIsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKG0uZmllbGRzLk1zZ1R5cGUoKSA9PSBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuTXNnVHlwZS5NVUxUKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gbWFrZUltcShtLmZpZWxkcy5Nc2dJZCgpLCBuYW1lLCBudWxsLCBmYWxzZSwgbS5maWVsZHMuUGF0aCgpLCBtLmZpZWxkcy5Nc2dUeXBlKCksIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5TdHMuUkVRLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuRXJyLk5PTkUsIG0uZmllbGRzLlN0c01zZygpLCBtLmZpZWxkcy5DbWQoKSwgbS5maWVsZHMuQm9keUFycmF5KCksIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgc2VuZE11bHQociwgaGFuZGxlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgciA9IG1ha2VJbXEobS5maWVsZHMuTXNnSWQoKSwgbmFtZSwgbnVsbCwgZmFsc2UsIG0uZmllbGRzLlBhdGgoKSwgbS5maWVsZHMuTXNnVHlwZSgpLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuU3RzLlJFUSwgSW5kaXNNUV9nZW5lcmF0ZWRfMS5JbmRpc01RLkVyci5OT05FLCBtLmZpZWxkcy5TdHNNc2coKSwgbS5maWVsZHMuQ21kKCksIG0uZmllbGRzLkJvZHlBcnJheSgpLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIHNlbmRRdWV1ZShyLCBoYW5kbGVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBtdWx0KGJyb2tlciwgcGF0aCwgbXNnLCBoYW5kbGVyLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciB1aWQgPSBuZXdVSUQoKTtcclxuICAgICAgICB2YXIgbSA9IG1ha2VJbXEodWlkLCBuYW1lLCBcIlwiLCBicm9rZXIsIHBhdGgsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5Nc2dUeXBlLk1VTFQsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5TdHMuUkVRLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuRXJyLk5PTkUsIFwiXCIsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5DbWQuTk9ORSwgbXNnLCBjYWxsYmFjayk7XHJcbiAgICAgICAgaWYgKCFicm9rZXIpIHtcclxuICAgICAgICAgICAgc2VuZE11bHQobSwgaGFuZGxlcik7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgbWVzc2FnZXNbdWlkXSA9IG07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBtO1xyXG4gICAgfVxyXG4gICAgaW1xXzEubXVsdCA9IG11bHQ7XHJcbiAgICBmdW5jdGlvbiBzZW5kTXVsdChtLCBoYW5kbGVyKSB7XHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHN1YnNjcmliZXJzW20uZmllbGRzLlBhdGgoKV0pIHtcclxuICAgICAgICAgICAgaGFuZGxlcihrZXksIG0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHF1ZXVlKGJyb2tlciwgcGF0aCwgbXNnLCBoYW5kbGVyLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciB1aWQgPSBuZXdVSUQoKTtcclxuICAgICAgICB2YXIgbSA9IG1ha2VJbXEodWlkLCBuYW1lLCBcIlwiLCBicm9rZXIsIHBhdGgsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5Nc2dUeXBlLlFVRVVFLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuU3RzLlJFUSwgSW5kaXNNUV9nZW5lcmF0ZWRfMS5JbmRpc01RLkVyci5OT05FLCBcIlwiLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuQ21kLk5PTkUsIG1zZywgY2FsbGJhY2spO1xyXG4gICAgICAgIGlmICghYnJva2VyKSB7XHJcbiAgICAgICAgICAgIHNlbmRRdWV1ZShtLCBoYW5kbGVyKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBtZXNzYWdlc1t1aWRdID0gbTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG07XHJcbiAgICB9XHJcbiAgICBpbXFfMS5xdWV1ZSA9IHF1ZXVlO1xyXG4gICAgZnVuY3Rpb24gc2VuZFF1ZXVlKG0sIGhhbmRsZXIpIHtcclxuICAgICAgICB2YXIgc3VjY2VzcyA9IGZhbHNlO1xyXG4gICAgICAgIHZhciB0YWtlTmV4dCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBwYXRoID0gbS5maWVsZHMuUGF0aCgpLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgaWYgKHBhdGggaW4gc3Vic2NyaWJlcnMpIHtcclxuICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHN1YnNjcmliZXJzW3BhdGhdKS5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3Vic2NyaWJlcnNbcGF0aF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFrZU5leHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlcihrZXksIG0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyc1twYXRoXVtrZXldID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpYmVyc1twYXRoXVtrZXldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRha2VOZXh0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcnNbcGF0aF1ba2V5XSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzdWJzY3JpYmVyc1twYXRoXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyKGtleSwgbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJzW3BhdGhdW2tleV0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbWFrZUltcShpZCwgZnJvbSwgdG8sIGJyb2tlciwgcGF0aCwgbXNnVHlwZSwgc3RzLCBlcnIsIHN0c01zZywgY21kLCBib2R5LCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBtID0gbmV3IE1zZygpO1xyXG4gICAgICAgIHZhciBidWlsZGVyID0gbmV3IGZsYXRidWZmZXJzXzEuZmxhdGJ1ZmZlcnMuQnVpbGRlcigxKTtcclxuICAgICAgICB2YXIgaWRPZmZzZXQgPSBidWlsZGVyLmNyZWF0ZVN0cmluZyhpZCk7XHJcbiAgICAgICAgdmFyIGJvZHlPZmZzZXQgPSBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLmNyZWF0ZUJvZHlWZWN0b3IoYnVpbGRlciwgYm9keSk7XHJcbiAgICAgICAgdmFyIHN0c01zZ09mZnNldCA9IGJ1aWxkZXIuY3JlYXRlU3RyaW5nKHN0c01zZyk7XHJcbiAgICAgICAgdmFyIHBhdGhPZmZzZXQgPSBidWlsZGVyLmNyZWF0ZVN0cmluZyhwYXRoKTtcclxuICAgICAgICB2YXIgZnJvbU9mZnNldCA9IGJ1aWxkZXIuY3JlYXRlU3RyaW5nKGZyb20pO1xyXG4gICAgICAgIHZhciB0b09mZnNldCA9IGJ1aWxkZXIuY3JlYXRlU3RyaW5nKHRvKTtcclxuICAgICAgICBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLnN0YXJ0SW1xKGJ1aWxkZXIpO1xyXG4gICAgICAgIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5JbXEuYWRkRnJvbShidWlsZGVyLCBmcm9tT2Zmc2V0KTtcclxuICAgICAgICBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLmFkZFRvKGJ1aWxkZXIsIHRvT2Zmc2V0KTtcclxuICAgICAgICBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLmFkZE1zZ0lkKGJ1aWxkZXIsIGlkT2Zmc2V0KTtcclxuICAgICAgICBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLmFkZEJyb2tlcihidWlsZGVyLCBicm9rZXIpO1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLmFkZENhbGxiYWNrKGJ1aWxkZXIsIHRydWUpO1xyXG4gICAgICAgICAgICBtLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5JbXEuYWRkUGF0aChidWlsZGVyLCBwYXRoT2Zmc2V0KTtcclxuICAgICAgICBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLmFkZFN0cyhidWlsZGVyLCBzdHMpO1xyXG4gICAgICAgIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5JbXEuYWRkQm9keShidWlsZGVyLCBib2R5T2Zmc2V0KTtcclxuICAgICAgICBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLmFkZFN0c01zZyhidWlsZGVyLCBzdHNNc2dPZmZzZXQpO1xyXG4gICAgICAgIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5JbXEuYWRkRXJyKGJ1aWxkZXIsIGVycik7XHJcbiAgICAgICAgSW5kaXNNUV9nZW5lcmF0ZWRfMS5JbmRpc01RLkltcS5hZGRNc2dUeXBlKGJ1aWxkZXIsIG1zZ1R5cGUpO1xyXG4gICAgICAgIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5JbXEuYWRkQ21kKGJ1aWxkZXIsIGNtZCk7XHJcbiAgICAgICAgdmFyIGltcSA9IEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5JbXEuZW5kSW1xKGJ1aWxkZXIpO1xyXG4gICAgICAgIGJ1aWxkZXIuZmluaXNoKGltcSk7XHJcbiAgICAgICAgbS5kYXRhID0gYnVpbGRlci5hc1VpbnQ4QXJyYXkoKTtcclxuICAgICAgICBtLmZpZWxkcyA9IEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5JbXEuZ2V0Um9vdEFzSW1xKG5ldyBmbGF0YnVmZmVyc18xLmZsYXRidWZmZXJzLkJ5dGVCdWZmZXIobS5kYXRhKSk7XHJcbiAgICAgICAgcmV0dXJuIG07XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiByZWNpZXZlUmF3RGF0YShkYXRhKSB7XHJcbiAgICAgICAgdmFyIHJlcGx5O1xyXG4gICAgICAgIHZhciBtID0gcGFyc2VNc2cobmV3IFVpbnQ4QXJyYXkoZGF0YSkpO1xyXG4gICAgICAgIHZhciBidWYgPSBuZXcgZmxhdGJ1ZmZlcnNfMS5mbGF0YnVmZmVycy5CeXRlQnVmZmVyKG0uZGF0YSk7XHJcbiAgICAgICAgdmFyIGkgPSBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuSW1xLmdldFJvb3RBc0ltcShidWYpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coXCJSZWNpZXZlZCBcIitzY2hlbWEuTXNnVHlwZVttLmZpZWxkcy5Nc2dUeXBlKCldK1wiIFwiK3NjaGVtYS5TdHNbbS5maWVsZHMuU3RzKCldK1wiIFwiK3NjaGVtYS5DbWRbbS5maWVsZHMuQ21kKCldKVxyXG4gICAgICAgIGlmICghbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG0uZmllbGRzLkJyb2tlcigpID09IHRydWUpIHtcclxuICAgICAgICAgICAgaWYgKGJyb2tlckhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgIHJlcGx5ID0gYnJva2VySGFuZGxlcihtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlcGx5ID0gZXJyKG0sIFwibm90IGEgYnJva2VyXCIsIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5FcnIuTk9fSEFORExFUik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobS5maWVsZHMuVG8oKSAmJiBtLmZpZWxkcy5UbygpLmxlbmd0aCA+IDAgJiYgbS5maWVsZHMuVG8oKSAhPSBuYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChyZWxheUhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgIHJlcGx5ID0gcmVsYXlIYW5kbGVyKG0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVwbHkgPSBlcnIobSwgXCJub3QgYSByZWxheVwiLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuRXJyLk5PX0hBTkRMRVIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG0uZmllbGRzLk1zZ1R5cGUoKSA9PSBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuTXNnVHlwZS5DTUQpIHtcclxuICAgICAgICAgICAgcmVwbHkgPSBoYW5kbGVDbWQobSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG0uZmllbGRzLlN0cygpID09IEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5TdHMuUkVRKSB7XHJcbiAgICAgICAgICAgIGlmIChtLmZpZWxkcy5QYXRoKCkgaW4gaGFuZGxlcnMpIHtcclxuICAgICAgICAgICAgICAgIHJlcGx5ID0gaGFuZGxlcnNbbS5maWVsZHMuUGF0aCgpXShtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKG0uZmllbGRzLk1zZ0lkKCkgaW4gbWVzc2FnZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbXEgPSBtZXNzYWdlc1ttLmZpZWxkcy5Nc2dJZCgpXTtcclxuICAgICAgICAgICAgICAgIGlmIChpbXEuY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBpbXEuY2FsbGJhY2sobSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkZWxNZXNzYWdlKG0uZmllbGRzLk1zZ0lkKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXBseTtcclxuICAgIH1cclxuICAgIGltcV8xLnJlY2lldmVSYXdEYXRhID0gcmVjaWV2ZVJhd0RhdGE7XHJcbiAgICBmdW5jdGlvbiBoYW5kbGVDbWQobSkge1xyXG4gICAgICAgIHZhciByO1xyXG4gICAgICAgIGlmIChtLmZpZWxkcy5TdHMoKSA9PSBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuU3RzLlJFUSkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG0uZmllbGRzLkNtZCgpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIEluZGlzTVFfZ2VuZXJhdGVkXzEuSW5kaXNNUS5DbWQuU1VCOlxyXG4gICAgICAgICAgICAgICAgICAgIGFkZFN1YnNjcmliZXIobS5maWVsZHMuRnJvbSgpLCBtLmZpZWxkcy5QYXRoKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHIgPSBzdWNjZXNzKG0sIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuQ21kLlNZTjpcclxuICAgICAgICAgICAgICAgICAgICByID0gc3VjY2VzcyhtLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgSW5kaXNNUV9nZW5lcmF0ZWRfMS5JbmRpc01RLkNtZC5VTlNVQjpcclxuICAgICAgICAgICAgICAgICAgICBkZWxTdWJzY3JpYmVyKG0uZmllbGRzLkZyb20oKSwgbS5maWVsZHMuUGF0aCgpKTtcclxuICAgICAgICAgICAgICAgICAgICByID0gc3VjY2VzcyhtLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgciA9IGVycihtLCBcInVuc3VwcG9ydGVkIENNRFwiLCBJbmRpc01RX2dlbmVyYXRlZF8xLkluZGlzTVEuRXJyLklOVkFMSUQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAobS5maWVsZHMuTXNnSWQoKSBpbiBtZXNzYWdlcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGltcSA9IG1lc3NhZ2VzW20uZmllbGRzLk1zZ0lkKCldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGltcS5jYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIGltcS5jYWxsYmFjayhtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRlbE1lc3NhZ2UobS5maWVsZHMuTXNnSWQoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBzZXROYW1lKG5ld05hbWUpIHtcclxuICAgICAgICBuYW1lID0gbmV3TmFtZTtcclxuICAgIH1cclxuICAgIGltcV8xLnNldE5hbWUgPSBzZXROYW1lO1xyXG4gICAgZnVuY3Rpb24gbmV3VUlEKCkge1xyXG4gICAgICAgIHZhciB0ZXh0ID0gXCIgXCI7XHJcbiAgICAgICAgdmFyIGNoYXJzZXQgPSBcImFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OVwiO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKylcclxuICAgICAgICAgICAgdGV4dCArPSBjaGFyc2V0LmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFyc2V0Lmxlbmd0aCkpO1xyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgfVxyXG59KShpbXEgPSBleHBvcnRzLmltcSB8fCAoZXhwb3J0cy5pbXEgPSB7fSkpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIGluZGlzTVFfMSA9IHJlcXVpcmUoXCIuL2luZGlzTVFcIik7XHJcbnZhciB0ID0gaW5kaXNNUV8xLmltcS5yZXEoXCJcIiwgXCJcIiwgbnVsbCwgbnVsbCk7XHJcbmNvbnNvbGUubG9nKHQuZmllbGRzLk1zZ0lkKCkpO1xyXG5jb25zb2xlLmxvZyhcInN0aWxsIG1hZGUgaXRcIik7XHJcbmluZGlzTVFfMS5pbXEuc2V0TmFtZShcImJyb3dzZXJcIik7XHJcbmluZGlzTVFfMS5pbXEuc2V0SGFuZGxlcihcIi93aGF0XCIsIGZ1bmN0aW9uIChtKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInNheSB3aGF0XCIpO1xyXG4gICAgcmV0dXJuIGluZGlzTVFfMS5pbXEuc3VjY2VzcyhtLCBcImdvdCBpdFwiKTtcclxufSk7XHJcbnZhciB3cyA9IG5ldyBXZWJTb2NrZXQoXCJ3czovL2xvY2FsaG9zdDo3MDAwL3Rlc3RcIik7XHJcbndzLmJpbmFyeVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XHJcbndzLm9ub3BlbiA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgdmFyIG1zZyA9IGluZGlzTVFfMS5pbXEucmVxKFwiXCIsIFwiL1wiLCBcImhleSBidWRkeVwiLCBudWxsKTtcclxuICAgIHdzLnNlbmQobXNnLmRhdGEpO1xyXG4gICAgdmFyIHN1YiA9IGluZGlzTVFfMS5pbXEuc3ViKFwiL2hlbGxvXCIsIGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJuZXcgbWVzc2FnZSBvbiBoZWxsbyBcIiArIG0uZmllbGRzLkZyb20oKSArIFwiIHNheXMgXCIgKyBiaW4yc3RyaW5nKG0uZmllbGRzLkJvZHlBcnJheSgpKSk7XHJcbiAgICAgICAgcmV0dXJuIGluZGlzTVFfMS5pbXEuc3VjY2VzcyhtLCBcIndvb2hvb1wiKTtcclxuICAgIH0sIGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJjYWxsYmFjayBjYWxsZWRcIik7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9KTtcclxuICAgIHdzLnNlbmQoc3ViLmRhdGEpO1xyXG59O1xyXG53cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIHZhciByZXBseSA9IGluZGlzTVFfMS5pbXEucmVjaWV2ZVJhd0RhdGEoZXZlbnQuZGF0YSk7XHJcbiAgICBpZiAocmVwbHkpIHtcclxuICAgICAgICB3cy5zZW5kKHJlcGx5LmRhdGEpO1xyXG4gICAgfVxyXG59O1xyXG5mdW5jdGlvbiBiaW4yc3RyaW5nKGFycmF5KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gXCJcIjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICByZXN1bHQgKz0gKFN0cmluZy5mcm9tQ2hhckNvZGUoYXJyYXlbaV0pKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuIiwiLy8gYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgYnkgdGhlIEZsYXRCdWZmZXJzIGNvbXBpbGVyLCBkbyBub3QgbW9kaWZ5XHJcblwidXNlIHN0cmljdFwiO1xyXG4vKipcclxuICogQGVudW1cclxuICovXHJcbnZhciBJbmRpc01RO1xyXG4oZnVuY3Rpb24gKEluZGlzTVEpIHtcclxuICAgIChmdW5jdGlvbiAoTXNnVHlwZSkge1xyXG4gICAgICAgIE1zZ1R5cGVbTXNnVHlwZVtcIk5PTkVcIl0gPSAwXSA9IFwiTk9ORVwiO1xyXG4gICAgICAgIE1zZ1R5cGVbTXNnVHlwZVtcIlBFRVJcIl0gPSAxXSA9IFwiUEVFUlwiO1xyXG4gICAgICAgIE1zZ1R5cGVbTXNnVHlwZVtcIk1VTFRcIl0gPSAyXSA9IFwiTVVMVFwiO1xyXG4gICAgICAgIE1zZ1R5cGVbTXNnVHlwZVtcIlFVRVVFXCJdID0gM10gPSBcIlFVRVVFXCI7XHJcbiAgICAgICAgTXNnVHlwZVtNc2dUeXBlW1wiQ01EXCJdID0gNF0gPSBcIkNNRFwiO1xyXG4gICAgfSkoSW5kaXNNUS5Nc2dUeXBlIHx8IChJbmRpc01RLk1zZ1R5cGUgPSB7fSkpO1xyXG4gICAgdmFyIE1zZ1R5cGUgPSBJbmRpc01RLk1zZ1R5cGU7XHJcbn0pKEluZGlzTVEgPSBleHBvcnRzLkluZGlzTVEgfHwgKGV4cG9ydHMuSW5kaXNNUSA9IHt9KSk7XHJcbi8qKlxyXG4gKiBAZW51bVxyXG4gKi9cclxuKGZ1bmN0aW9uIChJbmRpc01RKSB7XHJcbiAgICAoZnVuY3Rpb24gKENtZCkge1xyXG4gICAgICAgIENtZFtDbWRbXCJOT05FXCJdID0gMF0gPSBcIk5PTkVcIjtcclxuICAgICAgICBDbWRbQ21kW1wiU1VCXCJdID0gMV0gPSBcIlNVQlwiO1xyXG4gICAgICAgIENtZFtDbWRbXCJVTlNVQlwiXSA9IDJdID0gXCJVTlNVQlwiO1xyXG4gICAgICAgIENtZFtDbWRbXCJTWU5cIl0gPSAzXSA9IFwiU1lOXCI7XHJcbiAgICB9KShJbmRpc01RLkNtZCB8fCAoSW5kaXNNUS5DbWQgPSB7fSkpO1xyXG4gICAgdmFyIENtZCA9IEluZGlzTVEuQ21kO1xyXG59KShJbmRpc01RID0gZXhwb3J0cy5JbmRpc01RIHx8IChleHBvcnRzLkluZGlzTVEgPSB7fSkpO1xyXG4vKipcclxuICogQGVudW1cclxuICovXHJcbihmdW5jdGlvbiAoSW5kaXNNUSkge1xyXG4gICAgKGZ1bmN0aW9uIChTdHMpIHtcclxuICAgICAgICBTdHNbU3RzW1wiTk9ORVwiXSA9IDBdID0gXCJOT05FXCI7XHJcbiAgICAgICAgU3RzW1N0c1tcIkVSUk9SXCJdID0gMV0gPSBcIkVSUk9SXCI7XHJcbiAgICAgICAgU3RzW1N0c1tcIlJFUVwiXSA9IDJdID0gXCJSRVFcIjtcclxuICAgICAgICBTdHNbU3RzW1wiUkVQXCJdID0gM10gPSBcIlJFUFwiO1xyXG4gICAgICAgIFN0c1tTdHNbXCJDQU5DRUxcIl0gPSA0XSA9IFwiQ0FOQ0VMXCI7XHJcbiAgICAgICAgU3RzW1N0c1tcIlNVQ0NFU1NcIl0gPSA1XSA9IFwiU1VDQ0VTU1wiO1xyXG4gICAgfSkoSW5kaXNNUS5TdHMgfHwgKEluZGlzTVEuU3RzID0ge30pKTtcclxuICAgIHZhciBTdHMgPSBJbmRpc01RLlN0cztcclxufSkoSW5kaXNNUSA9IGV4cG9ydHMuSW5kaXNNUSB8fCAoZXhwb3J0cy5JbmRpc01RID0ge30pKTtcclxuLyoqXHJcbiAqIEBlbnVtXHJcbiAqL1xyXG4oZnVuY3Rpb24gKEluZGlzTVEpIHtcclxuICAgIChmdW5jdGlvbiAoRXJyKSB7XHJcbiAgICAgICAgRXJyW0VycltcIk5PTkVcIl0gPSAwXSA9IFwiTk9ORVwiO1xyXG4gICAgICAgIEVycltFcnJbXCJOT19IQU5ETEVSXCJdID0gMV0gPSBcIk5PX0hBTkRMRVJcIjtcclxuICAgICAgICBFcnJbRXJyW1wiSU5WQUxJRFwiXSA9IDJdID0gXCJJTlZBTElEXCI7XHJcbiAgICAgICAgRXJyW0VycltcIlJFTU9URVwiXSA9IDNdID0gXCJSRU1PVEVcIjtcclxuICAgICAgICBFcnJbRXJyW1wiVElNRU9VVFwiXSA9IDRdID0gXCJUSU1FT1VUXCI7XHJcbiAgICB9KShJbmRpc01RLkVyciB8fCAoSW5kaXNNUS5FcnIgPSB7fSkpO1xyXG4gICAgdmFyIEVyciA9IEluZGlzTVEuRXJyO1xyXG59KShJbmRpc01RID0gZXhwb3J0cy5JbmRpc01RIHx8IChleHBvcnRzLkluZGlzTVEgPSB7fSkpO1xyXG4vKipcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG4oZnVuY3Rpb24gKEluZGlzTVEpIHtcclxuICAgIHZhciBWZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIFZlcigpIHtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEB0eXBlIHtmbGF0YnVmZmVycy5CeXRlQnVmZmVyfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgdGhpcy5iYiA9IG51bGw7XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgdGhpcy5iYl9wb3MgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gaVxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnl0ZUJ1ZmZlcn0gYmJcclxuICAgICAgICAgKiBAcmV0dXJucyB7VmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFZlci5wcm90b3R5cGUuX19pbml0ID0gZnVuY3Rpb24gKGksIGJiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmJfcG9zID0gaTtcclxuICAgICAgICAgICAgdGhpcy5iYiA9IGJiO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFZlci5wcm90b3R5cGUuTWFqb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJiLnJlYWRJbnQ4KHRoaXMuYmJfcG9zKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBWZXIucHJvdG90eXBlLm11dGF0ZV9NYWpvciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5iYi5fX29mZnNldCh0aGlzLmJiX3BvcywgMCk7XHJcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJiLndyaXRlSW50OCh0aGlzLmJiX3BvcyArIG9mZnNldCwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgVmVyLnByb3RvdHlwZS5NaW5vciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmIucmVhZEludDgodGhpcy5iYl9wb3MgKyAxKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBWZXIucHJvdG90eXBlLm11dGF0ZV9NaW5vciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5iYi5fX29mZnNldCh0aGlzLmJiX3BvcywgMSk7XHJcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJiLndyaXRlSW50OCh0aGlzLmJiX3BvcyArIG9mZnNldCwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBNYWpvclxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBNaW5vclxyXG4gICAgICAgICAqIEByZXR1cm5zIHtmbGF0YnVmZmVycy5PZmZzZXR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgVmVyLmNyZWF0ZVZlciA9IGZ1bmN0aW9uIChidWlsZGVyLCBNYWpvciwgTWlub3IpIHtcclxuICAgICAgICAgICAgYnVpbGRlci5wcmVwKDEsIDIpO1xyXG4gICAgICAgICAgICBidWlsZGVyLndyaXRlSW50OChNaW5vcik7XHJcbiAgICAgICAgICAgIGJ1aWxkZXIud3JpdGVJbnQ4KE1ham9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJ1aWxkZXIub2Zmc2V0KCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgcmV0dXJuIFZlcjtcclxuICAgIH0oKSk7XHJcbiAgICBJbmRpc01RLlZlciA9IFZlcjtcclxufSkoSW5kaXNNUSA9IGV4cG9ydHMuSW5kaXNNUSB8fCAoZXhwb3J0cy5JbmRpc01RID0ge30pKTtcclxuLyoqXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuKGZ1bmN0aW9uIChJbmRpc01RKSB7XHJcbiAgICB2YXIgSW1xID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmdW5jdGlvbiBJbXEoKSB7XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBAdHlwZSB7ZmxhdGJ1ZmZlcnMuQnl0ZUJ1ZmZlcn1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHRoaXMuYmIgPSBudWxsO1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHRoaXMuYmJfcG9zID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGlcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLkJ5dGVCdWZmZXJ9IGJiXHJcbiAgICAgICAgICogQHJldHVybnMge0ltcX1cclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEucHJvdG90eXBlLl9faW5pdCA9IGZ1bmN0aW9uIChpLCBiYikge1xyXG4gICAgICAgICAgICB0aGlzLmJiX3BvcyA9IGk7XHJcbiAgICAgICAgICAgIHRoaXMuYmIgPSBiYjtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5CeXRlQnVmZmVyfSBiYlxyXG4gICAgICAgICAqIEBwYXJhbSB7SW1xPX0gb2JqXHJcbiAgICAgICAgICogQHJldHVybnMge0ltcX1cclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEuZ2V0Um9vdEFzSW1xID0gZnVuY3Rpb24gKGJiLCBvYmopIHtcclxuICAgICAgICAgICAgcmV0dXJuIChvYmogfHwgbmV3IEltcSkuX19pbml0KGJiLnJlYWRJbnQzMihiYi5wb3NpdGlvbigpKSArIGJiLnBvc2l0aW9uKCksIGJiKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLkJ5dGVCdWZmZXJ9IGJiXHJcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLmJ1ZmZlckhhc0lkZW50aWZpZXIgPSBmdW5jdGlvbiAoYmIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJiLl9faGFzX2lkZW50aWZpZXIoJzAwMDEnKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcclxuICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5wcm90b3R5cGUuQm9keSA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5iYi5fX29mZnNldCh0aGlzLmJiX3BvcywgNCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvZmZzZXQgPyB0aGlzLmJiLnJlYWRVaW50OCh0aGlzLmJiLl9fdmVjdG9yKHRoaXMuYmJfcG9zICsgb2Zmc2V0KSArIGluZGV4KSA6IDA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEucHJvdG90eXBlLkJvZHlMZW5ndGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCA0KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9mZnNldCA/IHRoaXMuYmIuX192ZWN0b3JfbGVuKHRoaXMuYmJfcG9zICsgb2Zmc2V0KSA6IDA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHJldHVybnMge1VpbnQ4QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLnByb3RvdHlwZS5Cb2R5QXJyYXkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCA0KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9mZnNldCA/IG5ldyBVaW50OEFycmF5KHRoaXMuYmIuYnl0ZXMoKS5idWZmZXIsIHRoaXMuYmIuX192ZWN0b3IodGhpcy5iYl9wb3MgKyBvZmZzZXQpLCB0aGlzLmJiLl9fdmVjdG9yX2xlbih0aGlzLmJiX3BvcyArIG9mZnNldCkpIDogbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICBJbXEucHJvdG90eXBlLkZyb20gPSBmdW5jdGlvbiAob3B0aW9uYWxFbmNvZGluZykge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5iYi5fX29mZnNldCh0aGlzLmJiX3BvcywgNik7XHJcbiAgICAgICAgICAgIHJldHVybiBvZmZzZXQgPyB0aGlzLmJiLl9fc3RyaW5nKHRoaXMuYmJfcG9zICsgb2Zmc2V0LCBvcHRpb25hbEVuY29kaW5nKSA6IG51bGw7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgSW1xLnByb3RvdHlwZS5UbyA9IGZ1bmN0aW9uIChvcHRpb25hbEVuY29kaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCA4KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9mZnNldCA/IHRoaXMuYmIuX19zdHJpbmcodGhpcy5iYl9wb3MgKyBvZmZzZXQsIG9wdGlvbmFsRW5jb2RpbmcpIDogbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEucHJvdG90eXBlLkJyb2tlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuYmIuX19vZmZzZXQodGhpcy5iYl9wb3MsIDEwKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9mZnNldCA/ICEhdGhpcy5iYi5yZWFkSW50OCh0aGlzLmJiX3BvcyArIG9mZnNldCkgOiBmYWxzZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlXHJcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLnByb3RvdHlwZS5tdXRhdGVfQnJva2VyID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCAxMCk7XHJcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJiLndyaXRlSW50OCh0aGlzLmJiX3BvcyArIG9mZnNldCwgK3ZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7SW5kaXNNUS5DbWR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLnByb3RvdHlwZS5DbWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCAxMik7XHJcbiAgICAgICAgICAgIHJldHVybiBvZmZzZXQgPyAodGhpcy5iYi5yZWFkSW50OCh0aGlzLmJiX3BvcyArIG9mZnNldCkpIDogSW5kaXNNUS5DbWQuTk9ORTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge0luZGlzTVEuQ21kfSB2YWx1ZVxyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5wcm90b3R5cGUubXV0YXRlX0NtZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5iYi5fX29mZnNldCh0aGlzLmJiX3BvcywgMTIpO1xyXG4gICAgICAgICAgICBpZiAob2Zmc2V0ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5iYi53cml0ZUludDgodGhpcy5iYl9wb3MgKyBvZmZzZXQsIHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBJbXEucHJvdG90eXBlLk1zZ0lkID0gZnVuY3Rpb24gKG9wdGlvbmFsRW5jb2RpbmcpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuYmIuX19vZmZzZXQodGhpcy5iYl9wb3MsIDE0KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9mZnNldCA/IHRoaXMuYmIuX19zdHJpbmcodGhpcy5iYl9wb3MgKyBvZmZzZXQsIG9wdGlvbmFsRW5jb2RpbmcpIDogbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7SW5kaXNNUS5Nc2dUeXBlfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5wcm90b3R5cGUuTXNnVHlwZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuYmIuX19vZmZzZXQodGhpcy5iYl9wb3MsIDE2KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9mZnNldCA/ICh0aGlzLmJiLnJlYWRJbnQ4KHRoaXMuYmJfcG9zICsgb2Zmc2V0KSkgOiBJbmRpc01RLk1zZ1R5cGUuTk9ORTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge0luZGlzTVEuTXNnVHlwZX0gdmFsdWVcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEucHJvdG90eXBlLm11dGF0ZV9Nc2dUeXBlID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCAxNik7XHJcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJiLndyaXRlSW50OCh0aGlzLmJiX3BvcyArIG9mZnNldCwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtJbmRpc01RLlN0c31cclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEucHJvdG90eXBlLlN0cyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuYmIuX19vZmZzZXQodGhpcy5iYl9wb3MsIDE4KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9mZnNldCA/ICh0aGlzLmJiLnJlYWRJbnQ4KHRoaXMuYmJfcG9zICsgb2Zmc2V0KSkgOiBJbmRpc01RLlN0cy5OT05FO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7SW5kaXNNUS5TdHN9IHZhbHVlXHJcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLnByb3RvdHlwZS5tdXRhdGVfU3RzID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCAxOCk7XHJcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJiLndyaXRlSW50OCh0aGlzLmJiX3BvcyArIG9mZnNldCwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIEltcS5wcm90b3R5cGUuUGF0aCA9IGZ1bmN0aW9uIChvcHRpb25hbEVuY29kaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCAyMCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvZmZzZXQgPyB0aGlzLmJiLl9fc3RyaW5nKHRoaXMuYmJfcG9zICsgb2Zmc2V0LCBvcHRpb25hbEVuY29kaW5nKSA6IG51bGw7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHJldHVybnMge0luZGlzTVEuRXJyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5wcm90b3R5cGUuRXJyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5iYi5fX29mZnNldCh0aGlzLmJiX3BvcywgMjIpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2Zmc2V0ID8gKHRoaXMuYmIucmVhZEludDgodGhpcy5iYl9wb3MgKyBvZmZzZXQpKSA6IEluZGlzTVEuRXJyLk5PTkU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtJbmRpc01RLkVycn0gdmFsdWVcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEucHJvdG90eXBlLm11dGF0ZV9FcnIgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuYmIuX19vZmZzZXQodGhpcy5iYl9wb3MsIDIyKTtcclxuICAgICAgICAgICAgaWYgKG9mZnNldCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYmIud3JpdGVJbnQ4KHRoaXMuYmJfcG9zICsgb2Zmc2V0LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgSW1xLnByb3RvdHlwZS5TdHNNc2cgPSBmdW5jdGlvbiAob3B0aW9uYWxFbmNvZGluZykge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5iYi5fX29mZnNldCh0aGlzLmJiX3BvcywgMjQpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2Zmc2V0ID8gdGhpcy5iYi5fX3N0cmluZyh0aGlzLmJiX3BvcyArIG9mZnNldCwgb3B0aW9uYWxFbmNvZGluZykgOiBudWxsO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5wcm90b3R5cGUuQ2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCAyNik7XHJcbiAgICAgICAgICAgIHJldHVybiBvZmZzZXQgPyAhIXRoaXMuYmIucmVhZEludDgodGhpcy5iYl9wb3MgKyBvZmZzZXQpIDogZmFsc2U7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSB2YWx1ZVxyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5wcm90b3R5cGUubXV0YXRlX0NhbGxiYWNrID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmJiLl9fb2Zmc2V0KHRoaXMuYmJfcG9zLCAyNik7XHJcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJiLndyaXRlSW50OCh0aGlzLmJiX3BvcyArIG9mZnNldCwgK3ZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge0luZGlzTVEuVmVyPX0gb2JqXHJcbiAgICAgICAgICogQHJldHVybnMge0luZGlzTVEuVmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5wcm90b3R5cGUuVmVyID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5iYi5fX29mZnNldCh0aGlzLmJiX3BvcywgMjgpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2Zmc2V0ID8gKG9iaiB8fCBuZXcgSW5kaXNNUS5WZXIpLl9faW5pdCh0aGlzLmJiX3BvcyArIG9mZnNldCwgdGhpcy5iYikgOiBudWxsO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5zdGFydEltcSA9IGZ1bmN0aW9uIChidWlsZGVyKSB7XHJcbiAgICAgICAgICAgIGJ1aWxkZXIuc3RhcnRPYmplY3QoMTMpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fSBCb2R5T2Zmc2V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLmFkZEJvZHkgPSBmdW5jdGlvbiAoYnVpbGRlciwgQm9keU9mZnNldCkge1xyXG4gICAgICAgICAgICBidWlsZGVyLmFkZEZpZWxkT2Zmc2V0KDAsIEJvZHlPZmZzZXQsIDApO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGRhdGFcclxuICAgICAgICAgKiBAcmV0dXJucyB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5jcmVhdGVCb2R5VmVjdG9yID0gZnVuY3Rpb24gKGJ1aWxkZXIsIGRhdGEpIHtcclxuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBidWlsZGVyLnN0YXJ0VmVjdG9yKDEsIGRhdGEubGVuZ3RoLCAxKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGRhdGEubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGJ1aWxkZXIuYWRkSW50OChkYXRhW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYnVpbGRlci5lbmRWZWN0b3IoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLkJ1aWxkZXJ9IGJ1aWxkZXJcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gbnVtRWxlbXNcclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEuc3RhcnRCb2R5VmVjdG9yID0gZnVuY3Rpb24gKGJ1aWxkZXIsIG51bUVsZW1zKSB7XHJcbiAgICAgICAgICAgIGJ1aWxkZXIuc3RhcnRWZWN0b3IoMSwgbnVtRWxlbXMsIDEpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fSBGcm9tT2Zmc2V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLmFkZEZyb20gPSBmdW5jdGlvbiAoYnVpbGRlciwgRnJvbU9mZnNldCkge1xyXG4gICAgICAgICAgICBidWlsZGVyLmFkZEZpZWxkT2Zmc2V0KDEsIEZyb21PZmZzZXQsIDApO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fSBUb09mZnNldFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5hZGRUbyA9IGZ1bmN0aW9uIChidWlsZGVyLCBUb09mZnNldCkge1xyXG4gICAgICAgICAgICBidWlsZGVyLmFkZEZpZWxkT2Zmc2V0KDIsIFRvT2Zmc2V0LCAwKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLkJ1aWxkZXJ9IGJ1aWxkZXJcclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IEJyb2tlclxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5hZGRCcm9rZXIgPSBmdW5jdGlvbiAoYnVpbGRlciwgQnJva2VyKSB7XHJcbiAgICAgICAgICAgIGJ1aWxkZXIuYWRkRmllbGRJbnQ4KDMsICtCcm9rZXIsICtmYWxzZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5CdWlsZGVyfSBidWlsZGVyXHJcbiAgICAgICAgICogQHBhcmFtIHtJbmRpc01RLkNtZH0gQ21kXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLmFkZENtZCA9IGZ1bmN0aW9uIChidWlsZGVyLCBDbWQpIHtcclxuICAgICAgICAgICAgYnVpbGRlci5hZGRGaWVsZEludDgoNCwgQ21kLCBJbmRpc01RLkNtZC5OT05FKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLkJ1aWxkZXJ9IGJ1aWxkZXJcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLk9mZnNldH0gTXNnSWRPZmZzZXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEuYWRkTXNnSWQgPSBmdW5jdGlvbiAoYnVpbGRlciwgTXNnSWRPZmZzZXQpIHtcclxuICAgICAgICAgICAgYnVpbGRlci5hZGRGaWVsZE9mZnNldCg1LCBNc2dJZE9mZnNldCwgMCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5CdWlsZGVyfSBidWlsZGVyXHJcbiAgICAgICAgICogQHBhcmFtIHtJbmRpc01RLk1zZ1R5cGV9IE1zZ1R5cGVcclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEuYWRkTXNnVHlwZSA9IGZ1bmN0aW9uIChidWlsZGVyLCBNc2dUeXBlKSB7XHJcbiAgICAgICAgICAgIGJ1aWxkZXIuYWRkRmllbGRJbnQ4KDYsIE1zZ1R5cGUsIEluZGlzTVEuTXNnVHlwZS5OT05FKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLkJ1aWxkZXJ9IGJ1aWxkZXJcclxuICAgICAgICAgKiBAcGFyYW0ge0luZGlzTVEuU3RzfSBTdHNcclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEuYWRkU3RzID0gZnVuY3Rpb24gKGJ1aWxkZXIsIFN0cykge1xyXG4gICAgICAgICAgICBidWlsZGVyLmFkZEZpZWxkSW50OCg3LCBTdHMsIEluZGlzTVEuU3RzLk5PTkUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fSBQYXRoT2Zmc2V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLmFkZFBhdGggPSBmdW5jdGlvbiAoYnVpbGRlciwgUGF0aE9mZnNldCkge1xyXG4gICAgICAgICAgICBidWlsZGVyLmFkZEZpZWxkT2Zmc2V0KDgsIFBhdGhPZmZzZXQsIDApO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7SW5kaXNNUS5FcnJ9IEVyclxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5hZGRFcnIgPSBmdW5jdGlvbiAoYnVpbGRlciwgRXJyKSB7XHJcbiAgICAgICAgICAgIGJ1aWxkZXIuYWRkRmllbGRJbnQ4KDksIEVyciwgSW5kaXNNUS5FcnIuTk9ORSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5CdWlsZGVyfSBidWlsZGVyXHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5PZmZzZXR9IFN0c01zZ09mZnNldFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5hZGRTdHNNc2cgPSBmdW5jdGlvbiAoYnVpbGRlciwgU3RzTXNnT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIGJ1aWxkZXIuYWRkRmllbGRPZmZzZXQoMTAsIFN0c01zZ09mZnNldCwgMCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5CdWlsZGVyfSBidWlsZGVyXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBDYWxsYmFja1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEltcS5hZGRDYWxsYmFjayA9IGZ1bmN0aW9uIChidWlsZGVyLCBDYWxsYmFjaykge1xyXG4gICAgICAgICAgICBidWlsZGVyLmFkZEZpZWxkSW50OCgxMSwgK0NhbGxiYWNrLCArZmFsc2UpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fSBWZXJPZmZzZXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEuYWRkVmVyID0gZnVuY3Rpb24gKGJ1aWxkZXIsIFZlck9mZnNldCkge1xyXG4gICAgICAgICAgICBidWlsZGVyLmFkZEZpZWxkU3RydWN0KDEyLCBWZXJPZmZzZXQsIDApO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEByZXR1cm5zIHtmbGF0YnVmZmVycy5PZmZzZXR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgSW1xLmVuZEltcSA9IGZ1bmN0aW9uIChidWlsZGVyKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSBidWlsZGVyLmVuZE9iamVjdCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2Zmc2V0O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuQnVpbGRlcn0gYnVpbGRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fSBvZmZzZXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBJbXEuZmluaXNoSW1xQnVmZmVyID0gZnVuY3Rpb24gKGJ1aWxkZXIsIG9mZnNldCkge1xyXG4gICAgICAgICAgICBidWlsZGVyLmZpbmlzaChvZmZzZXQsICcwMDAxJyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgcmV0dXJuIEltcTtcclxuICAgIH0oKSk7XHJcbiAgICBJbmRpc01RLkltcSA9IEltcTtcclxufSkoSW5kaXNNUSA9IGV4cG9ydHMuSW5kaXNNUSB8fCAoZXhwb3J0cy5JbmRpc01RID0ge30pKTtcclxuIiwiLy8vIEBmaWxlXHJcbi8vLyBAYWRkdG9ncm91cCBmbGF0YnVmZmVyc19qYXZhc2NyaXB0X2FwaVxyXG4vLy8gQHtcclxuLy8vIEBjb25kIEZMQVRCVUZGRVJTX0lOVEVSTkFMXHJcbi8qKlxyXG4gKiBAY29uc3RcclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxuLy92YXIgZmxhdGJ1ZmZlcnMgPSB7fTtcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8qKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtudW1iZXJ9IGhpZ2hcclxuICogQHBhcmFtIHtudW1iZXJ9IGxvd1xyXG4gKi9cclxudmFyIGZsYXRidWZmZXJzO1xyXG4oZnVuY3Rpb24gKGZsYXRidWZmZXJzKSB7XHJcbiAgICAvKipcclxuICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAqIEBjb25zdFxyXG4gICAqL1xyXG4gICAgdmFyIFNJWkVPRl9TSE9SVCA9IDI7XHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKiBAY29uc3RcclxuICAgICAqL1xyXG4gICAgdmFyIFNJWkVPRl9JTlQgPSA0O1xyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICogQGNvbnN0XHJcbiAgICAgKi9cclxuICAgIHZhciBGSUxFX0lERU5USUZJRVJfTEVOR1RIID0gNDtcclxuICAgIC8qKlxyXG4gICAgICogQGVudW0ge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgKGZ1bmN0aW9uIChFbmNvZGluZykge1xyXG4gICAgICAgIEVuY29kaW5nW0VuY29kaW5nW1wiVVRGOF9CWVRFU1wiXSA9IDFdID0gXCJVVEY4X0JZVEVTXCI7XHJcbiAgICAgICAgRW5jb2RpbmdbRW5jb2RpbmdbXCJVVEYxNl9TVFJJTkdcIl0gPSAyXSA9IFwiVVRGMTZfU1RSSU5HXCI7XHJcbiAgICB9KShmbGF0YnVmZmVycy5FbmNvZGluZyB8fCAoZmxhdGJ1ZmZlcnMuRW5jb2RpbmcgPSB7fSkpO1xyXG4gICAgdmFyIEVuY29kaW5nID0gZmxhdGJ1ZmZlcnMuRW5jb2Rpbmc7XHJcbiAgICA7XHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtJbnQzMkFycmF5fVxyXG4gICAgICogQGNvbnN0XHJcbiAgICAgKi9cclxuICAgIHZhciBpbnQzMiA9IG5ldyBJbnQzMkFycmF5KDIpO1xyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7RmxvYXQzMkFycmF5fVxyXG4gICAgICogQGNvbnN0XHJcbiAgICAgKi9cclxuICAgIHZhciBmbG9hdDMyID0gbmV3IEZsb2F0MzJBcnJheShpbnQzMi5idWZmZXIpO1xyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7RmxvYXQ2NEFycmF5fVxyXG4gICAgICogQGNvbnN0XHJcbiAgICAgKi9cclxuICAgIHZhciBmbG9hdDY0ID0gbmV3IEZsb2F0NjRBcnJheShpbnQzMi5idWZmZXIpO1xyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqIEBjb25zdFxyXG4gICAgICovXHJcbiAgICB2YXIgaXNMaXR0bGVFbmRpYW4gPSBuZXcgVWludDE2QXJyYXkobmV3IFVpbnQ4QXJyYXkoWzEsIDBdKS5idWZmZXIpWzBdID09PSAxO1xyXG4gICAgLyoqXHJcbiAgICogQHR5cGVkZWYge3tcclxuICAgKiAgIGJiOiBmbGF0YnVmZmVycy5CeXRlQnVmZmVyLFxyXG4gICAqICAgYmJfcG9zOiBudW1iZXJcclxuICAgKiB9fVxyXG4gICAqL1xyXG4gICAgdmFyIFRhYmxlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmdW5jdGlvbiBUYWJsZSgpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFRhYmxlO1xyXG4gICAgfSgpKTtcclxuICAgIGZsYXRidWZmZXJzLlRhYmxlID0gVGFibGU7XHJcbiAgICA7XHJcbiAgICB2YXIgTG9uZyA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gTG9uZyhsb3csIGhpZ2gpIHtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICAgICAqIEBjb25zdFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgdGhpcy5sb3cgPSBsb3cgfCAwO1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgICAgICogQGNvbnN0XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICB0aGlzLmhpZ2ggPSBoaWdoIHwgMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoaWdoXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGxvd1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtmbGF0YnVmZmVycy5Mb25nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIExvbmcuY3JlYXRlID0gZnVuY3Rpb24gKGxvdywgaGlnaCkge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsLWNhc2UgemVybyB0byBhdm9pZCBHQyBvdmVyaGVhZCBmb3IgZGVmYXVsdCB2YWx1ZXNcclxuICAgICAgICAgICAgcmV0dXJuIGxvdyA9PSAwICYmIGhpZ2ggPT0gMCA/IExvbmcuWkVSTyA6IG5ldyBmbGF0YnVmZmVycy5Mb25nKGxvdywgaGlnaCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBMb25nLnByb3RvdHlwZS50b0Zsb2F0NjQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvdyArIHRoaXMuaGlnaCAqIDB4MTAwMDAwMDAwO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuTG9uZ30gb3RoZXJcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBMb25nLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAob3RoZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG93ID09IG90aGVyLmxvdyAmJiB0aGlzLmhpZ2ggPT0gb3RoZXIuaGlnaDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICByZXR1cm4gTG9uZztcclxuICAgIH0oKSk7XHJcbiAgICBmbGF0YnVmZmVycy5Mb25nID0gTG9uZztcclxuICAgIChmdW5jdGlvbiAoTG9uZykge1xyXG4gICAgICAgIExvbmcuWkVSTyA9IG5ldyBmbGF0YnVmZmVycy5Mb25nKDAsIDApO1xyXG4gICAgfSkoTG9uZyA9IGZsYXRidWZmZXJzLkxvbmcgfHwgKGZsYXRidWZmZXJzLkxvbmcgPSB7fSkpO1xyXG4gICAgLy8vIEBlbmRjb25kXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBGbGF0QnVmZmVyQnVpbGRlci5cclxuICAgICAqXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gaW5pdGlhbF9zaXplXHJcbiAgICAgKi9cclxuICAgIHZhciBCdWlsZGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmdW5jdGlvbiBCdWlsZGVyKGluaXRpYWxfc2l6ZSkge1xyXG4gICAgICAgICAgICBpZiAoIWluaXRpYWxfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgaW5pdGlhbF9zaXplID0gMTAyNDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQHR5cGUge2ZsYXRidWZmZXJzLkJ5dGVCdWZmZXJ9XHJcbiAgICAgICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICB0aGlzLmJiID0gQnl0ZUJ1ZmZlci5hbGxvY2F0ZShpbml0aWFsX3NpemUpO1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogUmVtYWluaW5nIHNwYWNlIGluIHRoZSBCeXRlQnVmZmVyLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgdGhpcy5zcGFjZSA9IGluaXRpYWxfc2l6ZTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIE1pbmltdW0gYWxpZ25tZW50IGVuY291bnRlcmVkIHNvIGZhci5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgICAgICogQHByaXZhdGVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHRoaXMubWluYWxpZ24gPSAxO1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogVGhlIHZ0YWJsZSBmb3IgdGhlIGN1cnJlbnQgdGFibGUuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cclxuICAgICAgICAgICAgICogQHByaXZhdGVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHRoaXMudnRhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFRoZSBhbW91bnQgb2YgZmllbGRzIHdlJ3JlIGFjdHVhbGx5IHVzaW5nLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgdGhpcy52dGFibGVfaW5fdXNlID0gMDtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFdoZXRoZXIgd2UgYXJlIGN1cnJlbnRseSBzZXJpYWxpemluZyBhIHRhYmxlLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAgICAgICAgICogQHByaXZhdGVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHRoaXMuaXNOZXN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFN0YXJ0aW5nIG9mZnNldCBvZiB0aGUgY3VycmVudCBzdHJ1Y3QvdGFibGUuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICB0aGlzLm9iamVjdF9zdGFydCA9IDA7XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBMaXN0IG9mIG9mZnNldHMgb2YgYWxsIHZ0YWJsZXMuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cclxuICAgICAgICAgICAgICogQHByaXZhdGVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHRoaXMudnRhYmxlcyA9IFtdO1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogRm9yIHRoZSBjdXJyZW50IHZlY3RvciBiZWluZyBidWlsdC5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgICAgICogQHByaXZhdGVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHRoaXMudmVjdG9yX251bV9lbGVtcyA9IDA7XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBGYWxzZSBvbWl0cyBkZWZhdWx0IHZhbHVlcyBmcm9tIHRoZSBzZXJpYWxpemVkIGRhdGFcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICB0aGlzLmZvcmNlX2RlZmF1bHRzID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBJbiBvcmRlciB0byBzYXZlIHNwYWNlLCBmaWVsZHMgdGhhdCBhcmUgc2V0IHRvIHRoZWlyIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICAgKiBkb24ndCBnZXQgc2VyaWFsaXplZCBpbnRvIHRoZSBidWZmZXIuIEZvcmNpbmcgZGVmYXVsdHMgcHJvdmlkZXMgYVxyXG4gICAgICAgICAqIHdheSB0byBtYW51YWxseSBkaXNhYmxlIHRoaXMgb3B0aW1pemF0aW9uLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZURlZmF1bHRzIHRydWUgYWx3YXlzIHNlcmlhbGl6ZXMgZGVmYXVsdCB2YWx1ZXNcclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS5mb3JjZURlZmF1bHRzID0gZnVuY3Rpb24gKGZvcmNlRGVmYXVsdHMpIHtcclxuICAgICAgICAgICAgdGhpcy5mb3JjZV9kZWZhdWx0cyA9IGZvcmNlRGVmYXVsdHM7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogR2V0IHRoZSBCeXRlQnVmZmVyIHJlcHJlc2VudGluZyB0aGUgRmxhdEJ1ZmZlci4gT25seSBjYWxsIHRoaXMgYWZ0ZXIgeW91J3ZlXHJcbiAgICAgICAgICogY2FsbGVkIGZpbmlzaCgpLiBUaGUgYWN0dWFsIGRhdGEgc3RhcnRzIGF0IHRoZSBCeXRlQnVmZmVyJ3MgY3VycmVudCBwb3NpdGlvbixcclxuICAgICAgICAgKiBub3QgbmVjZXNzYXJpbHkgYXQgMC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtmbGF0YnVmZmVycy5CeXRlQnVmZmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLmRhdGFCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJiO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEdldCB0aGUgYnl0ZXMgcmVwcmVzZW50aW5nIHRoZSBGbGF0QnVmZmVyLiBPbmx5IGNhbGwgdGhpcyBhZnRlciB5b3UndmVcclxuICAgICAgICAgKiBjYWxsZWQgZmluaXNoKCkuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7VWludDhBcnJheX1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS5hc1VpbnQ4QXJyYXkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJiLmJ5dGVzKCkuc3ViYXJyYXkodGhpcy5iYi5wb3NpdGlvbigpLCB0aGlzLmJiLnBvc2l0aW9uKCkgKyB0aGlzLm9mZnNldCgpKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvLy8gQGNvbmQgRkxBVEJVRkZFUlNfSU5URVJOQUxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBQcmVwYXJlIHRvIHdyaXRlIGFuIGVsZW1lbnQgb2YgYHNpemVgIGFmdGVyIGBhZGRpdGlvbmFsX2J5dGVzYCBoYXZlIGJlZW5cclxuICAgICAgICAgKiB3cml0dGVuLCBlLmcuIGlmIHlvdSB3cml0ZSBhIHN0cmluZywgeW91IG5lZWQgdG8gYWxpZ24gc3VjaCB0aGUgaW50IGxlbmd0aFxyXG4gICAgICAgICAqIGZpZWxkIGlzIGFsaWduZWQgdG8gNCBieXRlcywgYW5kIHRoZSBzdHJpbmcgZGF0YSBmb2xsb3dzIGl0IGRpcmVjdGx5LiBJZiBhbGxcclxuICAgICAgICAgKiB5b3UgbmVlZCB0byBkbyBpcyBhbGlnbm1lbnQsIGBhZGRpdGlvbmFsX2J5dGVzYCB3aWxsIGJlIDAuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gc2l6ZSBUaGlzIGlzIHRoZSBvZiB0aGUgbmV3IGVsZW1lbnQgdG8gd3JpdGVcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gYWRkaXRpb25hbF9ieXRlcyBUaGUgcGFkZGluZyBzaXplXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUucHJlcCA9IGZ1bmN0aW9uIChzaXplLCBhZGRpdGlvbmFsX2J5dGVzKSB7XHJcbiAgICAgICAgICAgIC8vIFRyYWNrIHRoZSBiaWdnZXN0IHRoaW5nIHdlJ3ZlIGV2ZXIgYWxpZ25lZCB0by5cclxuICAgICAgICAgICAgaWYgKHNpemUgPiB0aGlzLm1pbmFsaWduKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmFsaWduID0gc2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBhbW91bnQgb2YgYWxpZ25tZW50IG5lZWRlZCBzdWNoIHRoYXQgYHNpemVgIGlzIHByb3Blcmx5XHJcbiAgICAgICAgICAgIC8vIGFsaWduZWQgYWZ0ZXIgYGFkZGl0aW9uYWxfYnl0ZXNgXHJcbiAgICAgICAgICAgIHZhciBhbGlnbl9zaXplID0gKCh+KHRoaXMuYmIuY2FwYWNpdHkoKSAtIHRoaXMuc3BhY2UgKyBhZGRpdGlvbmFsX2J5dGVzKSkgKyAxKSAmIChzaXplIC0gMSk7XHJcbiAgICAgICAgICAgIC8vIFJlYWxsb2NhdGUgdGhlIGJ1ZmZlciBpZiBuZWVkZWQuXHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLnNwYWNlIDwgYWxpZ25fc2l6ZSArIHNpemUgKyBhZGRpdGlvbmFsX2J5dGVzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2xkX2J1Zl9zaXplID0gdGhpcy5iYi5jYXBhY2l0eSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iYiA9IHRoaXMuZ3Jvd0J5dGVCdWZmZXIodGhpcy5iYik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNwYWNlICs9IHRoaXMuYmIuY2FwYWNpdHkoKSAtIG9sZF9idWZfc2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnBhZChhbGlnbl9zaXplKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gYnl0ZV9zaXplXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUucGFkID0gZnVuY3Rpb24gKGJ5dGVfc2l6ZSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVfc2l6ZTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJiLndyaXRlSW50OCgtLXRoaXMuc3BhY2UsIDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmIud3JpdGVJbnQ4KHRoaXMuc3BhY2UgLT0gMSwgdmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLndyaXRlSW50MTYgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5iYi53cml0ZUludDE2KHRoaXMuc3BhY2UgLT0gMiwgdmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLndyaXRlSW50MzIgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5iYi53cml0ZUludDMyKHRoaXMuc3BhY2UgLT0gNCwgdmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuTG9uZ30gdmFsdWVcclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS53cml0ZUludDY0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmIud3JpdGVJbnQ2NCh0aGlzLnNwYWNlIC09IDgsIHZhbHVlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS53cml0ZVVpbnQ4ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmIud3JpdGVVaW50OCh0aGlzLnNwYWNlIC09IDEsIHZhbHVlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS53cml0ZVVpbnQxNiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmJiLndyaXRlVWludDE2KHRoaXMuc3BhY2UgLT0gMiwgdmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLndyaXRlVWludDMyID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmIud3JpdGVVaW50MzIodGhpcy5zcGFjZSAtPSA0LCB2YWx1ZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5Mb25nfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLndyaXRlVWludDY0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmIud3JpdGVVaW50NjQodGhpcy5zcGFjZSAtPSA4LCB2YWx1ZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUud3JpdGVGbG9hdDMyID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmIud3JpdGVGbG9hdDMyKHRoaXMuc3BhY2UgLT0gNCwgdmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLndyaXRlRmxvYXQ2NCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmJiLndyaXRlRmxvYXQ2NCh0aGlzLnNwYWNlIC09IDgsIHZhbHVlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvLy8gQGVuZGNvbmRcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBZGQgYW4gYGludDhgIHRvIHRoZSBidWZmZXIsIHByb3Blcmx5IGFsaWduZWQsIGFuZCBncm93cyB0aGUgYnVmZmVyIChpZiBuZWNlc3NhcnkpLlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBUaGUgYGludDhgIHRvIGFkZCB0aGUgdGhlIGJ1ZmZlci5cclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS5hZGRJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJlcCgxLCAwKTtcclxuICAgICAgICAgICAgdGhpcy53cml0ZUludDgodmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEFkZCBhbiBgaW50MTZgIHRvIHRoZSBidWZmZXIsIHByb3Blcmx5IGFsaWduZWQsIGFuZCBncm93cyB0aGUgYnVmZmVyIChpZiBuZWNlc3NhcnkpLlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBUaGUgYGludDE2YCB0byBhZGQgdGhlIHRoZSBidWZmZXIuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuYWRkSW50MTYgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5wcmVwKDIsIDApO1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlSW50MTYodmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEFkZCBhbiBgaW50MzJgIHRvIHRoZSBidWZmZXIsIHByb3Blcmx5IGFsaWduZWQsIGFuZCBncm93cyB0aGUgYnVmZmVyIChpZiBuZWNlc3NhcnkpLlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBUaGUgYGludDMyYCB0byBhZGQgdGhlIHRoZSBidWZmZXIuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuYWRkSW50MzIgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5wcmVwKDQsIDApO1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlSW50MzIodmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEFkZCBhbiBgaW50NjRgIHRvIHRoZSBidWZmZXIsIHByb3Blcmx5IGFsaWduZWQsIGFuZCBncm93cyB0aGUgYnVmZmVyIChpZiBuZWNlc3NhcnkpLlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuTG9uZ30gdmFsdWUgVGhlIGBpbnQ2NGAgdG8gYWRkIHRoZSB0aGUgYnVmZmVyLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLmFkZEludDY0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJlcCg4LCAwKTtcclxuICAgICAgICAgICAgdGhpcy53cml0ZUludDY0KHZhbHVlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBZGQgYSBgZmxvYXQzMmAgdG8gdGhlIGJ1ZmZlciwgcHJvcGVybHkgYWxpZ25lZCwgYW5kIGdyb3dzIHRoZSBidWZmZXIgKGlmIG5lY2Vzc2FyeSkuXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFRoZSBgZmxvYXQzMmAgdG8gYWRkIHRoZSB0aGUgYnVmZmVyLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLmFkZEZsb2F0MzIgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5wcmVwKDQsIDApO1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlRmxvYXQzMih2YWx1ZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQWRkIGEgYGZsb2F0NjRgIHRvIHRoZSBidWZmZXIsIHByb3Blcmx5IGFsaWduZWQsIGFuZCBncm93cyB0aGUgYnVmZmVyIChpZiBuZWNlc3NhcnkpLlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBUaGUgYGZsb2F0NjRgIHRvIGFkZCB0aGUgdGhlIGJ1ZmZlci5cclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS5hZGRGbG9hdDY0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJlcCg4LCAwKTtcclxuICAgICAgICAgICAgdGhpcy53cml0ZUZsb2F0NjQodmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8vLyBAY29uZCBGTEFUQlVGRkVSU19JTlRFUk5BTFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2b2Zmc2V0XHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGRlZmF1bHRWYWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLmFkZEZpZWxkSW50OCA9IGZ1bmN0aW9uICh2b2Zmc2V0LCB2YWx1ZSwgZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmZvcmNlX2RlZmF1bHRzIHx8IHZhbHVlICE9IGRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRJbnQ4KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2xvdCh2b2Zmc2V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2b2Zmc2V0XHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGRlZmF1bHRWYWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLmFkZEZpZWxkSW50MTYgPSBmdW5jdGlvbiAodm9mZnNldCwgdmFsdWUsIGRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5mb3JjZV9kZWZhdWx0cyB8fCB2YWx1ZSAhPSBkZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkSW50MTYodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zbG90KHZvZmZzZXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZvZmZzZXRcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVmYXVsdFZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuYWRkRmllbGRJbnQzMiA9IGZ1bmN0aW9uICh2b2Zmc2V0LCB2YWx1ZSwgZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmZvcmNlX2RlZmF1bHRzIHx8IHZhbHVlICE9IGRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRJbnQzMih2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNsb3Qodm9mZnNldCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdm9mZnNldFxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuTG9uZ30gdmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLkxvbmd9IGRlZmF1bHRWYWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLmFkZEZpZWxkSW50NjQgPSBmdW5jdGlvbiAodm9mZnNldCwgdmFsdWUsIGRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5mb3JjZV9kZWZhdWx0cyB8fCAhdmFsdWUuZXF1YWxzKGRlZmF1bHRWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkSW50NjQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zbG90KHZvZmZzZXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZvZmZzZXRcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVmYXVsdFZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuYWRkRmllbGRGbG9hdDMyID0gZnVuY3Rpb24gKHZvZmZzZXQsIHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZm9yY2VfZGVmYXVsdHMgfHwgdmFsdWUgIT0gZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEZsb2F0MzIodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zbG90KHZvZmZzZXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZvZmZzZXRcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVmYXVsdFZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuYWRkRmllbGRGbG9hdDY0ID0gZnVuY3Rpb24gKHZvZmZzZXQsIHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZm9yY2VfZGVmYXVsdHMgfHwgdmFsdWUgIT0gZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEZsb2F0NjQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zbG90KHZvZmZzZXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZvZmZzZXRcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLk9mZnNldH0gdmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLk9mZnNldH0gZGVmYXVsdFZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuYWRkRmllbGRPZmZzZXQgPSBmdW5jdGlvbiAodm9mZnNldCwgdmFsdWUsIGRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5mb3JjZV9kZWZhdWx0cyB8fCB2YWx1ZSAhPSBkZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkT2Zmc2V0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2xvdCh2b2Zmc2V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFN0cnVjdHMgYXJlIHN0b3JlZCBpbmxpbmUsIHNvIG5vdGhpbmcgYWRkaXRpb25hbCBpcyBiZWluZyBhZGRlZC4gYGRgIGlzIGFsd2F5cyAwLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZvZmZzZXRcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLk9mZnNldH0gdmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLk9mZnNldH0gZGVmYXVsdFZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuYWRkRmllbGRTdHJ1Y3QgPSBmdW5jdGlvbiAodm9mZnNldCwgdmFsdWUsIGRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5lc3RlZCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNsb3Qodm9mZnNldCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTdHJ1Y3R1cmVzIGFyZSBhbHdheXMgc3RvcmVkIGlubGluZSwgdGhleSBuZWVkIHRvIGJlIGNyZWF0ZWQgcmlnaHRcclxuICAgICAgICAgKiB3aGVyZSB0aGV5J3JlIHVzZWQuICBZb3UnbGwgZ2V0IHRoaXMgYXNzZXJ0aW9uIGZhaWx1cmUgaWYgeW91XHJcbiAgICAgICAgICogY3JlYXRlZCBpdCBlbHNld2hlcmUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLk9mZnNldH0gb2JqIFRoZSBvZmZzZXQgb2YgdGhlIGNyZWF0ZWQgb2JqZWN0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUubmVzdGVkID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICBpZiAob2JqICE9IHRoaXMub2Zmc2V0KCkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmxhdEJ1ZmZlcnM6IHN0cnVjdCBtdXN0IGJlIHNlcmlhbGl6ZWQgaW5saW5lLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU2hvdWxkIG5vdCBiZSBjcmVhdGluZyBhbnkgb3RoZXIgb2JqZWN0LCBzdHJpbmcgb3IgdmVjdG9yXHJcbiAgICAgICAgICogd2hpbGUgYW4gb2JqZWN0IGlzIGJlaW5nIGNvbnN0cnVjdGVkXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUubm90TmVzdGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc05lc3RlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGbGF0QnVmZmVyczogb2JqZWN0IHNlcmlhbGl6YXRpb24gbXVzdCBub3QgYmUgbmVzdGVkLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU2V0IHRoZSBjdXJyZW50IHZ0YWJsZSBhdCBgdm9mZnNldGAgdG8gdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGJ1ZmZlci5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2b2Zmc2V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuc2xvdCA9IGZ1bmN0aW9uICh2b2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIHRoaXMudnRhYmxlW3ZvZmZzZXRdID0gdGhpcy5vZmZzZXQoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fSBPZmZzZXQgcmVsYXRpdmUgdG8gdGhlIGVuZCBvZiB0aGUgYnVmZmVyLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLm9mZnNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmIuY2FwYWNpdHkoKSAtIHRoaXMuc3BhY2U7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRG91YmxlcyB0aGUgc2l6ZSBvZiB0aGUgYmFja2luZyBCeXRlQnVmZmVyIGFuZCBjb3BpZXMgdGhlIG9sZCBkYXRhIHRvd2FyZHNcclxuICAgICAgICAgKiB0aGUgZW5kIG9mIHRoZSBuZXcgYnVmZmVyIChzaW5jZSB3ZSBidWlsZCB0aGUgYnVmZmVyIGJhY2t3YXJkcykuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLkJ5dGVCdWZmZXJ9IGJiIFRoZSBjdXJyZW50IGJ1ZmZlciB3aXRoIHRoZSBleGlzdGluZyBkYXRhXHJcbiAgICAgICAgICogQHJldHVybnMge2ZsYXRidWZmZXJzLkJ5dGVCdWZmZXJ9IEEgbmV3IGJ5dGUgYnVmZmVyIHdpdGggdGhlIG9sZCBkYXRhIGNvcGllZFxyXG4gICAgICAgICAqIHRvIGl0LiBUaGUgZGF0YSBpcyBsb2NhdGVkIGF0IHRoZSBlbmQgb2YgdGhlIGJ1ZmZlci5cclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS5ncm93Qnl0ZUJ1ZmZlciA9IGZ1bmN0aW9uIChiYikge1xyXG4gICAgICAgICAgICB2YXIgb2xkX2J1Zl9zaXplID0gYmIuY2FwYWNpdHkoKTtcclxuICAgICAgICAgICAgLy8gRW5zdXJlIHdlIGRvbid0IGdyb3cgYmV5b25kIHdoYXQgZml0cyBpbiBhbiBpbnQuXHJcbiAgICAgICAgICAgIGlmIChvbGRfYnVmX3NpemUgJiAweEMwMDAwMDAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZsYXRCdWZmZXJzOiBjYW5ub3QgZ3JvdyBidWZmZXIgYmV5b25kIDIgZ2lnYWJ5dGVzLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBuZXdfYnVmX3NpemUgPSBvbGRfYnVmX3NpemUgPDwgMTtcclxuICAgICAgICAgICAgdmFyIG5iYiA9IEJ5dGVCdWZmZXIuYWxsb2NhdGUobmV3X2J1Zl9zaXplKTtcclxuICAgICAgICAgICAgbmJiLnNldFBvc2l0aW9uKG5ld19idWZfc2l6ZSAtIG9sZF9idWZfc2l6ZSk7XHJcbiAgICAgICAgICAgIG5iYi5ieXRlcygpLnNldChiYi5ieXRlcygpLCBuZXdfYnVmX3NpemUgLSBvbGRfYnVmX3NpemUpO1xyXG4gICAgICAgICAgICByZXR1cm4gbmJiO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8vLyBAZW5kY29uZFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEFkZHMgb24gb2Zmc2V0LCByZWxhdGl2ZSB0byB3aGVyZSBpdCB3aWxsIGJlIHdyaXR0ZW4uXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge2ZsYXRidWZmZXJzLk9mZnNldH0gb2Zmc2V0IFRoZSBvZmZzZXQgdG8gYWRkLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLmFkZE9mZnNldCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcclxuICAgICAgICAgICAgdGhpcy5wcmVwKFNJWkVPRl9JTlQsIDApOyAvLyBFbnN1cmUgYWxpZ25tZW50IGlzIGFscmVhZHkgZG9uZS5cclxuICAgICAgICAgICAgdGhpcy53cml0ZUludDMyKHRoaXMub2Zmc2V0KCkgLSBvZmZzZXQgKyBTSVpFT0ZfSU5UKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvLy8gQGNvbmQgRkxBVEJVRkZFUlNfSU5URVJOQUxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTdGFydCBlbmNvZGluZyBhIG5ldyBvYmplY3QgaW4gdGhlIGJ1ZmZlci4gIFVzZXJzIHdpbGwgbm90IHVzdWFsbHkgbmVlZCB0b1xyXG4gICAgICAgICAqIGNhbGwgdGhpcyBkaXJlY3RseS4gVGhlIEZsYXRCdWZmZXJzIGNvbXBpbGVyIHdpbGwgZ2VuZXJhdGUgaGVscGVyIG1ldGhvZHNcclxuICAgICAgICAgKiB0aGF0IGNhbGwgdGhpcyBtZXRob2QgaW50ZXJuYWxseS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBudW1maWVsZHNcclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS5zdGFydE9iamVjdCA9IGZ1bmN0aW9uIChudW1maWVsZHMpIHtcclxuICAgICAgICAgICAgdGhpcy5ub3ROZXN0ZWQoKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMudnRhYmxlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudnRhYmxlID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy52dGFibGVfaW5fdXNlID0gbnVtZmllbGRzO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWZpZWxkczsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZ0YWJsZVtpXSA9IDA7IC8vIFRoaXMgd2lsbCBwdXNoIGFkZGl0aW9uYWwgZWxlbWVudHMgYXMgbmVlZGVkXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5pc05lc3RlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMub2JqZWN0X3N0YXJ0ID0gdGhpcy5vZmZzZXQoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBGaW5pc2ggb2ZmIHdyaXRpbmcgdGhlIG9iamVjdCB0aGF0IGlzIHVuZGVyIGNvbnN0cnVjdGlvbi5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtmbGF0YnVmZmVycy5PZmZzZXR9IFRoZSBvZmZzZXQgdG8gdGhlIG9iamVjdCBpbnNpZGUgYGRhdGFCdWZmZXJgXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuZW5kT2JqZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy52dGFibGUgPT0gbnVsbCB8fCAhdGhpcy5pc05lc3RlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGbGF0QnVmZmVyczogZW5kT2JqZWN0IGNhbGxlZCB3aXRob3V0IHN0YXJ0T2JqZWN0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hZGRJbnQzMigwKTtcclxuICAgICAgICAgICAgdmFyIHZ0YWJsZWxvYyA9IHRoaXMub2Zmc2V0KCk7XHJcbiAgICAgICAgICAgIC8vIFdyaXRlIG91dCB0aGUgY3VycmVudCB2dGFibGUuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLnZ0YWJsZV9pbl91c2UgLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgLy8gT2Zmc2V0IHJlbGF0aXZlIHRvIHRoZSBzdGFydCBvZiB0aGUgdGFibGUuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEludDE2KHRoaXMudnRhYmxlW2ldICE9IDAgPyB2dGFibGVsb2MgLSB0aGlzLnZ0YWJsZVtpXSA6IDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBzdGFuZGFyZF9maWVsZHMgPSAyOyAvLyBUaGUgZmllbGRzIGJlbG93OlxyXG4gICAgICAgICAgICB0aGlzLmFkZEludDE2KHZ0YWJsZWxvYyAtIHRoaXMub2JqZWN0X3N0YXJ0KTtcclxuICAgICAgICAgICAgdGhpcy5hZGRJbnQxNigodGhpcy52dGFibGVfaW5fdXNlICsgc3RhbmRhcmRfZmllbGRzKSAqIFNJWkVPRl9TSE9SVCk7XHJcbiAgICAgICAgICAgIC8vIFNlYXJjaCBmb3IgYW4gZXhpc3RpbmcgdnRhYmxlIHRoYXQgbWF0Y2hlcyB0aGUgY3VycmVudCBvbmUuXHJcbiAgICAgICAgICAgIHZhciBleGlzdGluZ192dGFibGUgPSAwO1xyXG4gICAgICAgICAgICBvdXRlcl9sb29wOiBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudnRhYmxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZ0MSA9IHRoaXMuYmIuY2FwYWNpdHkoKSAtIHRoaXMudnRhYmxlc1tpXTtcclxuICAgICAgICAgICAgICAgIHZhciB2dDIgPSB0aGlzLnNwYWNlO1xyXG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IHRoaXMuYmIucmVhZEludDE2KHZ0MSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGVuID09IHRoaXMuYmIucmVhZEludDE2KHZ0MikpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gU0laRU9GX1NIT1JUOyBqIDwgbGVuOyBqICs9IFNJWkVPRl9TSE9SVCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5iYi5yZWFkSW50MTYodnQxICsgaikgIT0gdGhpcy5iYi5yZWFkSW50MTYodnQyICsgaikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIG91dGVyX2xvb3A7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmdfdnRhYmxlID0gdGhpcy52dGFibGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChleGlzdGluZ192dGFibGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIEZvdW5kIGEgbWF0Y2g6XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIGN1cnJlbnQgdnRhYmxlLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zcGFjZSA9IHRoaXMuYmIuY2FwYWNpdHkoKSAtIHZ0YWJsZWxvYztcclxuICAgICAgICAgICAgICAgIC8vIFBvaW50IHRhYmxlIHRvIGV4aXN0aW5nIHZ0YWJsZS5cclxuICAgICAgICAgICAgICAgIHRoaXMuYmIud3JpdGVJbnQzMih0aGlzLnNwYWNlLCBleGlzdGluZ192dGFibGUgLSB2dGFibGVsb2MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gTm8gbWF0Y2g6XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxvY2F0aW9uIG9mIHRoZSBjdXJyZW50IHZ0YWJsZSB0byB0aGUgbGlzdCBvZiB2dGFibGVzLlxyXG4gICAgICAgICAgICAgICAgdGhpcy52dGFibGVzLnB1c2godGhpcy5vZmZzZXQoKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBQb2ludCB0YWJsZSB0byBjdXJyZW50IHZ0YWJsZS5cclxuICAgICAgICAgICAgICAgIHRoaXMuYmIud3JpdGVJbnQzMih0aGlzLmJiLmNhcGFjaXR5KCkgLSB2dGFibGVsb2MsIHRoaXMub2Zmc2V0KCkgLSB2dGFibGVsb2MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaXNOZXN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZ0YWJsZWxvYztcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvLy8gQGVuZGNvbmRcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBGaW5hbGl6ZSBhIGJ1ZmZlciwgcG9pdGluZyB0byB0aGUgZ2l2ZW4gYHJvb3RfdGFibGVgLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5PZmZzZXR9IHJvb3RfdGFibGVcclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZz19IGZpbGVfaWRlbnRpZmllclxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLmZpbmlzaCA9IGZ1bmN0aW9uIChyb290X3RhYmxlLCBmaWxlX2lkZW50aWZpZXIpIHtcclxuICAgICAgICAgICAgaWYgKGZpbGVfaWRlbnRpZmllcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmVwKHRoaXMubWluYWxpZ24sIFNJWkVPRl9JTlQgK1xyXG4gICAgICAgICAgICAgICAgICAgIEZJTEVfSURFTlRJRklFUl9MRU5HVEgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGVfaWRlbnRpZmllci5sZW5ndGggIT0gRklMRV9JREVOVElGSUVSX0xFTkdUSCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmxhdEJ1ZmZlcnM6IGZpbGUgaWRlbnRpZmllciBtdXN0IGJlIGxlbmd0aCAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgRklMRV9JREVOVElGSUVSX0xFTkdUSCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gRklMRV9JREVOVElGSUVSX0xFTkdUSCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cml0ZUludDgoZmlsZV9pZGVudGlmaWVyLmNoYXJDb2RlQXQoaSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucHJlcCh0aGlzLm1pbmFsaWduLCBTSVpFT0ZfSU5UKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRPZmZzZXQocm9vdF90YWJsZSk7XHJcbiAgICAgICAgICAgIHRoaXMuYmIuc2V0UG9zaXRpb24odGhpcy5zcGFjZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLy8vIEBjb25kIEZMQVRCVUZGRVJTX0lOVEVSTkFMXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBjaGVja3MgYSByZXF1aXJlZCBmaWVsZCBoYXMgYmVlbiBzZXQgaW4gYSBnaXZlbiB0YWJsZSB0aGF0IGhhc1xyXG4gICAgICAgICAqIGp1c3QgYmVlbiBjb25zdHJ1Y3RlZC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fSB0YWJsZVxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmaWVsZFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLnJlcXVpcmVkRmllbGQgPSBmdW5jdGlvbiAodGFibGUsIGZpZWxkKSB7XHJcbiAgICAgICAgICAgIHZhciB0YWJsZV9zdGFydCA9IHRoaXMuYmIuY2FwYWNpdHkoKSAtIHRhYmxlO1xyXG4gICAgICAgICAgICB2YXIgdnRhYmxlX3N0YXJ0ID0gdGFibGVfc3RhcnQgLSB0aGlzLmJiLnJlYWRJbnQzMih0YWJsZV9zdGFydCk7XHJcbiAgICAgICAgICAgIHZhciBvayA9IHRoaXMuYmIucmVhZEludDE2KHZ0YWJsZV9zdGFydCArIGZpZWxkKSAhPSAwO1xyXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGZhaWxzLCB0aGUgY2FsbGVyIHdpbGwgc2hvdyB3aGF0IGZpZWxkIG5lZWRzIHRvIGJlIHNldC5cclxuICAgICAgICAgICAgaWYgKCFvaykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGbGF0QnVmZmVyczogZmllbGQgJyArIGZpZWxkICsgJyBtdXN0IGJlIHNldCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU3RhcnQgYSBuZXcgYXJyYXkvdmVjdG9yIG9mIG9iamVjdHMuICBVc2VycyB1c3VhbGx5IHdpbGwgbm90IGNhbGxcclxuICAgICAgICAgKiB0aGlzIGRpcmVjdGx5LiBUaGUgRmxhdEJ1ZmZlcnMgY29tcGlsZXIgd2lsbCBjcmVhdGUgYSBzdGFydC9lbmRcclxuICAgICAgICAgKiBtZXRob2QgZm9yIHZlY3RvciB0eXBlcyBpbiBnZW5lcmF0ZWQgY29kZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBlbGVtX3NpemUgVGhlIHNpemUgb2YgZWFjaCBlbGVtZW50IGluIHRoZSBhcnJheVxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBudW1fZWxlbXMgVGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiB0aGUgYXJyYXlcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gYWxpZ25tZW50IFRoZSBhbGlnbm1lbnQgb2YgdGhlIGFycmF5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnVpbGRlci5wcm90b3R5cGUuc3RhcnRWZWN0b3IgPSBmdW5jdGlvbiAoZWxlbV9zaXplLCBudW1fZWxlbXMsIGFsaWdubWVudCkge1xyXG4gICAgICAgICAgICB0aGlzLm5vdE5lc3RlZCgpO1xyXG4gICAgICAgICAgICB0aGlzLnZlY3Rvcl9udW1fZWxlbXMgPSBudW1fZWxlbXM7XHJcbiAgICAgICAgICAgIHRoaXMucHJlcChTSVpFT0ZfSU5ULCBlbGVtX3NpemUgKiBudW1fZWxlbXMpO1xyXG4gICAgICAgICAgICB0aGlzLnByZXAoYWxpZ25tZW50LCBlbGVtX3NpemUgKiBudW1fZWxlbXMpOyAvLyBKdXN0IGluIGNhc2UgYWxpZ25tZW50ID4gaW50LlxyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEZpbmlzaCBvZmYgdGhlIGNyZWF0aW9uIG9mIGFuIGFycmF5IGFuZCBhbGwgaXRzIGVsZW1lbnRzLiBUaGUgYXJyYXkgbXVzdCBiZVxyXG4gICAgICAgICAqIGNyZWF0ZWQgd2l0aCBgc3RhcnRWZWN0b3JgLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHJldHVybnMge2ZsYXRidWZmZXJzLk9mZnNldH0gVGhlIG9mZnNldCBhdCB3aGljaCB0aGUgbmV3bHkgY3JlYXRlZCBhcnJheVxyXG4gICAgICAgICAqIHN0YXJ0cy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS5lbmRWZWN0b3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMud3JpdGVJbnQzMih0aGlzLnZlY3Rvcl9udW1fZWxlbXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vZmZzZXQoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvLy8gQGVuZGNvbmRcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBFbmNvZGUgdGhlIHN0cmluZyBgc2AgaW4gdGhlIGJ1ZmZlciB1c2luZyBVVEYtOC4gSWYgYSBVaW50OEFycmF5IGlzIHBhc3NlZFxyXG4gICAgICAgICAqIGluc3RlYWQgb2YgYSBzdHJpbmcsIGl0IGlzIGFzc3VtZWQgdG8gY29udGFpbiB2YWxpZCBVVEYtOCBlbmNvZGVkIGRhdGEuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xVaW50OEFycmF5fSBzIFRoZSBzdHJpbmcgdG8gZW5jb2RlXHJcbiAgICAgICAgICogQHJldHVybiB7ZmxhdGJ1ZmZlcnMuT2Zmc2V0fSBUaGUgb2Zmc2V0IGluIHRoZSBidWZmZXIgd2hlcmUgdGhlIGVuY29kZWQgc3RyaW5nIHN0YXJ0c1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ1aWxkZXIucHJvdG90eXBlLmNyZWF0ZVN0cmluZyA9IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgICAgICAgIHZhciB1dGY4O1xyXG4gICAgICAgICAgICBpZiAocyBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIHV0ZjggPSBzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdXRmOCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPCBzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlUG9pbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRGVjb2RlIFVURi0xNlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhID0gcy5jaGFyQ29kZUF0KGkrKyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGEgPCAweEQ4MDAgfHwgYSA+PSAweERDMDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZVBvaW50ID0gYTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBiID0gcy5jaGFyQ29kZUF0KGkrKyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGVQb2ludCA9IChhIDw8IDEwKSArIGIgKyAoMHgxMDAwMCAtICgweEQ4MDAgPDwgMTApIC0gMHhEQzAwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRW5jb2RlIFVURi04XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXRmOC5wdXNoKGNvZGVQb2ludCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV0ZjgucHVzaCgoKGNvZGVQb2ludCA+PiA2KSAmIDB4MUYpIHwgMHhDMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV0ZjgucHVzaCgoKGNvZGVQb2ludCA+PiAxMikgJiAweDBGKSB8IDB4RTApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXRmOC5wdXNoKCgoY29kZVBvaW50ID4+IDE4KSAmIDB4MDcpIHwgMHhGMCwgKChjb2RlUG9pbnQgPj4gMTIpICYgMHgzRikgfCAweDgwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV0ZjgucHVzaCgoKGNvZGVQb2ludCA+PiA2KSAmIDB4M0YpIHwgMHg4MCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdXRmOC5wdXNoKChjb2RlUG9pbnQgJiAweDNGKSB8IDB4ODApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFkZEludDgoMCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRWZWN0b3IoMSwgdXRmOC5sZW5ndGgsIDEpO1xyXG4gICAgICAgICAgICB0aGlzLmJiLnNldFBvc2l0aW9uKHRoaXMuc3BhY2UgLT0gdXRmOC5sZW5ndGgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgb2Zmc2V0ID0gdGhpcy5zcGFjZSwgYnl0ZXMgPSB0aGlzLmJiLmJ5dGVzKCk7IGkgPCB1dGY4Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBieXRlc1tvZmZzZXQrK10gPSB1dGY4W2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVuZFZlY3RvcigpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgaGVscGVyIGZ1bmN0aW9uIHRvIGF2b2lkIGdlbmVyYXRlZCBjb2RlIGRlcGVuZGluZyBvbiB0aGlzIGZpbGUgZGlyZWN0bHkuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gbG93XHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGhpZ2hcclxuICAgICAgICAgKiBAcmV0dXJucyB7ZmxhdGJ1ZmZlcnMuTG9uZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICBCdWlsZGVyLnByb3RvdHlwZS5jcmVhdGVMb25nID0gZnVuY3Rpb24gKGxvdywgaGlnaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmxhdGJ1ZmZlcnMuTG9uZy5jcmVhdGUobG93LCBoaWdoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICByZXR1cm4gQnVpbGRlcjtcclxuICAgIH0oKSk7XHJcbiAgICBmbGF0YnVmZmVycy5CdWlsZGVyID0gQnVpbGRlcjtcclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLy8gQGNvbmQgRkxBVEJVRkZFUlNfSU5URVJOQUxcclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGEgbmV3IEJ5dGVCdWZmZXIgd2l0aCBhIGdpdmVuIGFycmF5IG9mIGJ5dGVzIChgVWludDhBcnJheWApLlxyXG4gICAgICpcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICogQHBhcmFtIHtVaW50OEFycmF5fSBieXRlc1xyXG4gICAgICovXHJcbiAgICB2YXIgQnl0ZUJ1ZmZlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gQnl0ZUJ1ZmZlcihieXRlcykge1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQHR5cGUge1VpbnQ4QXJyYXl9XHJcbiAgICAgICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICB0aGlzLmJ5dGVzXyA9IGJ5dGVzO1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgICAgICogQHByaXZhdGVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25fID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENyZWF0ZSBhbmQgYWxsb2NhdGUgYSBuZXcgQnl0ZUJ1ZmZlciB3aXRoIGEgZ2l2ZW4gc2l6ZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBieXRlX3NpemVcclxuICAgICAgICAgKiBAcmV0dXJucyB7ZmxhdGJ1ZmZlcnMuQnl0ZUJ1ZmZlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLmFsbG9jYXRlID0gZnVuY3Rpb24gKGJ5dGVfc2l6ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IGZsYXRidWZmZXJzLkJ5dGVCdWZmZXIobmV3IFVpbnQ4QXJyYXkoYnl0ZV9zaXplKSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogR2V0IHRoZSB1bmRlcmx5aW5nIGBVaW50OEFycmF5YC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtVaW50OEFycmF5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ5dGVCdWZmZXIucHJvdG90eXBlLmJ5dGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ieXRlc187XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogR2V0IHRoZSBidWZmZXIncyBwb3NpdGlvbi5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBvc2l0aW9uXztcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTZXQgdGhlIGJ1ZmZlcidzIHBvc2l0aW9uLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUuc2V0UG9zaXRpb24gPSBmdW5jdGlvbiAocG9zaXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbl8gPSBwb3NpdGlvbjtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXQgdGhlIGJ1ZmZlcidzIGNhcGFjaXR5LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS5jYXBhY2l0eSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYnl0ZXNfLmxlbmd0aDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhZFVpbnQ4KG9mZnNldCkgPDwgMjQgPj4gMjQ7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUucmVhZFVpbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ieXRlc19bb2Zmc2V0XTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTYgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRVaW50MTYob2Zmc2V0KSA8PCAxNiA+PiAxNjtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkVWludDE2ID0gZnVuY3Rpb24gKG9mZnNldCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ieXRlc19bb2Zmc2V0XSB8IHRoaXMuYnl0ZXNfW29mZnNldCArIDFdIDw8IDg7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyID0gZnVuY3Rpb24gKG9mZnNldCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ieXRlc19bb2Zmc2V0XSB8IHRoaXMuYnl0ZXNfW29mZnNldCArIDFdIDw8IDggfCB0aGlzLmJ5dGVzX1tvZmZzZXQgKyAyXSA8PCAxNiB8IHRoaXMuYnl0ZXNfW29mZnNldCArIDNdIDw8IDI0O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcclxuICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ5dGVCdWZmZXIucHJvdG90eXBlLnJlYWRVaW50MzIgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQzMihvZmZzZXQpID4+PiAwO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcclxuICAgICAgICAgKiBAcmV0dXJucyB7ZmxhdGJ1ZmZlcnMuTG9uZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50NjQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgZmxhdGJ1ZmZlcnMuTG9uZyh0aGlzLnJlYWRJbnQzMihvZmZzZXQpLCB0aGlzLnJlYWRJbnQzMihvZmZzZXQgKyA0KSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtmbGF0YnVmZmVycy5Mb25nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ5dGVCdWZmZXIucHJvdG90eXBlLnJlYWRVaW50NjQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgZmxhdGJ1ZmZlcnMuTG9uZyh0aGlzLnJlYWRVaW50MzIob2Zmc2V0KSwgdGhpcy5yZWFkVWludDMyKG9mZnNldCArIDQpKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXQzMiA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcclxuICAgICAgICAgICAgaW50MzJbMF0gPSB0aGlzLnJlYWRJbnQzMihvZmZzZXQpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmxvYXQzMlswXTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXQ2NCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcclxuICAgICAgICAgICAgaW50MzJbaXNMaXR0bGVFbmRpYW4gPyAwIDogMV0gPSB0aGlzLnJlYWRJbnQzMihvZmZzZXQpO1xyXG4gICAgICAgICAgICBpbnQzMltpc0xpdHRsZUVuZGlhbiA/IDEgOiAwXSA9IHRoaXMucmVhZEludDMyKG9mZnNldCArIDQpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmxvYXQ2NFswXTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5ieXRlc19bb2Zmc2V0XSA9IHZhbHVlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2ID0gZnVuY3Rpb24gKG9mZnNldCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5ieXRlc19bb2Zmc2V0XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB0aGlzLmJ5dGVzX1tvZmZzZXQgKyAxXSA9IHZhbHVlID4+IDg7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ5dGVCdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzIgPSBmdW5jdGlvbiAob2Zmc2V0LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmJ5dGVzX1tvZmZzZXRdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHRoaXMuYnl0ZXNfW29mZnNldCArIDFdID0gdmFsdWUgPj4gODtcclxuICAgICAgICAgICAgdGhpcy5ieXRlc19bb2Zmc2V0ICsgMl0gPSB2YWx1ZSA+PiAxNjtcclxuICAgICAgICAgICAgdGhpcy5ieXRlc19bb2Zmc2V0ICsgM10gPSB2YWx1ZSA+PiAyNDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5Mb25nfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ5dGVCdWZmZXIucHJvdG90eXBlLndyaXRlSW50NjQgPSBmdW5jdGlvbiAob2Zmc2V0LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlSW50MzIob2Zmc2V0LCB2YWx1ZS5sb3cpO1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlSW50MzIob2Zmc2V0ICsgNCwgdmFsdWUuaGlnaCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ5dGVCdWZmZXIucHJvdG90eXBlLndyaXRlVWludDggPSBmdW5jdGlvbiAob2Zmc2V0LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlSW50OChvZmZzZXQsIHZhbHVlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUud3JpdGVVaW50MTYgPSBmdW5jdGlvbiAob2Zmc2V0LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlSW50MTYob2Zmc2V0LCB2YWx1ZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ5dGVCdWZmZXIucHJvdG90eXBlLndyaXRlVWludDMyID0gZnVuY3Rpb24gKG9mZnNldCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy53cml0ZUludDMyKG9mZnNldCwgdmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS53cml0ZVVpbnQ2NCA9IGZ1bmN0aW9uIChvZmZzZXQsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMud3JpdGVJbnQ2NChvZmZzZXQsIHZhbHVlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdDMyID0gZnVuY3Rpb24gKG9mZnNldCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgZmxvYXQzMlswXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlSW50MzIob2Zmc2V0LCBpbnQzMlswXSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ5dGVCdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXQ2NCA9IGZ1bmN0aW9uIChvZmZzZXQsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGZsb2F0NjRbMF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgdGhpcy53cml0ZUludDMyKG9mZnNldCwgaW50MzJbaXNMaXR0bGVFbmRpYW4gPyAwIDogMV0pO1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlSW50MzIob2Zmc2V0ICsgNCwgaW50MzJbaXNMaXR0bGVFbmRpYW4gPyAxIDogMF0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIExvb2sgdXAgYSBmaWVsZCBpbiB0aGUgdnRhYmxlLCByZXR1cm4gYW4gb2Zmc2V0IGludG8gdGhlIG9iamVjdCwgb3IgMCBpZiB0aGVcclxuICAgICAgICAgKiBmaWVsZCBpcyBub3QgcHJlc2VudC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBiYl9wb3NcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdnRhYmxlX29mZnNldFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUuX19vZmZzZXQgPSBmdW5jdGlvbiAoYmJfcG9zLCB2dGFibGVfb2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIHZhciB2dGFibGUgPSBiYl9wb3MgLSB0aGlzLnJlYWRJbnQzMihiYl9wb3MpO1xyXG4gICAgICAgICAgICByZXR1cm4gdnRhYmxlX29mZnNldCA8IHRoaXMucmVhZEludDE2KHZ0YWJsZSkgPyB0aGlzLnJlYWRJbnQxNih2dGFibGUgKyB2dGFibGVfb2Zmc2V0KSA6IDA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSW5pdGlhbGl6ZSBhbnkgVGFibGUtZGVyaXZlZCB0eXBlIHRvIHBvaW50IHRvIHRoZSB1bmlvbiBhdCB0aGUgZ2l2ZW4gb2Zmc2V0LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtmbGF0YnVmZmVycy5UYWJsZX0gdFxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcclxuICAgICAgICAgKiBAcmV0dXJucyB7ZmxhdGJ1ZmZlcnMuVGFibGV9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUuX191bmlvbiA9IGZ1bmN0aW9uICh0LCBvZmZzZXQpIHtcclxuICAgICAgICAgICAgdC5iYl9wb3MgPSBvZmZzZXQgKyB0aGlzLnJlYWRJbnQzMihvZmZzZXQpO1xyXG4gICAgICAgICAgICB0LmJiID0gdGhpcztcclxuICAgICAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUuX19zdHJpbmcgPSBmdW5jdGlvbiAob2Zmc2V0LCBvcHRpb25hbEVuY29kaW5nKSB7XHJcbiAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLnJlYWRJbnQzMihvZmZzZXQpO1xyXG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5yZWFkSW50MzIob2Zmc2V0KTtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9ICcnO1xyXG4gICAgICAgICAgICB2YXIgaSA9IDA7XHJcbiAgICAgICAgICAgIG9mZnNldCArPSBTSVpFT0ZfSU5UO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9uYWxFbmNvZGluZyA9PT0gRW5jb2RpbmcuVVRGOF9CWVRFUykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYnl0ZXNfLnN1YmFycmF5KG9mZnNldCwgb2Zmc2V0ICsgbGVuZ3RoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aGlsZSAoaSA8IGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvZGVQb2ludDtcclxuICAgICAgICAgICAgICAgIC8vIERlY29kZSBVVEYtOFxyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLnJlYWRVaW50OChvZmZzZXQgKyBpKyspO1xyXG4gICAgICAgICAgICAgICAgaWYgKGEgPCAweEMwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29kZVBvaW50ID0gYTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBiID0gdGhpcy5yZWFkVWludDgob2Zmc2V0ICsgaSsrKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYSA8IDB4RTApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZVBvaW50ID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgoYSAmIDB4MUYpIDw8IDYpIHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYiAmIDB4M0YpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSB0aGlzLnJlYWRVaW50OChvZmZzZXQgKyBpKyspO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYSA8IDB4RjApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGVQb2ludCA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKChhICYgMHgwRikgPDwgMTIpIHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKChiICYgMHgzRikgPDwgNikgfFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYyAmIDB4M0YpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSB0aGlzLnJlYWRVaW50OChvZmZzZXQgKyBpKyspO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZVBvaW50ID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKGEgJiAweDA3KSA8PCAxOCkgfFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKGIgJiAweDNGKSA8PCAxMikgfFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKGMgJiAweDNGKSA8PCA2KSB8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkICYgMHgzRik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBFbmNvZGUgVVRGLTE2XHJcbiAgICAgICAgICAgICAgICBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGVQb2ludCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMDtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoY29kZVBvaW50ID4+IDEwKSArIDB4RDgwMCwgKGNvZGVQb2ludCAmICgoMSA8PCAxMCkgLSAxKSkgKyAweERDMDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0cmlldmUgdGhlIHJlbGF0aXZlIG9mZnNldCBzdG9yZWQgYXQgXCJvZmZzZXRcIlxyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcclxuICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJ5dGVCdWZmZXIucHJvdG90eXBlLl9faW5kaXJlY3QgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBvZmZzZXQgKyB0aGlzLnJlYWRJbnQzMihvZmZzZXQpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEdldCB0aGUgc3RhcnQgb2YgZGF0YSBvZiBhIHZlY3RvciB3aG9zZSBvZmZzZXQgaXMgc3RvcmVkIGF0IFwib2Zmc2V0XCIgaW4gdGhpcyBvYmplY3QuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCeXRlQnVmZmVyLnByb3RvdHlwZS5fX3ZlY3RvciA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG9mZnNldCArIHRoaXMucmVhZEludDMyKG9mZnNldCkgKyBTSVpFT0ZfSU5UOyAvLyBkYXRhIHN0YXJ0cyBhZnRlciB0aGUgbGVuZ3RoXHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogR2V0IHRoZSBsZW5ndGggb2YgYSB2ZWN0b3Igd2hvc2Ugb2Zmc2V0IGlzIHN0b3JlZCBhdCBcIm9mZnNldFwiIGluIHRoaXMgb2JqZWN0LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUuX192ZWN0b3JfbGVuID0gZnVuY3Rpb24gKG9mZnNldCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50MzIob2Zmc2V0ICsgdGhpcy5yZWFkSW50MzIob2Zmc2V0KSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGlkZW50XHJcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUuX19oYXNfaWRlbnRpZmllciA9IGZ1bmN0aW9uIChpZGVudCkge1xyXG4gICAgICAgICAgICBpZiAoaWRlbnQubGVuZ3RoICE9IEZJTEVfSURFTlRJRklFUl9MRU5HVEgpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmxhdEJ1ZmZlcnM6IGZpbGUgaWRlbnRpZmllciBtdXN0IGJlIGxlbmd0aCAnICtcclxuICAgICAgICAgICAgICAgICAgICBGSUxFX0lERU5USUZJRVJfTEVOR1RIKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IEZJTEVfSURFTlRJRklFUl9MRU5HVEg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkZW50LmNoYXJDb2RlQXQoaSkgIT0gdGhpcy5yZWFkSW50OCh0aGlzLnBvc2l0aW9uXyArIFNJWkVPRl9JTlQgKyBpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGhlbHBlciBmdW5jdGlvbiB0byBhdm9pZCBnZW5lcmF0ZWQgY29kZSBkZXBlbmRpbmcgb24gdGhpcyBmaWxlIGRpcmVjdGx5LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGxvd1xyXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoaWdoXHJcbiAgICAgICAgICogQHJldHVybnMge2ZsYXRidWZmZXJzLkxvbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQnl0ZUJ1ZmZlci5wcm90b3R5cGUuY3JlYXRlTG9uZyA9IGZ1bmN0aW9uIChsb3csIGhpZ2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZsYXRidWZmZXJzLkxvbmcuY3JlYXRlKGxvdywgaGlnaCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICA7XHJcbiAgICAgICAgcmV0dXJuIEJ5dGVCdWZmZXI7XHJcbiAgICB9KCkpO1xyXG4gICAgZmxhdGJ1ZmZlcnMuQnl0ZUJ1ZmZlciA9IEJ5dGVCdWZmZXI7XHJcbn0pKGZsYXRidWZmZXJzID0gZXhwb3J0cy5mbGF0YnVmZmVycyB8fCAoZXhwb3J0cy5mbGF0YnVmZmVycyA9IHt9KSk7XHJcbi8vIEV4cG9ydHMgZm9yIE5vZGUuanMgYW5kIFJlcXVpcmVKU1xyXG4vL3RoaXMuZmxhdGJ1ZmZlcnMgPSBmbGF0YnVmZmVycztcclxuLy8vIEBlbmRjb25kXHJcbi8vLyBAfVxyXG4iXX0=

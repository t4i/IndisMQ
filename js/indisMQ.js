"use strict";
var flatbuffers_1 = require("../../flatbuffers/js/tsTest/flatbuffers");
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

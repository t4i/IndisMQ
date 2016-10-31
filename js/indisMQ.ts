import {flatbuffers as fb} from "../../flatbuffers/js/tsTest/flatbuffers"
import {IndisMQ as schema} from "../schema/IndisMQ_generated"

export module imq{
export class Msg {
    data: Uint8Array
    fields: schema.Imq
    callback: Handler
}

export interface Handler {
    (m: Msg): Msg;
}

var handlers: { [key: string]: Handler } = {}
var messages: { [key: string]: Msg } = {}
var subscribers: { [key: string]: { [key: string]: boolean } } = {}
var brokerHandler: Handler
var relayHandler: Handler
var name = "unnamed"

export function setBrokerHandler(handler: Handler) {
    brokerHandler = handler
}
export function setRelayHandler(handler: Handler) {
    relayHandler = handler
}

function parseMsg(data: Uint8Array): Msg {
    if (!data) {
        return null
    }
    var m = new Msg()
    m.data = data
    m.fields = schema.Imq.getRootAsImq(new fb.ByteBuffer(data))
    return m
}

function getImqMessage(id: string): Msg {
    if (id in messages) {
        return messages[id]
    }
    return null
}

export function delMessage(id: string) {
    if (id in messages) {
        delete messages[id]
    }
}

export function addSubscriber(client: string, path: string) {
    if (!(path in subscribers)) {
        subscribers[path] = {}
    }
    subscribers[path][client] = false
}

export function delSubscriber(client: string, path: string) {
    if (path in subscribers) {
        if (client in subscribers[path]) {
            delete subscribers[path][client]
        }
        if (Object.keys(subscribers[path]).length < 1) {
            delete subscribers[path]
        }

    }
}

export function setHandler(path: string, handler: Handler) {
    handlers[path] = handler
}

function getHandler(path: string) {
    if (path in handlers) {
        return handlers[path]
    }
    return null
}

function delHandler(path: string) {
    if (path in handlers) {
        delete handlers[path]
    }
}


// export function setCallback(id: string, callback: Handler) {
//     status[id] = status[id] | {}
//     status[id].callback = callback

// }
// export function getCallback(id: string) {
//     return status[id].callback
// }

export function syn(stsMsg: string, callback: Handler): Msg {
    var uid = newUID()
    var m = makeImq(uid, name, "", false, "", schema.MsgType.CMD, schema.Sts.REQ, schema.Err.NONE, stsMsg, schema.Cmd.SYN, null, callback)
    if (callback) {
        messages[uid] = m
    }
    return m
}

export function err(m: Msg, stsMsg: string, err: number): Msg {
    return makeImq(m.fields.MsgId(), name, m.fields.From(), m.fields.Broker(), m.fields.Path(), m.fields.MsgType(), schema.Sts.ERROR, err, stsMsg, m.fields.Cmd(), null, null)
}

export function success(m: Msg, stsMsg: string): Msg {
    return makeImq(m.fields.MsgId(), name, m.fields.From(), m.fields.Broker(), m.fields.Path(), m.fields.MsgType(), schema.Sts.SUCCESS, schema.Err.NONE, stsMsg, m.fields.Cmd(), null, null)
}

export function req(to: string, dest: string, msg: any, callback: Handler): Msg {
    var uid = newUID()
    var m = makeImq(uid, name, to, false, dest, schema.MsgType.PEER, schema.Sts.REQ, schema.Err.NONE, "", schema.Cmd.NONE, msg, callback)
    if (callback) {
        messages[uid] = m
    }
    return m
}
export function rep(m: Msg, stsMsg: string, msg: any) {
    return makeImq(m.fields.MsgId(), name, m.fields.From(), m.fields.Broker(), m.fields.Path(), m.fields.MsgType(), schema.Sts.REP, schema.Err.NONE, stsMsg, m.fields.Cmd(), msg, null)

}
export function sub(path: string, handler: Handler, callback: Handler): Msg {
    var uid = newUID()
    if (handler) {
        setHandler(path, handler)
    }
    var m = makeImq(uid, name, "", false, path, schema.MsgType.CMD, schema.Sts.REQ, schema.Err.NONE, "", schema.Cmd.SUB, null, callback)
    if (callback) {
        messages[uid] = m
    }
    return m

}
export function unSub(path: string, handler: Handler, callback: Handler): Msg {
    var uid = newUID()
    delHandler(path)
    var m = makeImq(uid, name, "", false, path, schema.MsgType.CMD, schema.Sts.REQ, schema.Err.NONE, "", schema.Cmd.UNSUB, null, callback)
    if (callback) {
        messages[uid] = m
    }
    return m

}
function brokerReplay(m: Msg, handler: (client: string, m: Msg) => void, callback: Handler) {
    if (m.fields.MsgType() == schema.MsgType.MULT) {
        var r = makeImq(m.fields.MsgId(), name, null, false, m.fields.Path(), m.fields.MsgType(), schema.Sts.REQ, schema.Err.NONE, m.fields.StsMsg(), m.fields.Cmd(), m.fields.BodyArray(), callback)
        sendMult(r, handler)
    } else {
        var r = makeImq(m.fields.MsgId(), name, null, false, m.fields.Path(), m.fields.MsgType(), schema.Sts.REQ, schema.Err.NONE, m.fields.StsMsg(), m.fields.Cmd(), m.fields.BodyArray(), callback)
        sendQueue(r, handler)
    }
}
export function mult(broker: boolean, path: string, msg: any, handler: (client: string, m: Msg) => void, callback: Handler) {
    var uid = newUID()
    var m = makeImq(uid, name, "", broker, path, schema.MsgType.MULT, schema.Sts.REQ, schema.Err.NONE, "", schema.Cmd.NONE, msg, callback)
    if (!broker) {
        sendMult(m, handler)
        return null
    }
    if (callback) {
        messages[uid] = m
    }
    return m

}
function sendMult(m: Msg, handler: (client: string, m: Msg) => void) {
    for (var key in subscribers[m.fields.Path()]) {
        handler(key, m)
    }
}
export function queue(broker: boolean, path: string, msg: any, handler: (client: string, m: Msg) => void, callback: Handler) {
    var uid = newUID()
    var m = makeImq(uid, name, "", broker, path, schema.MsgType.QUEUE, schema.Sts.REQ, schema.Err.NONE, "", schema.Cmd.NONE, msg, callback)
    if (!broker) {
        sendQueue(m, handler)
        return null
    }
    if (callback) {
        messages[uid] = m
    }
    return m

}
function sendQueue(m: Msg, handler: (client: string, m: Msg) => void) {
    var success = false
    var takeNext = false
    var path = m.fields.Path().toString()
    if (path in subscribers) {
        if (Object.keys(subscribers[path]).length < 1) {
            for (var key in subscribers[path]) {
                if (takeNext) {
                    handler(key, m)
                    subscribers[path][key] = true
                    success = true
                }
                if (subscribers[path][key]) {
                    takeNext = true
                    subscribers[path][key] = false
                }
            }
            if (!success) {
                for (var key in subscribers[path]) {
                    handler(key, m)
                    subscribers[path][key] = true
                    return
                }
            }
        }
    }
}

function makeImq(id: string, from: string, to: string, broker: boolean, path: string, msgType: schema.MsgType, sts: schema.Sts, err: schema.Err, stsMsg: string, cmd: schema.Cmd, body: Uint8Array | number[], callback: Handler): Msg {
    var m = new Msg()
    var builder = new fb.Builder(1)
    var idOffset = builder.createString(id)
    var bodyOffset = schema.Imq.createBodyVector(builder, body)
    var stsMsgOffset = builder.createString(stsMsg)
    var pathOffset = builder.createString(path)
    var fromOffset = builder.createString(from)
    var toOffset = builder.createString(to)
    schema.Imq.startImq(builder)
    schema.Imq.addFrom(builder, fromOffset)
    schema.Imq.addTo(builder, toOffset)
    schema.Imq.addMsgId(builder, idOffset)
    schema.Imq.addBroker(builder, broker)
    if (callback) {
        schema.Imq.addCallback(builder, true)
        m.callback = callback
    }
    schema.Imq.addPath(builder, pathOffset)
    schema.Imq.addSts(builder, sts)
    schema.Imq.addBody(builder, bodyOffset)
    schema.Imq.addStsMsg(builder, stsMsgOffset)
    schema.Imq.addErr(builder, err)
    schema.Imq.addMsgType(builder, msgType)
    schema.Imq.addCmd(builder, cmd)
    var imq = schema.Imq.endImq(builder)
    builder.finish(imq)
    m.data = builder.asUint8Array()
    m.fields = schema.Imq.getRootAsImq(new fb.ByteBuffer(m.data))
    return m
}



export function recieveRawData(data: ArrayBuffer): Msg {
    var reply: Msg
    var m = parseMsg(new Uint8Array(data))
    var buf=new fb.ByteBuffer(m.data)    
    var i=schema.Imq.getRootAsImq(buf)
    //console.log("Recieved "+schema.MsgType[m.fields.MsgType()]+" "+schema.Sts[m.fields.Sts()]+" "+schema.Cmd[m.fields.Cmd()])
    if (!m) {
        return null
    }
    if (m.fields.Broker() == true) {
        if (brokerHandler) {
            reply = brokerHandler(m)
        } else {
            reply = err(m, "not a broker", schema.Err.NO_HANDLER)
        }
    } else if (m.fields.To()&& m.fields.To().length > 0 && m.fields.To() != name) {
        if (relayHandler) {
            reply = relayHandler(m)
        } else {
            reply = err(m, "not a relay", schema.Err.NO_HANDLER)
        }
    } else if (m.fields.MsgType() == schema.MsgType.CMD) {
        reply = handleCmd(m)
    } else if (m.fields.Sts() == schema.Sts.REQ) {
        if (m.fields.Path() in handlers) {
            reply = handlers[m.fields.Path()](m)
        }
    } else {
        if (m.fields.MsgId() in messages) {
            var imq = messages[m.fields.MsgId()]
            if (imq.callback) {
                imq.callback(m)
            }
            delMessage(m.fields.MsgId())
        }
    }
    return reply
}

function handleCmd(m: Msg): Msg {
    var r: Msg
    if (m.fields.Sts() == schema.Sts.REQ) {
        switch (m.fields.Cmd()) {
            case schema.Cmd.SUB:
                addSubscriber(m.fields.From(), m.fields.Path())
                r = success(m, "")
                break;
            case schema.Cmd.SYN:
                r = success(m, "")
                break;
            case schema.Cmd.UNSUB:
                delSubscriber(m.fields.From(), m.fields.Path())
                r = success(m, "")
                break;
            default:
                r = err(m, "unsupported CMD", schema.Err.INVALID)
                break;
        }
    } else {
        if (m.fields.MsgId() in messages) {
            var imq = messages[m.fields.MsgId()]
            if (imq.callback) {
                imq.callback(m)
            }
            delMessage(m.fields.MsgId())
        }
    }
    return r
}
export function setName(newName:string){
    name=newName
}
function newUID(): string {
    var text = " ";

    var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 16; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));

    return text;
}

}
var handlers = {}
var sender
var status = {}
var schema = IndisRPC.RPC
var fb = flatbuffers
function setCallback(id, callback) {
    status[id] = status[id] | {}
    status[id].callback = callback

}
function getCallback(id) {
    return status[id].callback
}
function setData(id, data) {
    status[id] = status[id] | {}
    status[id].data = data
}
function getData(id) {
    return status[id].data
}
function delStatus(id) {
    delete stats[id]
}
function setHandler(handler, rpcType) {
    handlers[rpcType] = hanlder
}
function setSender(senderFunc) {
    sender = senderFunc
}
function sendStatus(id, sts, msg) {
    var builder = fb.Builder(1)
    var rpcId = builder.createString(id)
    schema.startRPC(builder)
    schema.addId(builder, rpcId)
    schema.addState(builder, schema.StateSTS) 
    schema.addSts(builder, schema, sts)
    if (msg) {
        var message = builder.createString(msg)
        schema.addStsMsg(builder, message)
    }
    var rpc = schema.endRPC(builder)
    builder.finish(rpc)
    var buf = builder.finishedBytes()
    sender(buf)
}
function callHandler(id, rpcType, data) {
    if (handler = handlers[rpcType]) {
        handler(id, data)
    }
    return true
}
var seq = 1
function sendRawReq(rpcType, data, timeout, callback) {
    var uuid = seq + ''
    seq++
    var builder = fb.Builder(1)
    var rpcId = builder.createString(uuid)
    var dataOffset = builder.createByteVector(data)
    schema.startRPC(builder)
    schema.addId(builder, rpcId)
    schema.addState(builder, schema.StateREQ)
    schema.addData(builder, dataOffset)
    schema.addType(builder, rpcType)
    var rpc = schema.endRPC(builder)
    builder.finish(rpc)
    var buf = builder.finishedBytes()
    if (callback) {
        setCallback(uuid, callback)
    }
    setData(uuid, buf)
    sender(buf)

}
function SendRawRes(id, rpcType, data) {
    var builder = fb.Builder(1)
    var rpcId = builder.createString(id)
    var dataOffset = builder.createByteVector(data)
    schema.startRPC(builder)
    schema.addId(builder, rpcId)
    schema.addState(builder, schema.StateRES)
    schema.addData(builder, dataOffset)
    schema.addType(builder, rpcType)
    var rpc = schema.endRPC(builder)
    builder.finish(rpc)
    var buf = builder.finishedBytes()

    sender(buf)
}
function RecieveRawData(data) {
    var rpc = schema.getRootAsRPC(data, 0)
    var id = rpc.id()
    var rawData = rpc.dataBytes()
    switch (rpc.State()) {
        case schema.StateREQ:
            if (handler = handlers[rpc.Type()]) {
                handler(id, rawData)
            }
            break;
        case schema.StateRES:
            if (callback = getCallback(id)) {
                callback(rawData)
            }
            break;
        case schema.StateSTS:
            switch (rpc.Sts()) {
                case schema.StsERROR:
                    break;
                case schema.StsRECIEVED:
                delStatus(id)
                    break;
                case schema.StsRES_TIMEOUT:
                default:
                    break;
            }
            break
        default:
            break;
    }



}
function newUUID() {

}
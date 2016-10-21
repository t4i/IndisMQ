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

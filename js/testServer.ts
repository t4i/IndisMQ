import {imq} from "./indisMQ"
import {flatbuffers as fb} from "../schema/flatbuffers"
import {IndisMQ as schema} from "../schema/IndisMQ_generated"
var t=imq.req("","",null,null)
console.log(t.fields.MsgId())
console.log("still made it")
imq.setName("browser")
imq.setHandler("/what",function(m:imq.Msg):imq.Msg{
    console.log("say what")
    return imq.success(m,"got it")
})
var ws=new WebSocket("ws://localhost:7000/test")
ws.binaryType="arraybuffer"
ws.onopen=function(event){
    var msg=imq.req("","/","hey buddy",null)
    ws.send(msg.data)

    var sub=imq.sub("/hello",function(m:imq.Msg):imq.Msg{
        console.log("new message on hello "+m.fields.From()+" says "+bin2string(m.fields.BodyArray()))
        return imq.success(m,"woohoo")
    },function(m:imq.Msg):imq.Msg{
        console.log("callback called")
        return null
    })
    ws.send(sub.data)
}

ws.onmessage=function(event){
    var reply=imq.recieveRawData(event.data)
    if(reply){
        ws.send(reply.data)
    }
}
function bin2string(array){
	var result = "";
	for(var i = 0; i < array.length; ++i){
		result+= (String.fromCharCode(array[i]));
	}
	return result;
}
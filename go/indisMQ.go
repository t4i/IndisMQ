package imq

import (
	//"crypto/rand"
	"fmt"
	fb "github.com/google/flatbuffers/go"
	//"io"
	//"sync"
	schema "../schema/IndisMQ"
	"github.com/dchest/uniuri"
)

//Handler ...
type Handler func(m *Msg) *Msg

//RPCSender ...
//type RPCSender func(data *[]byte) bool

//Msg ... imq.Msg.rawData imq.Msg.
type Msg struct {
	Data     *[]byte
	Fields   *schema.Imq
	Callback Handler
}

var handlers = make(map[string]Handler)
var brokerHandler Handler
var relayHandler Handler
var messages = make(map[string]*Msg)
var subscribers = make(map[string]map[string]bool)

//OnReady ...
var OnReady = func() {}

//Debug ...
var Debug = false

// var statusLock = &sync.RWMutex{}
// var handlerLock = &sync.RWMutex{}
// var senderLock = &sync.RWMutex{}
// var subLock = &sync.RWMutex{}

//SetBrokerHandler ...
func SetBrokerHandler(handler Handler) {
	brokerHandler = handler
}

//SetRelayHandler ...
func SetRelayHandler(handler Handler) {
	relayHandler = handler
}
func parseMsg(data *[]byte) (m *Msg) {
	if data == nil {
		return nil
	}
	m = &Msg{}
	m.Fields = schema.GetRootAsImq(*data, 0)
	m.Data = data
	return
}

func getImqMessage(id string) (imqMessage *Msg) {
	var present bool
	//statusLock.RLock()
	if imqMessage, present = messages[id]; !present {
		return nil
	}
	//statusLock.RUnlock()
	return
}

// func callCallback(imqMessage *Msg) *Msg {
// 	callback := imqMessage.Callback
// 	if callback != nil {
// 		return callback(imqMessage)
// 	}
// 	return nil
// }

// func readImqMessage(id string, f func(*Msg)) {
// 	msg := getImqMessage(id)
// 	//statusLock.RLock()
// 	f(msg)
// 	//statusLock.RUnlock()
// }

// func writeImqMessage(id string, f func(*Msg)) {
// 	msg := getImqMessage(id)
// 	//statusLock.Lock()
// 	f(msg)
// 	//statusLock.Unlock()
// }

//GetMessageSize ...
func GetMessageSize() int {
	return len(messages)
}

//DelMessage ...
func DelMessage(id string) {
	//statusLock.Lock()
	var present bool
	if _, present = messages[id]; present {
		delete(messages, id)
	}
	//statusLock.Unlock()
}

//AddSubscriber ...
func AddSubscriber(client string, path string) {
	var present bool
	//subLock.Lock()
	if _, present = subscribers[path]; !present {
		subscribers[path] = make(map[string]bool)
	}
	subscribers[path][client] = false
	//subLock.Unlock()
}

//DelSubscriber ...
func DelSubscriber(client string, path string) {
	var present, present2 bool
	//subLock.Lock()
	if _, present = subscribers[path]; present {
		if _, present2 = subscribers[path][client]; present2 {
			delete(subscribers[path], client)
		}
		if len(subscribers[path]) < 1 {
			delete(subscribers, path)
		}
	}

	//subLock.Unlock()
}

//SetHandler ...
func SetHandler(path string, handler Handler) {
	//handlerLock.Lock()
	handlers[path] = handler
	//handlerLock.Unlock()
}

//GetHandler ...
func GetHandler(path string) (handler Handler) {
	//handlerLock.RLock()
	handler = handlers[path]
	//handlerLock.RUnlock()
	return
}

//DelHandler ...
func DelHandler(path string) {
	//handlerLock.Lock()
	delete(handlers, path)
	//handlerLock.Unlock()
}

//Syn ...
func Syn(stsMsg string, callback Handler) *Msg {
	uuid, uuidErr := newUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}

	m := makeImq(uuid, name, nil, 0, nil, schema.MsgTypeCMD, schema.StsREQ, schema.CmdSYN, []byte(stsMsg), -1, nil, callback)
	if callback != nil {
		messages[string(uuid)] = m
	}
	return m
}

//Err ...
func Err(m *Msg, stsMsg string, err int8) *Msg {
	return makeImq(m.Fields.MsgId(), name, m.Fields.From(), m.Fields.Broker(), m.Fields.Path(), m.Fields.MsgType(), schema.StsERROR, -1, []byte(stsMsg), err, nil, nil)
}

//Ready ...
func Ready(to string, dest string, callback Handler) *Msg {
	//encode
	uuid, uuidErr := newUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	m := makeImq(uuid, name, []byte(to), 0, []byte(dest), schema.MsgTypeCMD, schema.StsREQ, schema.CmdREADY, nil, -1, nil, callback)
	if callback != nil {
		messages[string(uuid)] = m
	}
	return m
}

//Success ...
func Success(m *Msg, stsMsg string) *Msg {
	return makeImq(m.Fields.MsgId(), name, m.Fields.From(), m.Fields.Broker(), m.Fields.Path(), m.Fields.MsgType(), schema.StsSUCCESS, m.Fields.Cmd(), []byte(stsMsg), -1, nil, nil)
}

//Req ...
func Req(to string, dest string, msg []byte, callback Handler) *Msg {
	//encode
	uuid, uuidErr := newUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	m := makeImq(uuid, name, []byte(to), 0, []byte(dest), schema.MsgTypeSINGLE, schema.StsREQ, -1, nil, -1, msg, callback)
	if callback != nil {
		messages[string(uuid)] = m
	}
	return m
}

//Rep ...
func Rep(m *Msg, stsMsg string, msg []byte) *Msg {
	return makeImq(m.Fields.MsgId(), name, m.Fields.From(), m.Fields.Broker(), m.Fields.Path(), m.Fields.MsgType(), schema.StsREP, m.Fields.Cmd(), []byte(stsMsg), -1, msg, nil)
}

//Sub ...
func Sub(path string, handler Handler, callback Handler) *Msg {
	//make and return a subscribe message
	//fmt.Println("Path", path)
	uuid, uuidErr := newUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	if handler != nil {
		SetHandler(path, handler)
	}
	m := makeImq(uuid, name, nil, 0, []byte(path), schema.MsgTypeCMD, schema.StsREQ, schema.CmdSUB, nil, -1, nil, callback)
	if callback != nil {
		messages[string(uuid)] = m
	}
	return m
}

//UnSub ...
func UnSub(path string, callback Handler) *Msg {
	//make and return a unsubscribe message
	uuid, uuidErr := newUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	DelHandler(path)
	m := makeImq(uuid, name, nil, 0, []byte(path), schema.MsgTypeCMD, schema.StsREQ, schema.CmdUNSUB, nil, -1, nil, callback)
	if callback != nil {
		messages[string(uuid)] = m
	}
	return m
}

//BrokerReplay ...
func BrokerReplay(m *Msg, handler func(string, *Msg), callback Handler) {
	var r *Msg
	if m.Fields.MsgType() == schema.MsgTypeCAST {
		r = makeImq(m.Fields.MsgId(), name, nil, 0, m.Fields.Path(), schema.MsgTypeCAST, schema.StsREQ, -1, m.Fields.StsMsg(), -1, m.Fields.BodyBytes(), callback)
		sendMult(r, handler)
	} else {
		r = makeImq(m.Fields.MsgId(), name, nil, 0, m.Fields.Path(), schema.MsgTypeQUEUE, schema.StsREQ, -1, m.Fields.StsMsg(), -1, m.Fields.BodyBytes(), callback)
		sendQueue(r, handler)
	}

}

//Mult ...
func Mult(broker bool, path string, msg []byte, handler func(string, *Msg), callback Handler) *Msg {
	//make a pub request and call a closure
	uuid, uuidErr := newUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	hasBroker := byte(0)
	if broker {
		hasBroker = 1
	}
	m := makeImq(uuid, name, nil, hasBroker, []byte(path), schema.MsgTypeCAST, schema.StsREQ, -1, nil, -1, msg, callback)
	if !broker {
		sendMult(m, handler)
		return nil
	}
	if callback != nil {
		messages[string(uuid)] = m
	}
	return m

}
func sendMult(m *Msg, handler func(string, *Msg)) {
	for k := range subscribers[string(m.Fields.Path())] {
		handler(k, m)
	}
}

//Queue ...
func Queue(broker bool, path string, msg []byte, handler func(string, *Msg), callback Handler) *Msg {
	uuid, uuidErr := newUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	hasBroker := byte(0)
	if broker {
		hasBroker = 1
	}
	m := makeImq(uuid, name, nil, hasBroker, []byte(path), schema.MsgTypeQUEUE, schema.StsREQ, -1, nil, -1, msg, callback)
	fmt.Println(string(m.Fields.Path()))
	if !broker {
		sendQueue(m, handler)
		return nil
	}
	if callback != nil {
		messages[string(uuid)] = m
	}
	return m

}
func sendQueue(m *Msg, handler func(string, *Msg)) {
	success := false
	takeNext := false
	path := string(m.Fields.Path())
	if _, ok := subscribers[path]; ok {
		if len(subscribers[path]) > 0 {

			for k, v := range subscribers[path] {

				if takeNext {
					handler(k, m)
					subscribers[path][k] = true
					success = true
					//fmt.Println("takeNext ", k)
				}

				if v {
					takeNext = true
					subscribers[path][k] = false
				}
			}
			if !success {
				for k := range subscribers[path] {
					handler(k, m)
					subscribers[path][k] = true
					//fmt.Println("!success ", k)
					return
				}

			}

		}
	}

}
func makeImq(id []byte, from []byte, to []byte, broker byte, path []byte, msgType int8, sts int8, cmd int8, stsMsg []byte, err int8, body []byte, callback Handler) (m *Msg) {
	m = &Msg{}
	builder := fb.NewBuilder(0)
	imqID := builder.CreateByteString(id)
	var bodyOffset = builder.CreateByteVector(body)
	var stsMsgOffset = builder.CreateByteString(stsMsg)
	pathOffset := builder.CreateByteString(path)
	fromOffset := builder.CreateByteString(from)
	toOffset := builder.CreateByteString(to)
	schema.ImqStart(builder)
	schema.ImqAddFrom(builder, fromOffset)
	schema.ImqAddTo(builder, toOffset)
	schema.ImqAddMsgId(builder, imqID)
	if broker == 1 {
		schema.ImqAddBroker(builder, 1)
	}
	if callback != nil {
		schema.ImqAddCallback(builder, 1)
		m.Callback = callback
	}
	schema.ImqAddPath(builder, pathOffset)
	schema.ImqAddSts(builder, sts)
	if body != nil {
		schema.ImqAddBody(builder, bodyOffset)
	}
	if stsMsg != nil {
		schema.ImqAddStsMsg(builder, stsMsgOffset)
	}
	if err != -1 {
		schema.ImqAddErr(builder, err)
	}
	if msgType != -1 {
		schema.ImqAddMsgType(builder, msgType)
	}
	if cmd != -1 {
		schema.ImqAddCmd(builder, cmd)
	}
	rpc := schema.ImqEnd(builder)
	builder.Finish(rpc)
	buf := builder.FinishedBytes()

	//decide if we should add to msg queue
	m.Data = &buf
	m.Fields = schema.GetRootAsImq(buf, 0)
	return
}

//RecieveMessage ...
func RecieveMessage(data *[]byte) (reply *Msg) {
	//decode RPC
	if data == nil {
		return
	}
	m := parseMsg(data)
	//fmt.Println("recieved", m)
	if m == nil {
		//return error?
		return nil
	}
	fmt.Println("Recieved ", schema.EnumNamesMsgType[int(m.Fields.MsgType())], " ", schema.EnumNamesSts[int(m.Fields.Sts())], " ", schema.EnumNamesCmd[int(m.Fields.Cmd())])

	if m.Fields.Broker() == 1 {
		//call broker handler
		if brokerHandler != nil {
			reply = brokerHandler(m)
		} else {
			fmt.Println("not a broker")
			reply = Err(m, "not a broker", schema.ErrNO_HANDLER)
		}
	} else if len(m.Fields.To()) > 0 && string(m.Fields.To()) != string(name) {
		//call relay handler
		if relayHandler != nil {
			reply = relayHandler(m)
		} else {
			fmt.Println("-", m.Fields.To(), "-")
			fmt.Println("not a relay")
			reply = Err(m, "not a relay", schema.ErrNO_HANDLER)
		}
	} else if m.Fields.MsgType() == schema.MsgTypeCMD {
		reply = handleCmd(m)
	} else if m.Fields.Sts() == schema.StsREQ {
		if handler := GetHandler(string(m.Fields.Path())); handler != nil {
			reply = handler(m)
		}
	} else { //its a reply
		imq := getImqMessage(string(m.Fields.MsgId()))
		if imq != nil && imq.Callback != nil {
			imq.Callback(m)
		}
		DelMessage(string(m.Fields.MsgId()))
	}

	return
}
func handleCmd(imq *Msg) (m *Msg) {
	if imq.Fields.Sts() == schema.StsREQ {
		switch imq.Fields.Cmd() {
		case schema.CmdSUB:
			AddSubscriber(string(imq.Fields.From()), string(imq.Fields.Path()))
			m = Success(imq, "")
		case schema.CmdSYN:
			m = Success(imq, "")
		case schema.CmdUNSUB:
			DelSubscriber(string(imq.Fields.From()), string(imq.Fields.Path()))
			m = Success(imq, "")
		case schema.CmdREADY:
			OnReady()
		default:
		}
	} else {
		msg := getImqMessage(string(imq.Fields.MsgId()))
		if msg != nil && msg.Callback != nil {
			msg.Callback(imq)
		}
		DelMessage(string(imq.Fields.MsgId()))
	}
	return
}

var name = []byte("unnamed")

//SetName ...
func SetName(newName string) {
	//should notify all connections
	name = []byte(newName)
}

var hi = []byte("hi")

// newUUID generates a random UUID according to RFC 4122
func newUID() ([]byte, error) {
	// uuid := make([]byte, 16)
	// n, err := io.ReadFull(rand.Reader, uuid)
	// if n != len(uuid) || err != nil {
	// 	return nil, err
	// }
	// // variant bits; see section 4.1.1
	// uuid[8] = uuid[8]&^0xc0 | 0x80
	// // version 4 (pseudo-random); see section 4.1.3
	// uuid[6] = uuid[6]&^0xf0 | 0x40
	// return []byte(fmt.Sprintf("%x-%x-%x-%x-%x", uuid[0:4], uuid[4:6], uuid[6:8], uuid[8:10], uuid[10:])), nil
	return []byte(uniuri.New()), nil
}

/*
ideas
-allow combination of broker and relay so you can relay to a broker
-allow a dns like lookup of to by relay

*/

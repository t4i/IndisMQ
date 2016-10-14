package imq

import (
	"crypto/rand"
	"fmt"
	fb "github.com/google/flatbuffers/go"
	"io"
	//"sync"
	schema "t4i/IndisMQ/schema/IndisMQ"
)

//Handler ...
type Handler func(m *Msg) *Msg

//RPCSender ...
//type RPCSender func(data *[]byte) bool

//Msg ...
type Msg struct {
	From        string
	To          string
	Callback    Handler
	Data        *[]byte
	Body        *[]byte
	Broker      bool
	Sts         int8
	ID          string
	Err         int8
	StsMsg      string
	Cmd         int8
	Path        string
	MsgType     int8
	HasCallback bool
}

var handlers = make(map[string]Handler)
var handshake Handler
var brokerHandler Handler
var relayHandler Handler

var status = make(map[string]*Msg)
var subscribers = make(map[string]map[string]bool)

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
func parseImq(data *[]byte) (m *Msg) {
	if data == nil {
		return nil
	}
	m = &Msg{}
	imq := schema.GetRootAsImq(*data, 0)
	m.ID = string(imq.MsgId())
	m.Sts = imq.Sts()
	rawData := imq.BodyBytes()
	m.Body = &rawData
	m.Err = imq.Err()
	m.StsMsg = string(imq.StsMsg())
	m.Path = string(imq.Path())
	m.Cmd = imq.Cmd()
	m.MsgType = imq.MsgType()
	m.From = string(imq.From())
	m.To = string(imq.To())
	if imq.Callback() == 1 {
		m.HasCallback = true
	}
	if imq.Broker() == 1 {
		m.Broker = true
	}
	m.Data = data
	return
}

func getImqMessage(id string) (imqMessage *Msg) {
	var present bool
	//statusLock.RLock()
	if imqMessage, present = status[id]; !present {
		// The source wasn't found, so we'll create it.
		imqMessage = new(Msg)
		status[id] = imqMessage
	}
	//statusLock.RUnlock()
	return
}
func verifyImqMessage(id string) (imqMessage *Msg) {
	return status[id]
}

func callCallback(imqMessage *Msg) *Msg {
	callback := imqMessage.Callback
	if callback != nil {
		return callback(imqMessage)
	}
	return nil
}

func readImqMessage(id string, f func(*Msg)) {
	msg := getImqMessage(id)
	//statusLock.RLock()
	f(msg)
	//statusLock.RUnlock()
}

func writeImqMessage(id string, f func(*Msg)) {
	msg := getImqMessage(id)
	//statusLock.Lock()
	f(msg)
	//statusLock.Unlock()
}

//GetMessageSize ...
func GetMessageSize() int {
	return len(status)
}

//DelMessage ...
func DelMessage(id string) {
	//statusLock.Lock()
	var present bool
	if _, present = status[id]; present {
		delete(status, id)
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
	}
	//subLock.Unlock()
}

//SetHandler ...
func SetHandler(handler Handler, path string) {
	//handlerLock.Lock()
	handlers[path] = handler
	//handlerLock.Unlock()
}
func getHandler(path string) (handler Handler) {
	//handlerLock.RLock()
	handler = handlers[path]
	//handlerLock.RUnlock()
	return
}
func delHandler(path string) {
	//handlerLock.Lock()
	delete(handlers, path)
	//handlerLock.Unlock()
}

//Syn ...
func Syn(stsMsg string, callback Handler) *Msg {
	uuid, uuidErr := newUUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	return makeImq(uuid, name, "", false, "", schema.MsgTypeCMD, schema.StsREQ, schema.CmdSYN, stsMsg, -1, nil, callback)
}

//Err ...
func Err(m *Msg, stsMsg string, err int8) *Msg {
	return makeImq(m.ID, name, m.From, m.Broker, m.Path, m.MsgType, schema.StsERROR, -1, stsMsg, err, nil, nil)
}

//Success ...
func Success(m *Msg) *Msg {
	if m.MsgType == schema.MsgTypeCMD {
		return makeImq(m.ID, name, m.From, m.Broker, m.Path, m.MsgType, schema.StsSUCCESS, m.Cmd, "", -1, nil, nil)
	}
	return makeImq(m.ID, name, m.From, m.Broker, m.Path, m.MsgType, schema.StsSUCCESS, -1, "", -1, nil, nil)
}

//Req ...
func Req(to string, dest string, msg *[]byte, callback Handler) *Msg {
	//encode
	uuid, uuidErr := newUUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	return makeImq(uuid, name, to, false, dest, schema.MsgTypePEER, schema.StsREQ, -1, "", -1, msg, callback)

}

//Rep ...
func Rep(m *Msg, stsMsg string, msg *[]byte) *Msg {
	if m.MsgType == schema.MsgTypeCMD {
		return makeImq(m.ID, name, m.From, m.Broker, m.Path, m.MsgType, schema.StsREP, m.Cmd, stsMsg, -1, msg, nil)
	}
	return makeImq(m.ID, name, m.From, m.Broker, m.Path, m.MsgType, schema.StsREP, -1, stsMsg, -1, msg, nil)

}

//Sub ...
func Sub(path string, handler Handler, callback Handler) *Msg {
	//make and return a subscribe message
	//fmt.Println("Path", path)
	uuid, uuidErr := newUUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	if handler != nil {
		SetHandler(handler, path)
	}
	return makeImq(uuid, name, "", false, path, schema.MsgTypeCMD, schema.StsREQ, schema.CmdSUB, "", -1, nil, callback)
}

//UnSub ...
func UnSub(broker bool, path string) *Msg {
	//make and return a unsubscribe message
	uuid, uuidErr := newUUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	delHandler(path)
	return makeImq(uuid, name, "", broker, path, schema.MsgTypeCMD, schema.StsREQ, schema.CmdUNSUB, "", -1, nil, nil)
}

//BrokerReplay ...
func BrokerReplay(m *Msg, handler func(string, *Msg), callback Handler) {
	var r *Msg
	if m.MsgType == schema.MsgTypeMULT {
		r = makeImq(m.ID, m.From, m.To, false, m.Path, schema.MsgTypeMULT, schema.StsREQ, -1, "", -1, m.Body, callback)
		sendMult(r, handler)
	} else {
		r = makeImq(m.ID, m.From, m.To, false, m.Path, schema.MsgTypeQUEUE, schema.StsREQ, -1, "", -1, m.Body, callback)
		sendQueue(r, handler)
	}

}

//Mult ...
func Mult(broker bool, path string, msg *[]byte, handler func(string, *Msg), callback Handler) *Msg {
	//make a pub request and call a closure
	uuid, uuidErr := newUUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	m := makeImq(uuid, name, "", broker, path, schema.MsgTypeMULT, schema.StsREQ, -1, "", -1, msg, callback)
	if !broker {
		sendMult(m, handler)
		return nil
	}
	return m

}
func sendMult(m *Msg, handler func(string, *Msg)) {
	for k := range subscribers[m.Path] {
		handler(k, m)
	}
}

//Queue ...
func Queue(broker bool, path string, msg *[]byte, handler func(string, *Msg), callback Handler) *Msg {
	uuid, uuidErr := newUUID()
	if uuidErr != nil {
		fmt.Printf("error: %v\n", uuidErr)
	}
	m := makeImq(uuid, name, "", broker, path, schema.MsgTypeQUEUE, schema.StsREQ, -1, "", -1, msg, callback)
	if !broker {
		sendQueue(m, handler)
		return nil
	}
	return m

}
func sendQueue(m *Msg, handler func(string, *Msg)) {
	success := false
	takeNext := false
	if len(subscribers[m.Path]) > 0 {

		for k, v := range subscribers[m.Path] {

			if takeNext {
				handler(k, m)
				subscribers[m.Path][k] = true
				success = true
				//fmt.Println("takeNext ", k)
			}

			if v {
				takeNext = true
				subscribers[m.Path][k] = false
			}
		}
		if !success {
			for k := range subscribers[m.Path] {
				handler(k, m)
				subscribers[m.Path][k] = true
				//fmt.Println("!success ", k)
				return
			}

		}

	}
}
func makeImq(id string, from string, to string, broker bool, path string, msgType int8, sts int8, cmd int8, stsMsg string, err int8, body *[]byte, callback Handler) (m *Msg) {
	//check if already an imqMessage for that id
	if existing := verifyImqMessage(id); existing != nil {
		m = existing
	} else {
		m = &Msg{ID: id, Path: path, Sts: sts}
	}
	builder := fb.NewBuilder(0)
	imqID := builder.CreateString(id)
	var bodyOffset fb.UOffsetT
	var stsMsgOffset fb.UOffsetT
	pathOffset := builder.CreateString(path)
	if body != nil {
		bodyOffset = builder.CreateByteVector(*body)
	}
	if stsMsg != "" {
		stsMsgOffset = builder.CreateString(stsMsg)

	}
	fromOffset := builder.CreateString(from)
	toOffset := builder.CreateString(to)
	schema.ImqStart(builder)
	schema.ImqAddFrom(builder, fromOffset)
	schema.ImqAddTo(builder, toOffset)
	schema.ImqAddMsgId(builder, imqID)
	if broker {
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
		m.Body = body
	}
	if stsMsg != "" {
		schema.ImqAddStsMsg(builder, stsMsgOffset)
		m.StsMsg = stsMsg
	}
	if err != -1 {
		m.Err = err
		schema.ImqAddErr(builder, err)
	}
	if msgType != -1 {
		schema.ImqAddMsgType(builder, msgType)
		m.MsgType = msgType
	}
	if cmd != -1 {
		schema.ImqAddCmd(builder, cmd)
		m.Cmd = cmd
	}
	rpc := schema.ImqEnd(builder)
	builder.Finish(rpc)
	buf := builder.FinishedBytes()

	//decide if we should add to msg queue
	m.Data = &buf
	if sts == schema.StsREQ && callback != nil {
		status[id] = m
	}
	return
}

//RecieveMessage ...
func RecieveMessage(data *[]byte) (reply *Msg) {
	//decode RPC
	if data == nil {
		return
	}
	m := parseImq(data)
	//fmt.Println("recieved", m)
	if m == nil {
		//return error?
		return nil
	}
	//fmt.Println("Recieved ", schema.EnumNamesMsgType[int(m.MsgType)], " ", schema.EnumNamesSts[int(m.Sts)], " ", schema.EnumNamesCmd[int(m.Cmd)])
	if m.Sts == schema.StsREQ {
		if m.Broker {
			//call broker handler
			if brokerHandler != nil {
				reply = brokerHandler(m)
			} else {
				fmt.Println("not a broker")
				reply = Err(m, "not a broker", schema.ErrNO_HANDLER)
			}
		} else if m.To != "" && m.To != name {
			//call relay handler
			if relayHandler != nil {
				reply = relayHandler(m)
			} else {
				fmt.Println("not a relay")
				reply = Err(m, "not a relay", schema.ErrNO_HANDLER)
			}
		} else if m.MsgType != schema.MsgTypeCMD {
			if handler := getHandler(m.Path); handler != nil {
				reply = handler(m)
			}
		} else {
			reply = handleCmd(m)
		}

	} else {
		if m.Broker {
			//call broker handler
			if brokerHandler != nil {
				reply = brokerHandler(m)
			} else {
				fmt.Println("not a broker")
				reply = Err(m, "not a broker", schema.ErrNO_HANDLER)
			}
		} else if m.To != "" && m.To != name {
			//call relay handler
			if relayHandler != nil {
				reply = relayHandler(m)
			} else {
				fmt.Println("not a relay")
				reply = Err(m, "not a relay", schema.ErrNO_HANDLER)
			}
		} else if m.MsgType != schema.MsgTypeCMD {
			imq := getImqMessage(m.ID)
			if imq != nil && imq.Callback != nil {
				imq.Callback(m)
			}
			DelMessage(m.ID)

		} else {
			handleCmd(m)
		}
	}
	return
}
func handleCmd(imq *Msg) (m *Msg) {
	if imq.Sts == schema.StsREQ {
		switch imq.Cmd {
		case schema.CmdSUB:
			AddSubscriber(imq.From, imq.Path)
			m = Success(imq)
		case schema.CmdSYN:
			m = Success(imq)
		case schema.CmdUNSUB:
			DelSubscriber(imq.From, imq.Path)
			m = Success(imq)
		default:
		}
	} else {
		if imq.Sts == schema.StsREP || imq.Sts == schema.StsSUCCESS {
			switch imq.Cmd {
			case schema.CmdSUB:
				msg := getImqMessage(imq.ID)
				if msg != nil && msg.Callback != nil {
					msg.Callback(imq)
				}
				DelMessage(imq.ID)
			case schema.CmdSYN:
				msg := getImqMessage(imq.ID)
				if msg != nil && msg.Callback != nil {
					msg.Callback(imq)
				}
				DelMessage(imq.ID)
			case schema.CmdUNSUB:
				msg := getImqMessage(imq.ID)
				if msg != nil && msg.Callback != nil {
					msg.Callback(imq)
				}
				DelMessage(imq.ID)
			default:
			}
		} else {

			msg := getImqMessage(imq.ID)
			if msg != nil && msg.Callback != nil {
				msg.Callback(imq)
			}
			DelMessage(imq.ID)
		}

	}
	return
}

var name = "unnamed"

//SetName ...
func SetName(newName string) {
	//should notify all connections
	name = newName
}

// newUUID generates a random UUID according to RFC 4122
func newUUID() (string, error) {
	uuid := make([]byte, 16)
	n, err := io.ReadFull(rand.Reader, uuid)
	if n != len(uuid) || err != nil {
		return "", err
	}
	// variant bits; see section 4.1.1
	uuid[8] = uuid[8]&^0xc0 | 0x80
	// version 4 (pseudo-random); see section 4.1.3
	uuid[6] = uuid[6]&^0xf0 | 0x40
	return fmt.Sprintf("%x-%x-%x-%x-%x", uuid[0:4], uuid[4:6], uuid[6:8], uuid[8:10], uuid[10:]), nil
}

/*
ideas
-allow combination of broker and relay so you can relay to a broker
-allow a dns like lookup of to by relay

*/

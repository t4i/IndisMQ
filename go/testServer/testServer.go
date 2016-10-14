package main

import (
	"fmt"
	"github.com/gorilla/websocket"
	//"github.com/pkg/profile"
	"log"
	"net/http"
	"sync"
	schema "t4i/IndisRPC/Schema/IndisRPC"
	imq "t4i/IndisRPC/go/IndisRPC"
	"time"
)

var webSockets = make(map[string]*websocket.Conn)
var ws []*websocket.Conn
var upgrader = websocket.Upgrader{} // use default options
var sendLock sync.Mutex

func messageRecieved(message *[]byte, w *websocket.Conn) {
	m := imq.RecieveMessage(message)
	if m != nil && m.Data != nil {
		// fmt.Println("sending ", m)
		// fmt.Println(schema.EnumNamesMsgType[int(m.MsgType)], " ", schema.EnumNamesSts[int(m.Sts)], " ", schema.EnumNamesCmd[int(m.Cmd)])
		sendMessage(m.Data, w)
	}

}
func sendMessage(data *[]byte, w *websocket.Conn) {
	if data != nil {
		sendLock.Lock()
		er := w.WriteMessage(2, *data)
		sendLock.Unlock()
		if er != nil {
			log.Println(er)
		}
	}

}
func relayHandler(m *imq.ImqMessage) *imq.ImqMessage {
	if w, ok := webSockets[m.To]; ok {
		sendMessage(m.Data, w)
		return nil
	} else {
		return imq.Err(m, "Client not found", schema.ErrINVALID)
	}

}
func brokerHandler(m *imq.ImqMessage) *imq.ImqMessage {

	imq.BrokerReplay(m, func(client string, imqMessage *imq.ImqMessage) {
		if _, ok := webSockets[client]; ok {
			sendMessage(imqMessage.Data, webSockets[client])
		}

	}, func(imqMessage *imq.ImqMessage) *imq.ImqMessage {
		sendMessage(imqMessage.Data, webSockets[m.From])
		return nil
	})
	return nil
}
func main() {
	imq.SetName("Server")
	imq.SetRelayHandler(relayHandler)
	imq.SetBrokerHandler(brokerHandler)
	fmt.Println("server starting")
	log.Println("starting ws")
	http.HandleFunc("/test", upgrade)
	log.Println(http.ListenAndServe(":6000", http.HandlerFunc(upgrade)).Error())
}

func upgrade(w http.ResponseWriter, r *http.Request) {
	//log.Println("upgrade request")
	var err error
	var temp *websocket.Conn
	temp, err = upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	ws = append(ws, temp)
	syn := imq.Syn("", func(val *imq.ImqMessage) *imq.ImqMessage {
		webSockets[val.From] = temp
		//fmt.Println("ack success ", val.From)
		return nil
	})
	sendMessage(syn.Data, temp)
	receive(temp)

}

var sending bool
var count int

func send() {

	temp := []byte("Test1")

	c := 5
	for i := 0; i < c; i++ {
		time.Sleep(time.Millisecond * 100)

		imq.Queue(false, "/hommy", &temp, func(client string, val *imq.ImqMessage) {
			//fmt.Println("/hommy ", val)
			sendMessage(val.Data, webSockets[client])
		}, func(val *imq.ImqMessage) *imq.ImqMessage {
			fmt.Println("got response")
			return nil
		})
	}

}
func receive(w *websocket.Conn) {
	defer w.Close()
	//go send()
	for {
		_, message, err := w.ReadMessage()
		if err != nil {
			break
		}
		messageRecieved(&message, w)

	}
}

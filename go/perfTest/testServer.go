package main

import (
	"fmt"
	imq "t4i/IndisMQ/go"
	//schema "t4i/IndisMQ/schema/IndisMQ"
	//"github.com/pkg/profile"
	"time"
)

func messageRecieved(message *[]byte) {
	m := imq.RecieveMessage(message)

	if m != nil && m.RawData != nil {
		// fmt.Println("sending ", m)
		// fmt.Println(schema.EnumNamesMsgType[int(m.MsgType)], " ", schema.EnumNamesSts[int(m.Sts)], " ", schema.EnumNamesCmd[int(m.Cmd)])

		sendMessage(m.RawData)
	}

}
func sendMessage(data *[]byte) {
	imq.RecieveMessage(data)
}

// func relayHandler(m *imq.ImqMessage) *imq.ImqMessage {
// 	if w, ok := webSockets[m.To]; ok {
// 		sendMessage(m.Data, w)
// 		return nil
// 	} else {
// 		return imq.Err(m, "Client not found", schema.ErrINVALID)
// 	}

// }
// func brokerHandler(m *imq.ImqMessage) *imq.ImqMessage {

// 	imq.BrokerReplay(m, func(client string, imqMessage *imq.ImqMessage) {
// 		if _, ok := webSockets[client]; ok {
// 			sendMessage(imqMessage.Data, webSockets[client])
// 		}

// 	}, func(imqMessage *imq.ImqMessage) *imq.ImqMessage {
// 		sendMessage(imqMessage.Data, webSockets[m.From])
// 		return nil
// 	})
// 	return nil
// }
func handler(m *imq.Msg) *imq.Msg {
	//fmt.Println("handler called ", string(m.Fields.MsgId()))
	return imq.Success(m)
}
func callback(m *imq.Msg) *imq.Msg {
	//fmt.Println("callback called ", string(m.Fields.MsgId()))
	return nil
}
func main() {
	//defer profile.Start(profile.CPUProfile, profile.ProfilePath(".")).Stop()
	imq.SetName("Server")
	imq.SetHandler("/temp", handler)
	c := 1000
	start := time.Now()
	for i := 0; i < c; i++ {
		msg := imq.Req("", "/temp", nil, callback)
		messageRecieved(msg.RawData)
	}
	elapsed := time.Since(start)
	fmt.Println(c, " Took ", elapsed)
	// imq.SetRelayHandler(relayHandler)
	// imq.SetBrokerHandler(brokerHandler)

}

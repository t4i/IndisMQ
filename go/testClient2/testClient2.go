package main

import (
	"bufio"
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"os"
	"strconv"
	"sync"
	schema "t4i/IndisRPC/Schema/IndisRPC"
	imq "t4i/IndisRPC/go/IndisRPC"
	"time"
)

var ws *websocket.Conn
var wg sync.WaitGroup
var sendLock sync.Mutex

func messageRecieved(message *[]byte) {
	m := imq.RecieveMessage(message)
	if m != nil && m.Data != nil {
		// fmt.Println("sending ", m)
		// fmt.Println(schema.EnumNamesMsgType[int(m.MsgType)], " ", schema.EnumNamesSts[int(m.Sts)], " ", schema.EnumNamesCmd[int(m.Cmd)])
		sendMessage(m.Data)
	}

}
func sendMessage(data *[]byte) {

	if data != nil {
		sendLock.Lock()
		er := ws.WriteMessage(2, *data)
		sendLock.Unlock()
		if er != nil {
			log.Println(er)
		}

	} else {
		fmt.Println("empty message")
	}

}
func recieve() {

	defer wg.Done()
	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			return
		}
		messageRecieved(&message)
	}
}
func main() {
	name := "Client2"
	fmt.Println(name)
	imq.SetName(name)
	var err error
	ws, _, err = websocket.DefaultDialer.Dial("ws://localhost:6000/test", nil)
	wg.Add(1)
	go recieve()
	if err != nil {
		log.Fatal("dial:", err)
	}
	// temp2 := imq.Sub("/hommy", func(imqMessage *imq.ImqMessage) *imq.ImqMessage {
	// 	fmt.Println("recieved hommy message")
	// 	imq.Rep(imqMessage, "", nil)
	// 	return imq.Success(imqMessage)
	// }, func(imqMessage *imq.ImqMessage) *imq.ImqMessage {
	// 	fmt.Println("callback ", imqMessage.ID, schema.EnumNamesSts[int(imqMessage.Sts)])
	// 	imq.DelMessage(imqMessage.ID)
	// 	return nil
	// })
	// sendMessage(temp2.Data)
	// reader := bufio.NewScanner(os.Stdin)
	// fmt.Print("Enter text: ")
	// reader.Scan()
	// text := reader.Text()
	// fmt.Println(text)
	imq.SetHandler(func(m *imq.ImqMessage) *imq.ImqMessage {
		fmt.Println(m.From, "says ", string(*m.Msg))
		getResponse()
		return nil
	}, "/hommy")
	sendMessage(imq.Sub("/hey", func(m *imq.ImqMessage) *imq.ImqMessage {
		fmt.Println("hey message recieved ", string(*m.Msg))
		return imq.Success(m)
	}, func(m *imq.ImqMessage) *imq.ImqMessage {
		if m.Sts == schema.StsSUCCESS {
			fmt.Println("subscribed")
		}
		return nil
	}).Data)
	//time.Sleep(time.Second * 2)
	for i := 0; i < 5; i++ {
		msg := []byte(strconv.Itoa(i))
		temp := imq.Queue(true, "/hey", &msg, nil, func(m *imq.ImqMessage) *imq.ImqMessage {
			fmt.Println("/hey callback ", m.From)
			return nil
		})
		sendMessage(temp.Data)
		time.Sleep(time.Second)
	}

	wg.Wait()
}
func getResponse() {
	reader := bufio.NewScanner(os.Stdin)
	fmt.Print("What do you say: ")
	reader.Scan()
	text := []byte(reader.Text())
	sendMessage(imq.Req("Client1", "/hommy", &text, nil).Data)
}

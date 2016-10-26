# IndisMQ (imq)

IndisMQ is a Messaging Library, you would find it somewhere between straight Wire Level Messaging libraries, and full Messaging Platforms it is commercially sponsored by t4i (t4i.io)

## This is to long for a readme and has too many opinions
Agreed, but currently its acting as a design intent document so it needs to be communicated, once the library becomes less of a concept this will be moved

## Why you ask?

We produce a commercial product (Indis aka INDustrial Information System) that provides a gateway (among other things) to industrial environments. When looking at existing messaging platforms, we found we ended up writing more code than we thought necessary to make it fit our needs, and were never entirely happy. So we currently use a number of technologies and libraries to see our commercial needs met, including substantial custom code, IndisMQ is an attempt to simplify our internal system and share it with the open source community.

## Whats different than XXXMQ

There are some excellent libraries out there, some far more stable/advanced/etc, than IndisMQ. Our biggest philosophical difference was the need for something in between a 'wire protocol' and a full platform. 

#### Whats wrong with a wire protocol

Abosultely nothing. Unless they are complicated. Our requirements were...
- Should be binary (go ahead, tell yourself your just sending text)
- Must be typesafe capable but not forced
- Must be small, with little overhead, but also recognize that this is not the most 'expensive' part of communication in most cases
- Must be understandable (from a protocol perspective not a human readable perspective)

With a straight wire protocol we always ended up writing the same boilerplate code, as a company we started using the excellent Flatbuffers project from google and decided that while there were good wire protocols out there we could build our system on, a simple one built around FB would fit our needs perfectly.

#### Why Flatbuffers

  Head over to there site to learn more (github.com/google/flatbuffers), but the simplified version is...
  Regardless of what wire format you use, there is a parse/unparse or encode/decode step. Doesn't matter if your using JSON or protocol buffers, it takes cpu/memory/time to get it in and out of the wire representation. FB alleviates this by allowing you to access the data as it was sent without the necessary conversion step.
  This is great for our system because we want to be as unobtrusive as possible and let you get to your payload without too much effort. It does have a couple trad-offs, like everything, but they are reasonable to get the performance you can achieve.
  
#### Why not JSON

JSON can be a lot of fun to program with, javascript engines such as Google's v8 or QT's QML engine are great at parsing them efficiently, so why the aversion. Experience, both bad and good. 

Outside of javascript performance is not always great, and when dealing in quantities of messages the time to convert and amount of copying/instantiating required to native types is non-trivial. 

Type safety is a huge benifit to any project that needs to be reliable or is intended to grow. Anytime you have to do a typeof statement, you are rolling your own type safety, and at a cost. Whether you like to admit it Javascript (in its current form) can't exist without a runtime environment, generally c++/c. And the 'typelessness' (word?) is really an abstraction not magic, and generally incurs some form of reflection hack on top of c++ to make it work behind the scenes.

Agreeing on a schema is not a bad thing, it offers any project of size a way to programmatically define an API. It is the same thing you  are doing when you define your API, but you get type safety. Defining APIs in FB is not difficult, but does require some forethought, and design, both of which are not bad things.

JSON is still great for public APIs because it makes it easy to integrate in any project. FBs recognizes this and includes support for to/from JSON in a lot of its libraries and the support is growing.

As a side note FB is currently testing a schemaless version that would allow typing on the fly rather than a compiled IDL. We plan to support this fully.

#### Whats wrong with a Messaging Platform

Absolutely nothing. Unless they are complicated. Ok, just trying to create a theme but our problem with Messaging Platforms is that they also tried to be communication libraries at the same time (by design). Which worked fine in testing, but once we were solving realworld problems, having our communication method pre-determined (i.e. One of... Socket, HTTP, HTTP2, etc) was just not realistic in our case. We needed to be able to communicate using any communication protocol, TCP, Websocket, HTTP, RS232, RS485, Bluetooth, Email (really, this came up), WebRTC Data Channel. So while they are feature rich and provide excellent performance, we had to draw the line here, it was to difficult for us to stay consistent across platforms and use cases. Not to mention, there are already amazing libraries for communication protocols, to even attempt to recreate those just doesn't make sense. 

We also needed our own style of RPCish messaging (async always, don't pretend its not).

#### So ...

With IndisMQ the goal was to make a messaging system on top of a wire protocol, without specifying the communication protocol. Thats it (well sort of, we do have some other goals/features you can read about below)

## How does it work

In its current implementation it works simply like this. You call one of the included functions for making the type of message you want, you send it to a recepient who has registered a handler (done like callbacks, rather than reflection) and returns a reply if one exists.

This works like an async RPC call, and can work through a Broker, or a Relay if the two parties are not directly connected. To have straight messaging w/o RPC simply leave out the callback. But you can use the RPC style in a messaging system to ensure delivery and take action on an error or if no reply is received.  

Also notice that because we have no 

(examples in GO using github.com/gorilla/websocket)

###Do Once
Wire up a sender function on sender and reciever
```go
func sendMessage(data *[]byte) {
	if data != nil { //check for nill data
		er := ws.WriteMessage(2, *data) //send using a gorilla websocket
		if er != nil { //check for errors
			log.Println(er)
		}
	}

}
```
Wire up a receiver function on sender and receiver
```go
//recieve function from gorilla tutorials
func receive(w *websocket.Conn) {
	defer w.Close()
	for {
		_, message, err := w.ReadMessage()
		if err != nil {
			break
		}
		m := imq.RecieveMessage(message)  //pass raw message to imq return a response
		if m != nil && m.Data != nil { //check if response is not nil
			sendMessage(m.Data) //send response
		}

	}
}
```
###Do for each Path (aka route or what have you)
Setup a Handler on the reciever (i.e. Server)
```go
imq.SetName("Server")
imq.SetHandler("/foo", fooHandler) //setup a path and a handler
...
func fooHandler(m *imq.Msg) *imq.Msg { //called whenever a message is recieved for "/foo"
	fmt.Println("/foo called")
  //do something fooish
	return imq.Success(m,"Success")
}
```
Send a Message on the sender (i.e. Client)
```go
imq.SetName("Client")
var m=imq.Req("Server", "/foo", []byte("custom message"), fooCallback) //make a request message
sendMessage(m.Data)
...
func fooCallback(m *imq.Msg) *imq.Msg { //called when the message is replied to
	if m.Fields.Sts == schema.StsSUCCESS {
		fmt.Println("woohoo foo was a success")
	}
	return nil
}
```

## Message Types and behaviors

###Request
```GO 
imq.Req(to string, dest string, msg []byte, callback Handler) *imq.MSg;
```
Builds a request to named receiver(optional, if omitted assumes receiver) at destination, with a custom message, and an optional callback

###Reply
```GO
func Rep(m *Msg, stsMsg string, msg []byte) *Msg
```
Builds a reply to message m, with stsMessage (convenience for sending simple string responses), and custom msg

###Sub
```GO
func Sub(path string, handler Handler, callback Handler) *Msg
```
Builds a Subscribe request for path, specifies a handler for when new messages are received at path, and a callback for responses for the sub request i.e. success messages

###Unsub
Opposite of Sub, Deletes handler

###Cast
```GO
func Cast(broker bool, path string, msg []byte, handler func(string, *Msg), callback Handler)
```
Builds a Multicast message i.e. deliver once per subscriber to path, with msg.

handler is called once per subscriber, and passes the client name, and the Msg. This allows you to send the message any number of ways as long as on your end, you make some sort of map from client name to connection when they first connect

callback is optional and will be called if a rep is received by any or all of the subscribers

returns true to denote success or failure

###Queue
```GO
Queue(broker bool, path string, msg []byte, handler func(string, *Msg), callback Handler) boolean
```
Same as Cast, but only delivers to a single subscriber in round-robin fashion to all subscribers of path. 
if false is returned continues to next subscriber

###Success
```GO
func Success(m *Msg, stsMsg string) *Msg 
```
Helper function that makes a simple Reply with sts==SUCCESS

###Err
```GO
func Err(m *Msg, stsMsg string, err int8) *Msg
```
Helper function that makes a simple Reply with sts==ERROR, optional stsMsg and err
```
enum Err:byte{NONE,NO_HANDLER, INVALID, REMOTE, TIMEOUT}
```
###Syn
```GO
func Syn(stsMsg string, callback Handler) *Msg 
```
Helper function that creates a Req that is automatically replied to (if wired up as above) so that client information can be set upon initial connection

##Payload Format
The payload, called a msg, is simply a collection of bytes, we recommend you use Flatbuffers to allow typesafety but you can send it any way you choose. Eventually we plan on supporting typed argument and returns, each as a Flatbuffers Table, and generate the neccessary code for compile time type checking when you make your schema.

##Current Status
Currently the project is in early alpha, so it is not recommended to use in production environments, use at your own risk.

##Language and supported OS

- C++ (STL and QT) Header only
- GO
- Typescript/Javascript

Currently no OS restrictions (outside of language support) testing done on Linux and Windows
##Planned Features (V0.X)
- [x] Callbacks-methods to call upon replies
- [x] Handlers-methods to call when message received at path
- [x] Brokers-Set a Broker Handler, to forward messages
- [x] Relay-Set a Relay Handler, to forward messages in an ad-hoc manner
- [x] Req-Rep Messages (RPC)
- [x] Cast Messages to multiple Recipients
- [x] Queue Messages (round robin)
- [x] Status Messages incl Error, Success
- [x] Command Message incl Subscribe, UnSubscribe, Sync
- [ ] Multi-Part messages, or Stream Messages
- [ ] Thread Safety
- [ ] Timeout Methods for messages-not automatic, must be invoked by user to avoid having a additional event loop 
- [ ] FB Schemaless (depends on fb release)
- [ ] Documentation and commented code
- [ ] Tests
- [ ] Usage Examples

###Planned Features (Beyond V1)
- [ ] Reflection?-Not convinced one way or other
- [ ] Partial and Wildcard path matching
- [ ] Code generator for FB RPC types
- [ ] Other languages?

##Unplanned Features (not intended unless a compelling argument can be made)

###Automatic Timeout Handling

Because implementing a timeout handler generally involves threading and event loops it uneccessarily complicates the library. By providing a funciton that the user can call, we will allow them to determine how best to handle timeouts or not at all.
###Built in Communication Protocols

It is the users choice to wire up and use whatever comm library they choose (one of the fundamental design concepts), however it may be worth while to provide helpers or shims against common communication libraries to make it easier to integrate

###Contributing

Feel free to leave issues (even philisophical or design ones) and we'll work through them with you. Pull requests are welcome but will require a contibutor agreement.

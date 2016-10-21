import fb from "../schema/flatbuffers";
import schema from "../schema/IndisMQ_generated";
export declare module imq {
    class Msg {
        data: fb.ByteBuffer;
        fields: schema.Imq;
        callback: Handler;
    }
    interface Handler {
        (m: Msg): Msg;
    }
    function setBrokerHandler(handler: Handler): void;
    function setRelayHandler(handler: Handler): void;
    function delMessage(id: string): void;
    function addSubscriber(client: string, path: string): void;
    function delSubscriber(client: string, path: string): void;
    function setHandler(path: string, handler: Handler): void;
    function syn(stsMsg: string, callback: Handler): Msg;
    function err(m: Msg, stsMsg: string, err: number): Msg;
    function success(m: Msg, stsMsg: string): Msg;
    function req(to: string, dest: string, msg: any, callback: Handler): Msg;
    function rep(m: Msg, stsMsg: string, msg: any): Msg;
    function sub(path: string, handler: Handler, callback: Handler): Msg;
    function unSub(path: string, handler: Handler, callback: Handler): Msg;
    function mult(broker: boolean, path: string, msg: any, handler: (client: string, m: Msg) => void, callback: Handler): Msg;
    function queue(broker: boolean, path: string, msg: any, handler: (client: string, m: Msg) => void, callback: Handler): Msg;
    function recieveRawData(data: Uint8Array): Msg;
}

#ifndef INDIS_RPC_H
#define INDIS_RPC_H

#include "../Schema/IndisRPC_Generated.h"
#include "../flatbuffers.h"
#include <unordered_map>
#include <map>
#include <mutex>
#include <time.h>
namespace schema=IndisRPC;
namespace rpc{
struct rpcStatus;
typedef bool (*rpcCallback)(std::shared_ptr<rpcStatus> rpc);
struct rpcStatus{
    std::shared_ptr<rpcCallback> callback;
    std::unique_ptr<uint8_t> reqData;
    int reqDataSize;
    std::unique_ptr<uint8_t> resData;
    int resDataSize;
    std::unique_ptr<std::vector<uint8_t>> data;
    schema::Sts sts;
    std::string id;
    schema::Err err;
    std::string msg;
    int rpcType;
    int retries;
    int retry;
    int timestamp;
    int timeout;
};
typedef void(*rpcHandler)(std::shared_ptr<rpcStatus> rpc);

typedef bool (*rpcSender)(uint8_t *data, int size);
typedef void (*statusFunc)(std::shared_ptr<rpcStatus> val);
std::unordered_map<int,std::unique_ptr<rpcHandler>> handlers;
rpcSender sender;
std::unordered_map<std::string,std::shared_ptr<rpcStatus>> status;
std::mutex statusLock;


std::shared_ptr<rpcStatus> getRPCStatus(std::string id){
    auto it=status.find(id);

    if(it==status.end()){
        std::shared_ptr<rpcStatus> rpcStatus(new rpcStatus);
        status[id]=rpcStatus;
        return rpcStatus;
    }
    else{
        return status[id];
    }

}




void callCallback(std::shared_ptr<rpcStatus> rpc){
    auto temp=status;
    if(rpc!=NULL&&rpc->rpcType!=NULL){
        auto callbackPtr=rpc->callback;
        if(callbackPtr!=NULL){
            auto callback=*callbackPtr;
            callback(rpc);
        }
    }
}

template<typename statusFunc>
void writeStatus(std::string id,statusFunc f){
    f(getRPCStatus(id));
}
template<typename statusFunc>
void readStatus(std::string id,statusFunc f){
    f(getRPCStatus(id));
}

void delStatus(std::string id){
    //status.erase(id);
}
void setHandler(rpcHandler *handler, int rpcType){
    handlers[rpcType]=std::unique_ptr<rpcHandler>(handler);
}
rpcHandler* getHandler(int rpcType){
    auto handler=handlers.find(rpcType);
    if(handler!=handlers.end()){
        return handlers[rpcType].get();
    }
    return NULL;
}



void setSender(rpcSender *senderFunc){
    sender=*senderFunc;
}
rpcSender getSender(){
    return sender;
}
void sendRaw(std::string id, int rpcType, schema::State state, schema::Sts sts,std::string msg, std::vector<uint8_t> &data);
void sendStatus(std::string id, schema::Sts sts, std::string msg=NULL){
    sendRaw(id,-1,schema::State::STS,sts,msg,std::vector<uint8_t>());
}

void callHandler(std::shared_ptr<rpcStatus> rpc){
    if(rpc!=NULL&&rpc->rpcType!=NULL){
        auto handlerPtr=getHandler(rpc->rpcType);
        if(handlerPtr!=NULL){
            auto handler=*handlerPtr;
            handler(rpc);
        }
    }

}
int seq=1;
void sendRawReq(int rpcType,std::vector<uint8_t>& data, int timeout=NULL, int retries=NULL, rpcCallback* callback=NULL){
    std::string uuid=std::to_string(seq);
    seq++;
    auto timestamp=time(NULL);
    writeStatus(uuid,[&](std::shared_ptr<rpcStatus> val){
        if(callback){
            val->callback=std::shared_ptr<rpcCallback>(callback);
        }
        val->timestamp=timestamp;
        if(timeout!=NULL){
            val->timeout=timeout;
        }
        val->retries=retries;
        val->retry=0;

    });




    sendRaw(uuid,rpcType,schema::State::REQ,schema::Sts::SENT,"",data);
}
void resendRawReq(std::shared_ptr<rpcStatus> rpc){
    writeStatus(rpc->id, [&](std::shared_ptr<rpcStatus> val) {
        val->retry++;
        val->timestamp=time(NULL);
    });
    auto status=getRPCStatus(rpc->id);
    sender(status->reqData.get(),status->reqDataSize);
    //    readStatus(rpc->id,[](std::shared_ptr<rpcStatus> val){
    //       sender(val->reqData.get(),val->reqDataSize);
    //    });

}

void sendRawRes(std::string id, std::string msg,std::vector<uint8_t>& data){
    sendRaw(id,-1,schema::State::RES,schema::Sts::RECIEVED,msg,data);
}
void sendRaw(std::string id, int rpcType, schema::State state, schema::Sts sts, std::string msg, std::vector<uint8_t>& data){
    flatbuffers::FlatBufferBuilder builder;
    auto rpcID=builder.CreateString(id);
    auto dataOffset=builder.CreateVector(data);
    auto message=builder.CreateString(msg);
    schema::RPCBuilder rpcBuilder(builder);
    rpcBuilder.add_Id(rpcID);
    rpcBuilder.add_State(state);
    rpcBuilder.add_State(schema::State::REQ);
    if(&data!=NULL){

        rpcBuilder.add_Data(dataOffset);
    }
    if(!msg.empty()){

        rpcBuilder.add_StsMsg(message);
    }
    if(rpcType!=-1){
        rpcBuilder.add_Type(rpcType);
    }
    auto rpc=rpcBuilder.Finish();
    builder.Finish(rpc);
    uint8_t* buf=builder.GetBufferPointer();
    auto size=builder.GetSize();
    writeStatus(id, [&](std::shared_ptr<rpcStatus> val) {
        val->id = id;
        val->sts = sts;
        val->rpcType=rpcType;
        if (rpcType == (int)schema::State::REQ) {
            val->reqData = std::unique_ptr<uint8_t>(buf);
            val->reqDataSize=size;
        }
        if (rpcType == (int)schema::State::RES) {
            val->resData = std::unique_ptr<uint8_t>(buf);
            val->resDataSize=size;
        }
        if (&data != NULL) {
            val->data = std::unique_ptr<std::vector<uint8_t>>(&data);
        }
    });
    sender(buf,size);

}

void recieveRawData(const void *data){

    auto rpc=schema::GetRPC(data);
    auto id=rpc->Id()->str();
    auto rawData=(uint8_t*)rpc->Data()->data();
    switch(rpc->State()){
    case schema::State::REQ:
    {
        writeStatus(id,[&](std::shared_ptr<rpcStatus> val){
            val->reqData=std::unique_ptr<uint8_t>(rawData);
        });
        callHandler(getRPCStatus(id));
    }
        break;
    case schema::State::RES:
    {
        writeStatus(id,[&](std::shared_ptr<rpcStatus> val){
            val->resData=std::unique_ptr<uint8_t>(rawData);
            val->sts=schema::Sts::RECIEVED;
            callCallback(val);
            delStatus(id);
        });

    }
        break;
    case schema::State::STS:
    {
        switch(rpc->Sts()){
        case schema::Sts::ERROR:
            writeStatus(id,[&](std::shared_ptr<rpcStatus> val){
                val->sts=schema::Sts::ERROR;
                val->err=rpc->Err();
                val->msg=rpc->StsMsg()->str();
                callCallback(val);
            });
            break;
        case schema::Sts::SENT:
            writeStatus(id,[&](std::shared_ptr<rpcStatus> val){val->sts=schema::Sts::SENT;});
            break;
        case schema::Sts::ACK:
            writeStatus(id,[&](std::shared_ptr<rpcStatus> val){val->sts=schema::Sts::ACK;});
            break;
        case schema::Sts::RECIEVED:
            writeStatus(id,[&](std::shared_ptr<rpcStatus> val){
                val->resData=std::unique_ptr<uint8_t>(rawData);
                val->sts=schema::Sts::RECIEVED;
                callHandler(getRPCStatus(id));
                delStatus(id);
            });

            break;
        case schema::Sts::CANCELED:
            writeStatus(id,[&](std::shared_ptr<rpcStatus> val){delStatus(id);});
            break;
        case schema::Sts::FINISHED:;
            writeStatus(id,[&](std::shared_ptr<rpcStatus> val){delStatus(id);});
            break;
        }
    }
        break;
    default:;
        break;
    }
}
}
//std::string newUUID(){

//}


#endif // INDIS_RPC_H

#ifndef INDIS_RPC_H
#define INDIS_RPC_H

#define V_MAJOR 0
#define V_MINOR 1
#include "../schema/IndisMQ_Generated.h"
#include "../third_party/flatbuffers/include/flatbuffers/flatbuffers.h"
#include <unordered_map>
#include <map>
#include <mutex>
#include <time.h>
#ifdef QT_CORE_LIB
#include <QDebug>
#include <QByteArray>
#include <QString>

#else

#endif
#ifdef QT_CORE_LIB
#define BUFFER_TYPE QByteArray
#define STRING_TYPE QString
#else
#define BUFFER_TYPE std::unique_ptr<uint8_t>
#define STRING_TYPE std::string
#endif
namespace schema=IndisMQ;
namespace imq{
struct Msg;
typedef std::shared_ptr<Msg> shared_msg;
typedef shared_msg (*Handler)(shared_msg &m);
std::string newUid( size_t length =16 )
{
    auto randchar = []() -> char
    {
            const char charset[] =
            "0123456789"
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyz";
            const size_t max_index = (sizeof(charset) - 1);
            return charset[ rand() % max_index ];
};
std::string str(length,0);
std::generate_n( str.begin(), length, randchar );
return str;
}
struct Msg{
    Handler callback;
    const schema::Imq* fields;
#ifdef QT_CORE_LIB
    QByteArray data;
    void setFbData(flatbuffers::unique_ptr_t _data,int size){
        fbData=std::move(_data);
        data=QByteArray::fromRawData(reinterpret_cast<const char *>(fbData.get()),size);
    }
#else
    uint8_t* data;
    int dataSize;
    void setFbData(flatbuffers::unique_ptr_t _data, int size){
        fbData=std::move(_data);
        data=fbData.get();
        datasize=size;
    }
#endif
private:
    flatbuffers::unique_ptr_t fbData;

    //    to convert fb vector to std vector new std::vector<uint8_t>(fields->Body()->data(),fields->Body()->data()+fields->Body()->size())
};

std::string name="unamed";
void setName(std::string newName){
    name=newName;
}

std::unordered_map<std::string,Handler> handlers;
Handler brokerHandler;
Handler relayHandler;

std::unordered_map<std::string,std::shared_ptr<Msg>> messages;
std::unordered_map<std::string,std::unordered_map<std::string,bool>> subscribers;
std::unique_ptr<Msg> makeImq(std::string id, std::string from, std::string to, bool broker, std::string path,
                             schema::MsgType msgType, schema::Sts sts, schema::Cmd cmd, std::string stsMsg, schema::Err err, std::unique_ptr<std::vector<uint8_t>> body,Handler callback);
bool debug=false;

void setBrokerHandler(Handler handler){
    brokerHandler=handler;
}
void setRelayHandler(Handler handler){
    relayHandler=handler;
}




//m->rawData=std::move(std::unique_ptr<uint8_t>(data));
#ifdef QT_CORE_LIB
std::unique_ptr<Msg> parseMsg(BUFFER_TYPE data){
    if(data.isEmpty()){
        return nullptr;
    }
    std::unique_ptr<Msg> m=std::unique_ptr<Msg>(new Msg());
    m->data=data;
    m->fields=schema::GetImq(m->data.data());
    return m;
}
#endif
#ifndef QT_CORE_LIB //this would be useful for qt but needs to be worked out
std::unique_ptr<Msg> parseMsg(std::unique_ptr<uint8_t> data, int dataSize){
    if(data==nullptr){
        return nullptr;
    }
    std::unique_ptr<Msg> m=std::unique_ptr<Msg>(new Msg());

    //unimplemented

    m->data(flatbuffers::unique_ptr_t(data.release(),[](uint8_t* p){delete [] p;});
    //m->fields=schema::GetImq(m->rawData.get());
    m->rawDataSize=dataSize;

    return m;
}
#endif

Msg* getImqMessage(std::string id){
    auto it=messages.find(id);
    if(it==messages.end()){
        return nullptr;
    }
    return messages[id].get();
}

//template<typename statusFunc>
//void writeStatus(std::string id,statusFunc f){
//    f(getRPCStatus(id));
//}
//template<typename statusFunc>
//void readStatus(std::string id,statusFunc f){
//    f(getRPCStatus(id));
//}

void delMessage(std::string id){
    messages.erase(id);
}

void addSubscriber(std::string client, std::string path){
    auto it=subscribers.find(path);
    if(it==subscribers.end()){
        subscribers[path]=std::unordered_map<std::string,bool>();
    }
    subscribers[path][client]=false;
}
void delSubscriber(std::string client, std::string path){
    auto it=subscribers.find(path);
    if(it!=subscribers.end()){
        subscribers[path].erase(client);
    }
}

void setHandler(std::string path,Handler handler){
    handlers[path]=handler;
}

Handler getHandler(std::string path){
    auto handler=handlers.find(path);
    if(handler!=handlers.end()){
        return handlers[path];
    }
    return nullptr;
}


std::unique_ptr<Msg> syn(std::string stsMsg, Handler callback){
    std::string uid=newUid();
    return makeImq(uid,name,"",false,"",schema::MsgType::CMD,schema::Sts::REQ,schema::Cmd::SYN,stsMsg,schema::Err::NONE,nullptr,callback);
}

std::unique_ptr<Msg> err (std::shared_ptr<Msg> &m,std::string stsMsg, schema::Err err){
    return makeImq(m->fields->MsgId()->str(),name,m->fields->From()->str(),m->fields->Broker(),m->fields->Path()->str(),
                   m->fields->MsgType(),schema::Sts::ERROR,m->fields->Cmd(),stsMsg,err,nullptr,nullptr);
}

std::unique_ptr<Msg> success (std::shared_ptr<Msg> &m,std::string stsMsg){
    return makeImq(m->fields->MsgId()->str(),name,m->fields->From()->str(),m->fields->Broker(),m->fields->Path()->str(),
                   m->fields->MsgType(),schema::Sts::SUCCESS,m->fields->Cmd(),stsMsg,schema::Err::NONE,nullptr,nullptr);
}
std::shared_ptr<Msg> req(std::string to, std::string dest,std::string stsMsg, std::unique_ptr<std::vector<uint8_t>> body,Handler callback){
    std::string uid=newUid();
    auto m=std::shared_ptr<Msg>(std::move(makeImq(uid,name,to,false,dest,schema::MsgType::PEER,schema::Sts::REQ,
                                                  schema::Cmd::NONE,"",schema::Err::NONE,std::move(body),callback)));
    if(callback){
        messages[uid]=m;
    }
    return m;
}
std::unique_ptr<Msg>& rep (std::shared_ptr<Msg> &m,std::string stsMsg,std::unique_ptr<std::vector<uint8_t>> body){

    return makeImq(m->fields->MsgId()->str(),name,m->fields->From()->str(),m->fields->Broker(),m->fields->Path()->str(),
                   m->fields->MsgType(),schema::Sts::SUCCESS,m->fields->Cmd(),stsMsg,schema::Err::NONE,std::move(body),nullptr);
}
std::shared_ptr<Msg>& sub(std::string path,Handler handler,Handler callback){
    std::string uid=newUid();
    if(handler){
        setHandler(path,handler);
    }
    auto m=std::shared_ptr<Msg>(std::move(makeImq(uid,name,"",false,path,schema::MsgType::CMD,schema::Sts::REQ,
                                                  schema::Cmd::SUB,"",schema::Err::NONE,nullptr,callback)));
    if(callback){
        messages[uid]=m;
    }
    return m;
}

std::shared_ptr<Msg>& unSub(std::string path, Handler callback){
    std::string uid=newUid();
    handlers.erase(path);
    auto m=std::shared_ptr<Msg>(std::move(makeImq(uid,name,"",false,"",schema::MsgType::CMD,
                                                  schema::Sts::SUCCESS,schema::Cmd::UNSUB,"",schema::Err::NONE,nullptr,callback)));
    if(callback){
        messages[uid]=m;
    }
    return m;
}
void sendMult(std::shared_ptr<Msg>& m,void(*f)(std::string client,std::shared_ptr<Msg>& m)){
    std::string path=m->fields->Path()->str();
    for (auto i: subscribers[path]){
        f(i.first,m);
    }
}
void sendQueue(std::shared_ptr<Msg> &m,void(*f)(std::string client,std::shared_ptr<Msg>& m)){
    bool success=false;
    bool takeNext=false;
    std::string path=m->fields->Path()->str();
    for (auto i: subscribers[path]){
        if(takeNext){
            f(i.first,m);
            subscribers[path][i.first]=true;
            success=true;
        }
        if(i.second){
            takeNext=true;
            subscribers[path][i.first]=false;
        }
    }
    if(!success){
        for (auto i: subscribers[path]){
            f(i.first,m);
            subscribers[path][i.first]=true;
        }
    }
}
void brokerReplay(Msg *m,void(*f)(std::string, std::shared_ptr<Msg>& m),Handler callback){

    std::unique_ptr<std::vector<uint8_t>> body(new std::vector<uint8_t>(m->fields->Body()->data(),m->fields->Body()->data()+m->fields->Body()->size()));
    auto r=std::shared_ptr<Msg>(std::move(makeImq(m->fields->MsgId()->str(),m->fields->To()->str(),m->fields->From()->str(),false,m->fields->Path()->str(),
                                                  m->fields->MsgType(),m->fields->Sts(),m->fields->Cmd(),m->fields->StsMsg()->str(),m->fields->Err(),std::move(body),callback)));
    if( m->fields->MsgType()==schema::MsgType::MULT){

        sendMult(std::move(r),f);
    }
    else{
        sendQueue(r,f);
    }

}


std::shared_ptr<Msg>& Mult(bool broker, std::string path, std::unique_ptr<std::vector<uint8_t>> body,
                           void(*f)(std::string, std::shared_ptr<Msg>& m),Handler callback ){
    std::string uid=newUid();
    auto m=std::shared_ptr<Msg>(std::move(makeImq(uid,name,"",broker,path,schema::MsgType::MULT,schema::Sts::REQ,
                                                  schema::Cmd::NONE,"",schema::Err::NONE,std::move(body),callback)));

    if(!broker){
        sendMult(m,f);
    }
    if(callback){
        messages[uid]=m;
    }
    return m;

}



std::shared_ptr<Msg>& Queue(bool broker, std::string path, std::unique_ptr<std::vector<uint8_t>> body,
                            void(*f)(std::string, std::shared_ptr<Msg>& m),Handler callback){
    std::string uid=newUid();
    auto m=std::shared_ptr<Msg>(std::move(makeImq(uid,name,"",broker,path,schema::MsgType::QUEUE,schema::Sts::REQ,
                                                  schema::Cmd::NONE,"",schema::Err::NONE,std::move(body),callback)));

    if(!broker){
        sendQueue(m,f);
    }
    if(callback){
        messages[uid]=m;
    }
    return m;

}


std::unique_ptr<Msg> makeImq(std::string id, std::string from, std::string to, bool broker, std::string path,
                             schema::MsgType msgType, schema::Sts sts, schema::Cmd cmd, std::string stsMsg, schema::Err err, std::unique_ptr<std::vector<uint8_t>> body,Handler callback){
    std::unique_ptr<Msg> m(new Msg());

    flatbuffers::FlatBufferBuilder builder;
    auto idOffset=builder.CreateString(id);
    auto fromOffset=builder.CreateString(from);
    auto toOffset=builder.CreateString(to);
    auto pathOffset=builder.CreateString(path);
    flatbuffers::Offset<flatbuffers::Vector<uint8_t>> dataOffset;
    if(body){
        dataOffset=builder.CreateVector(*body);
    }
    auto message=builder.CreateString(stsMsg);
    schema::ImqBuilder imqBuilder(builder);
    imqBuilder.add_MsgId(idOffset);
    imqBuilder.add_From(fromOffset);
    imqBuilder.add_To(toOffset);
    imqBuilder.add_Broker(broker);
    imqBuilder.add_Path(pathOffset);
    imqBuilder.add_MsgType(msgType);
    imqBuilder.add_Sts(sts);
    imqBuilder.add_Cmd(cmd);
    if(!stsMsg.empty()){

        imqBuilder.add_StsMsg(message);
    }
    imqBuilder.add_Err(err);
    if(body){

        imqBuilder.add_Body(dataOffset);
    }

    auto imq=imqBuilder.Finish();
    builder.Finish(imq);
    auto size=builder.GetSize();
    auto buf=builder.ReleaseBufferPointer();
    if(callback){
        m->callback=callback;

    }
    m->fields=schema::GetImq(buf.get());
    m->setFbData(std::move(buf),size);
    return m;
}
std::shared_ptr<Msg> handleCmd(std::shared_ptr<Msg>& m){
    auto sts=m->fields->Sts();
    if(sts==schema::Sts::REQ){
        std::shared_ptr<Msg> r;
        switch(m->fields->Cmd()){
        case schema::Cmd::SUB:
            addSubscriber(m->fields->From()->str(),m->fields->Path()->str());
            r=std::shared_ptr<Msg>(std::move(success(m,"")));
            break;
        case schema::Cmd::UNSUB:
            delSubscriber(m->fields->From()->str(),m->fields->Path()->str());
            return nullptr;
            break;
        case schema::Cmd::SYN:
            r=std::shared_ptr<Msg>(std::move(success(m,"")));
            break;
        default:
            break;
        }
        return r;
    }else{
        auto imq=getImqMessage(m->fields->MsgId()->str());
        if(imq&&imq->callback){
            imq->callback(m);
        }
        delMessage(m->fields->MsgId()->str());
        return nullptr;
    }
}





#ifdef QT_CORE_LIB
std::shared_ptr<Msg> recieveRawData(BUFFER_TYPE data){
    if(data.isEmpty()){
        return nullptr;
    }
    auto m=std::shared_ptr<Msg>(std::move(parseMsg(data)));
#else
std::shared_ptr<Msg> recieveRawData(BUFFER_TYPE data,int dataSize=NULL){
    auto m=std::shared_ptr<Msg>(std::move(parseMsg(std::move(data),dataSize)));
    if (!data){
        return nullptr;
    }

#endif
std::shared_ptr<Msg> reply;
    //    std::unique_ptr<Msg> n=std::unique_ptr<Msg>(new Msg());
    //    n->fields=schema::GetImq(data);
    //    //n->rawData=std::move(std::unique_ptr<uint8_t>(data));
    //    //n->rawDataSize=dataSize;
    //    auto m=std::shared_ptr<Msg>(std::move(n));

    //qDebug()<<m->fields->MsgId()->c_str();
    if (!m){
        return nullptr;
    }
    if(m->fields->Broker()){ //its a broker req
        if(brokerHandler){

            reply=brokerHandler(m);
        }else{
            reply=std::shared_ptr<Msg>(std::move(err(m,"Not a Broker",schema::Err::NO_HANDLER)));
        }
    }else if(!m->fields->To()->str().empty()&&m->fields->To()->str()!=name){ //its a relay
        if(relayHandler){
            reply=relayHandler(m);
        }else{
            reply=err(m,"Not a Relay", schema::Err::NO_HANDLER);
        }
    }else if(m->fields->MsgType()==schema::MsgType::CMD){ //its a cmd
        reply=handleCmd(m);
    }else if(m->fields->Sts()==schema::Sts::REQ){ //its a new req
        if(auto handler=getHandler(m->fields->Path()->str())){
            reply=handler(m);
        }
    }else{ //its a reply
        auto imq=getImqMessage(m->fields->MsgId()->str());
        if(imq&&imq->callback){
            imq->callback(m);
        }
        delMessage(m->fields->MsgId()->str());
        return nullptr;
    }
    return reply;
}
}



#endif // INDIS_RPC_H

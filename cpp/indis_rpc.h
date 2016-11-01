#ifndef INDIS_RPC_H
#define INDIS_RPC_H

#define V_MAJOR 0
#define V_MINOR 1
#include "../schema/IndisMQ_Generated.h"
#include "../../flatbuffers/include/flatbuffers/flatbuffers.h"
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
class Imq{
public:
template<typename T>
struct Msg;
typedef Msg<schema::Imq> iMsg;
typedef std::shared_ptr<iMsg> shared_msg;
typedef std::function<shared_msg(shared_msg&)> Handler;
inline static std::string newUid( size_t length =16 )
{
    auto randchar = []() -> char {
        const char charset[] =
            "0123456789"
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyz";
        const size_t max_index = (sizeof(charset) - 1);
        return charset[rand() % max_index];
    };
    std::string str(length, 0);
    std::generate_n(str.begin(), length, randchar);
    return str;
}

template <class T>
struct Msg
{
    Handler callback;
    const T *fields;
#ifdef QT_CORE_LIB
    QByteArray data;
    Msg(){}
    Msg(flatbuffers::unique_ptr_t _data,int size){
        fbData=std::move(_data);
        fields=flatbuffers::GetRoot<T>(fbData.get());
        data=QByteArray::fromRawData(reinterpret_cast<const char *>(fbData.get()),size);
    }
    Msg(QByteArray _data){
        data=_data;
        fields=flatbuffers::GetRoot<T>(data.data());
    }

#else
    uint8_t *data;
    int dataSize;
    void setFbData(flatbuffers::unique_ptr_t _data, int size)
    {
        fbData = std::move(_data);
        data = fbData.get();
        datasize = size;
    }
#endif
  private:
    flatbuffers::unique_ptr_t fbData;

    //    to convert fb vector to std vector new std::vector<uint8_t>(fields->Body()->data(),fields->Body()->data()+fields->Body()->size())
};

inline static std::string name(std::string newName=""){
    static std::string name;
    if(newName!=""){
        name=newName;
    }
    if(name==""){
        name="unnamed";
    }
    return name;
}



std::unordered_map<std::string,Handler> handlers;
Handler brokerHandler;
Handler relayHandler;
std::function<void()> onReady=[](){};
std::unordered_map<std::string,std::shared_ptr<iMsg>> messages;
std::unordered_map<std::string,std::unordered_map<std::string,bool>> subscribers;
//static bool debug=false;

inline void setBrokerHandler(Handler handler)
{
    brokerHandler = handler;
}
inline void setRelayHandler(Handler handler)
{
    relayHandler = handler;
}

//m->rawData=std::move(std::unique_ptr<uint8_t>(data));
#ifdef QT_CORE_LIB
inline std::unique_ptr<iMsg> parseMsg(BUFFER_TYPE data)
{
    if (data.isEmpty())
    {
        return nullptr;
    }
    std::unique_ptr<iMsg> m = std::unique_ptr<iMsg>(new iMsg(data));
    return m;
}
#endif
#ifndef QT_CORE_LIB //this would be useful for qt but needs to be worked out
inline std::unique_ptr<Msg> parseMsg(std::unique_ptr<uint8_t> data, int dataSize)
{
    if (data == nullptr)
    {
        return nullptr;
    }
    std::unique_ptr<Msg> m = std::unique_ptr<Msg>(new Msg());

    //unimplemented

    m->data(flatbuffers::unique_ptr_t(data.release(),[](uint8_t* p){
        delete[] p;});
    //m->fields=schema::GetImq(m->rawData.get());
    m->rawDataSize=dataSize;

    return m;
}
#endif

inline iMsg *getImqMessage(std::string id)
{
    auto it = messages.find(id);
    if (it == messages.end())
    {
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

inline void delMessage(std::string id)
{
    messages.erase(id);
}

inline void addSubscriber(std::string client, std::string path)
{
    auto it = subscribers.find(path);
    if (it == subscribers.end())
    {
        subscribers[path] = std::unordered_map<std::string, bool>();
    }
    subscribers[path][client] = false;
}
inline void delSubscriber(std::string client, std::string path)
{
    auto it = subscribers.find(path);
    if (it != subscribers.end())
    {
        subscribers[path].erase(client);
    }
}

inline bool hasSubscriber(std::string path){
    auto it=subscribers.find(path);
    if(it==subscribers.end()){
        return false;
    }
    return true;
}

inline void setHandler(std::string path,Handler handler){
    handlers[path]=handler;
}

inline Handler getHandler(std::string path)
{
    auto handler = handlers.find(path);
    if (handler != handlers.end())
    {
        return handlers[path];
    }
    return nullptr;
}

inline std::shared_ptr<iMsg> syn(std::string stsMsg, Handler callback){
    std::string uid=newUid();
    auto m=std::shared_ptr<iMsg>(std::move(makeImq(uid,name(),"",false,"",schema::MsgType::CMD,schema::Sts::REQ,schema::Cmd::SYN,stsMsg,schema::Err::NONE,nullptr,callback)));
    if(callback){
        messages[uid]=m;
    }
    return m;
}
inline std::unique_ptr<iMsg> err (std::shared_ptr<iMsg> &m,std::string stsMsg, schema::Err err){
    return makeImq(m->fields->MsgId()->str(),name(),m->fields->From()->str(),m->fields->Broker(),m->fields->Path()->str(),
                   m->fields->MsgType(),schema::Sts::ERROR,m->fields->Cmd(),stsMsg,err,nullptr,nullptr);
}

inline std::unique_ptr<iMsg> success (std::shared_ptr<iMsg> &m,std::string stsMsg){
    return makeImq(m->fields->MsgId()->str(),name(),m->fields->From()->str(),m->fields->Broker(),m->fields->Path()->str(),
                   m->fields->MsgType(),schema::Sts::SUCCESS,m->fields->Cmd(),stsMsg,schema::Err::NONE,nullptr,nullptr);
}
inline std::shared_ptr<iMsg> req(std::string to, std::string dest,std::string stsMsg, BUFFER_TYPE body,Handler callback){
    std::string uid=newUid();
    auto m=std::shared_ptr<iMsg>(std::move(makeImq(uid,name(),to,false,dest,schema::MsgType::SINGLE,schema::Sts::REQ,
                                                  schema::Cmd::NONE,"",schema::Err::NONE,std::move(body),callback)));
    if(callback){
        messages[uid]=m;

    }
    return m;
}

inline std::shared_ptr<iMsg> ready(std::string to, std::string dest, std::string stsMsg, Handler callback)
{
    std::string uid = newUid();
    auto m = std::shared_ptr<iMsg>(std::move(makeImq(uid, name(), to, false, dest,
                     schema::MsgType::CMD, schema::Sts::REQ, schema::Cmd::READY, stsMsg, schema::Err::NONE, nullptr, callback)));
    if (callback)
    {
        messages[uid] = m;
    }
    return m;
}

inline std::unique_ptr<iMsg> rep(std::shared_ptr<iMsg> &m, std::string stsMsg, BUFFER_TYPE body)
{

    return makeImq(m->fields->MsgId()->str(),name(),m->fields->From()->str(),m->fields->Broker(),m->fields->Path()->str(),
                   m->fields->MsgType(),schema::Sts::SUCCESS,m->fields->Cmd(),stsMsg,schema::Err::NONE,std::move(body),nullptr);
}
inline std::shared_ptr<iMsg> sub(std::string path, Handler handler, Handler callback)
{
    std::string uid = newUid();
    if (handler)
    {
        setHandler(path, handler);
    }
    auto m=std::shared_ptr<iMsg>(std::move(makeImq(uid,name(),"",false,path,schema::MsgType::CMD,schema::Sts::REQ,
                                                  schema::Cmd::SUB,"",schema::Err::NONE,nullptr,callback)));
    if(callback){
        messages[uid]=m;

    }
    return m;
}

inline std::shared_ptr<iMsg> unSub(std::string path, Handler callback)
{
    std::string uid = newUid();
    handlers.erase(path);
    auto m=std::shared_ptr<iMsg>(std::move(makeImq(uid,name(),"",false,"",schema::MsgType::CMD,
                                                  schema::Sts::SUCCESS,schema::Cmd::UNSUB,"",schema::Err::NONE,nullptr,callback)));
    if(callback){
        messages[uid]=m;
    }
    return m;
}
inline void sendMult(std::shared_ptr<iMsg>& m,std::function<void(std::string, std::shared_ptr<iMsg>& m)> f){
    std::string path=m->fields->Path()->str();
    for (auto i: subscribers[path]){
        f(i.first,m);
    }
}
inline void sendQueue(std::shared_ptr<iMsg> &m,std::function<void(std::string, std::shared_ptr<iMsg>& m)> f){
    bool success=false;
    bool takeNext=false;
    std::string path=m->fields->Path()->str();
    for (auto i: subscribers[path]){
        if(takeNext){
            f(i.first,m);
            subscribers[path][i.first]=true;
            success=true;

        }
        if (i.second)
        {
            takeNext = true;
            subscribers[path][i.first] = false;
        }
    }
    if (!success)
    {
        for (auto i : subscribers[path])
        {
            f(i.first, m);
            subscribers[path][i.first] = true;
        }
    }
}
inline void brokerReplay(iMsg *m,std::function<void(std::string, std::shared_ptr<iMsg>& m)> f,Handler callback){

#ifdef QT_CORE_LIB
    auto body = QByteArray::fromRawData(reinterpret_cast<const char *>(m->fields->Body()->data()), m->fields->Body()->size());
#else
    std::unique_ptr<std::vector<uint8_t>> body(new std::vector<uint8_t>(m->fields->Body()->data(), m->fields->Body()->data() + m->fields->Body()->size()));
#endif
    auto r = std::shared_ptr<iMsg>(std::move(makeImq(m->fields->MsgId()->str(), m->fields->To()->str(), m->fields->From()->str(), false, m->fields->Path()->str(),
                                                     m->fields->MsgType(), m->fields->Sts(), m->fields->Cmd(), m->fields->StsMsg()->str(), m->fields->Err(), std::move(body), callback)));
    if (m->fields->MsgType() == schema::MsgType::CAST)
    {

        sendMult(std::move(r), f);
    }
    else
    {
        sendQueue(r, f);
    }
}

inline std::shared_ptr<iMsg> Mult(bool broker, std::string path, BUFFER_TYPE body,

                           std::function<void(std::string, std::shared_ptr<iMsg>& m)> f,Handler callback ){
    std::string uid=newUid();
    auto m=std::shared_ptr<iMsg>(std::move(makeImq(uid,name(),"",broker,path,schema::MsgType::CAST,schema::Sts::REQ,
                                                  schema::Cmd::NONE,"",schema::Err::NONE,std::move(body),callback)));

    if (!broker)
    {
        sendMult(m, f);
    }
    if (callback)
    {
        messages[uid] = m;
    }
    return m;
}

inline std::shared_ptr<iMsg> Queue(bool broker, std::string path, BUFFER_TYPE body,
                            std::function<void(std::string, std::shared_ptr<iMsg>& m)> f,Handler callback){
    std::string uid=newUid();
    auto m=std::shared_ptr<iMsg>(std::move(makeImq(uid,name(),"",broker,path,schema::MsgType::QUEUE,schema::Sts::REQ,
                                                  schema::Cmd::NONE,"",schema::Err::NONE,std::move(body),callback)));


    if (!broker)
    {
        sendQueue(m, f);
    }
    if (callback)
    {
        messages[uid] = m;
    }
    return m;
}

inline std::unique_ptr<iMsg> makeImq(std::string id, std::string from, std::string to, bool broker, std::string path,
                                     schema::MsgType msgType, schema::Sts sts, schema::Cmd cmd, std::string stsMsg, schema::Err err, BUFFER_TYPE body, Handler callback)
{

    flatbuffers::FlatBufferBuilder builder;
    auto idOffset = builder.CreateString(id);
    auto fromOffset = builder.CreateString(from);
    auto toOffset = builder.CreateString(to);
    auto pathOffset = builder.CreateString(path);
    flatbuffers::Offset<flatbuffers::Vector<uint8_t>> dataOffset;

#ifdef QT_CORE_LIB

    if (!body.isEmpty())
    {
        dataOffset = builder.CreateVector(reinterpret_cast<uint8_t *>(body.data()), body.size());
#else
    if (body)
    {
        dataOffset = builder.CreateVector(*body);
#endif
    }
    auto message = builder.CreateString(stsMsg);
    schema::ImqBuilder imqBuilder(builder);
    imqBuilder.add_MsgId(idOffset);
    imqBuilder.add_From(fromOffset);
    imqBuilder.add_To(toOffset);
    imqBuilder.add_Broker(broker);
    imqBuilder.add_Path(pathOffset);
    imqBuilder.add_MsgType(msgType);
    imqBuilder.add_Sts(sts);
    imqBuilder.add_Cmd(cmd);
    if (!stsMsg.empty())
    {

        imqBuilder.add_StsMsg(message);
    }
    imqBuilder.add_Err(err);
#ifdef QT_CORE_LIB
    if (!body.isEmpty())
    {
#else
    if (body)
    {
#endif

        imqBuilder.add_Body(dataOffset);
    }

    auto imq = imqBuilder.Finish();
    builder.Finish(imq);
    auto size = builder.GetSize();
    auto buf = builder.ReleaseBufferPointer();
    std::unique_ptr<iMsg> m(new iMsg(std::move(buf), size));
    if (callback)
    {
        m->callback = callback;
    }
    return m;
}
inline std::shared_ptr<iMsg> handleCmd(std::shared_ptr<iMsg> &m)
{
    auto sts = m->fields->Sts();
    std::shared_ptr<iMsg> r;
    if (sts == schema::Sts::REQ || m->fields->Cmd() == schema::Cmd::READY)
    {

        switch (m->fields->Cmd())
        {
        case schema::Cmd::SUB:
            addSubscriber(m->fields->From()->str(), m->fields->Path()->str());
            r = std::shared_ptr<iMsg>(std::move(success(m, "")));
            break;
        case schema::Cmd::UNSUB:
            delSubscriber(m->fields->From()->str(), m->fields->Path()->str());
            return nullptr;
            break;
        case schema::Cmd::SYN:
            r = std::shared_ptr<iMsg>(std::move(success(m, "")));
            break;
        case schema::Cmd::READY:
            onReady();
            break;
        default:
            break;
        }
        return r;
    }
    else
    {
        auto imq = getImqMessage(m->fields->MsgId()->str());
        if (imq && imq->callback)
        {
            r = imq->callback(m);
        }
        delMessage(m->fields->MsgId()->str());
        if (r)
        {
            return r;
        }
        return nullptr;
    }
}

#ifdef QT_CORE_LIB
inline std::shared_ptr<iMsg> recieveRawData(BUFFER_TYPE data)
{
    if (data.isEmpty())
    {
        return nullptr;
    }
    auto m = std::shared_ptr<iMsg>(std::move(parseMsg(data)));
#else
inline std::shared_ptr<Msg> recieveRawData(BUFFER_TYPE data, int dataSize = NULL)
{
    auto m = std::shared_ptr<Msg>(std::move(parseMsg(std::move(data), dataSize)));
    if (!data)
    {
        return nullptr;
    }

#endif
    qDebug()<<"Message from "<<m->fields->From()->c_str();
    std::shared_ptr<iMsg> reply;
    //    std::unique_ptr<Msg> n=std::unique_ptr<Msg>(new Msg());
    //    n->fields=schema::GetImq(data);
    //    //n->rawData=std::move(std::unique_ptr<uint8_t>(data));
    //    //n->rawDataSize=dataSize;
    //    auto m=std::shared_ptr<Msg>(std::move(n));

    //qDebug()<<m->fields->MsgId()->c_str();
    if (!m)
    {
        return nullptr;
    }
    if (m->fields->Broker())
    { //its a broker req
        if (brokerHandler)
        {

            reply = brokerHandler(m);
        }
        else
        {
            reply = std::shared_ptr<iMsg>(std::move(err(m, "Not a Broker", schema::Err::NO_HANDLER)));
        }
    }
    else if (!m->fields->To()->str().empty() && m->fields->To()->str() != name())
    { //its a relay
        if (relayHandler)
        {
            reply = relayHandler(m);
        }
        else
        {
            reply = err(m, "Not a Relay", schema::Err::NO_HANDLER);
        }
    }
    else if (m->fields->MsgType() == schema::MsgType::CMD)
    { //its a cmd
        reply = handleCmd(m);
    }
    else if (m->fields->Sts() == schema::Sts::REQ)
    { //its a new req
        if (auto handler = getHandler(m->fields->Path()->str()))
        {
            reply = handler(m);
        }
    }
    else
    { //its a reply
        auto imq = getImqMessage(m->fields->MsgId()->str());
        if (imq && imq->callback)
        {
            imq->callback(m);
        }
        delMessage(m->fields->MsgId()->str());
        return nullptr;
    }
    return reply;
}
};

#endif // INDIS_RPC_H

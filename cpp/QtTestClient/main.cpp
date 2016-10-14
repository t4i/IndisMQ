#include <QCoreApplication>
#include "../indis_rpc.h"
#include <QtWebSockets/QtWebSockets>
#include <QDebug>
#include <thread>
std::string temp1="hello";
std::vector<uint8_t> temp1V(temp1.begin(),temp1.end());
QByteArray test("hey buddy");
void handler(std::shared_ptr<rpc::rpcStatus> rpc){
    rpc::sendRawRes(rpc->id,NULL,temp1V);
}

bool callback(std::shared_ptr<rpc::rpcStatus> rpc){
    qDebug()<<"callback";
    return true;
}
QWebSocket webSocket;
bool sender(uint8_t *data,int size){
    QByteArray buf=QByteArray::fromRawData(reinterpret_cast<const char*>(data),size);
    webSocket.sendBinaryMessage(buf);
    //rpc::recieveRawData(data);
    return true;
}
void onMessage(QByteArray data){
    rpc::recieveRawData(data);
}
void onConnected(){
    QObject::connect(&webSocket, &QWebSocket::binaryMessageReceived,&onMessage);
    std::string temp="hello";
    std::vector<uint8_t> tempV(temp.begin(),temp.end());
    rpc::sendRawReq(1,tempV,5,1,new rpc::rpcCallback(callback));
    rpc::sendRawReq(2,tempV,2,1,new rpc::rpcCallback(callback));
    rpc::sendRawReq(2,tempV,8,1,new rpc::rpcCallback(callback));
}
void onDisconnected(){

}
template <typename Duration, typename Function>
void timer(Duration const & d, Function const & f)
{
    std::thread([d,f](){
        std::this_thread::sleep_for(d);
        f();
    }).detach();
}
template<typename func>
auto ticker(func & f){
    auto tickerThread=std::thread([f](){
        auto run=true;
        while(run){
            f();
        }
    });
    return tickerThread;
}



int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);
    //timer(std::chrono::seconds(5), [](){qDebug()<<"hello in 5 seconds";});
//    auto cancel=false;
//    auto count=1;
//    rpc::startTicker(cancel);
    QObject::connect(&webSocket,&QWebSocket::connected,&onConnected);
    QObject::connect(&webSocket, &QWebSocket::disconnected, &onDisconnected);
    webSocket.open(QUrl("ws://localhost:1800/test"));
    rpc::setHandler(new rpc::rpcHandler(handler),1);
    rpc::setSender(new rpc::rpcSender(sender));



    return a.exec();

}

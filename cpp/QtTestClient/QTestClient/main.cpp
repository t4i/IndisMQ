#include <QCoreApplication>
#include "../../indis_rpc.h"
#include <QtWebSockets/QtWebSockets>
#include <QDebug>
#include <QByteArray>
#include <thread>
std::string temp1="hello";
std::vector<uint8_t> temp1V(temp1.begin(),temp1.end());
QByteArray test("hey buddy");
std::shared_ptr<imq::iMsg> handler(std::shared_ptr<imq::iMsg> &m){
    std::shared_ptr<imq::iMsg> r(imq::success(m,NULL));
    return r;
}

std::shared_ptr<imq::iMsg> callback(std::shared_ptr<imq::iMsg> &m){
    qDebug()<<"callback";
    return NULL;
}
QWebSocket webSocket;
void sender(QByteArray& data){
    webSocket.sendBinaryMessage(data);
    //rpc::recieveRawData(data);
}
void onMessage(QByteArray data){
    auto reply=imq::recieveRawData(data);
    if(reply){
        sender(reply->data);
    }

}
void onConnected(){
    QObject::connect(&webSocket, &QWebSocket::binaryMessageReceived,&onMessage);
    auto m=imq::req("","/temp","",nullptr,callback);
    sender(m->data);
    auto s=imq::sub("/hello",[](imq::shared_msg &m)->imq::shared_msg{
            qDebug()<<"hello from" <<m->fields->From()->c_str();
            return nullptr;
},[](imq::shared_msg &m)->imq::shared_msg{
        if(m->fields->Sts()==schema::Sts::SUCCESS){
            qDebug()<<"Successfully subscribed on "<<m->fields->From()->c_str();
            return nullptr;
        }
        return nullptr;
    });
    sender(s->data);

}


void onDisconnected(){

}

int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);
    //timer(std::chrono::seconds(5), [](){qDebug()<<"hello in 5 seconds";});
    //    auto cancel=false;
    //    auto count=1;
    //    rpc::startTicker(cancel);
    imq::name="QtClient1";
    QObject::connect(&webSocket,&QWebSocket::connected,&onConnected);
    QObject::connect(&webSocket, &QWebSocket::disconnected, &onDisconnected);
    webSocket.open(QUrl("ws://localhost:6000/test"));
    imq::setHandler("/hommy",handler);


    return a.exec();

}

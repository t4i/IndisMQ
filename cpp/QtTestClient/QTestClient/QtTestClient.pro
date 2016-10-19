QT += core websockets
QT -= gui

CONFIG += c++11

TARGET = IndisRPC
CONFIG += console
CONFIG -= app_bundle

TEMPLATE = app

SOURCES += main.cpp

HEADERS += \
    indis_rpc.h \
    ../indis_rpc.h \
    ../../indis_rpc.h

DISTFILES +=

INCLUDEPATH += $$PWD/../../../schema

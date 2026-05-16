#pragma once            // Защита от повторного включения
#include <Arduino.h>    // Для базовых типов и delay/millis


class DataSerial {
public:
    bool dataAvailable();
    void dataParse();
    void request (String comm);
    bool arrayComparison ();
    void getSettings (String data);
    void scenarioParser (String data);
    void securityParser (String data);
    void outData (int value, String dataOut, byte additional);
    void statusMode();
private:

};

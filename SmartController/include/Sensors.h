#pragma once            // Защита от повторного включения
#include <Arduino.h>    // Для базовых типов и delay/millis
#include <Ultrasonic.h>


class Sensors {
public:
    int sensorsCheck (Ultrasonic sensor, int operateNumber);
    int middle(int a, int b, int c);
    bool darkOrLight();
    bool dayOrNight();
private:

};
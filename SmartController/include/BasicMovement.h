#pragma once            // Защита от повторного включения
#include <Arduino.h>    // Для базовых типов и delay/millis


class BasicMovement {
public:
    void emergencyLighting(bool val);
    void move(int initVal, int target, int stepPWM, bool trend, bool state, bool work);
    void allStepsOn();
    void actionSTOP();
private:

};
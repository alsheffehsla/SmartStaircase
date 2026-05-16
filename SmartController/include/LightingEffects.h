#pragma once            // Защита от повторного включения
#include <Arduino.h>    // Для базовых типов и delay/millis


class LightingEffects {
public:
    void all(int bright, bool state);
    void onlineBright (int val);
    void different (int initVal, int target, int stepPWM, bool state);
    void towards (int initVal, int target, int stepPWM, bool state);
    void sos (int bright, bool state);
    void luminescent (int bright);
};

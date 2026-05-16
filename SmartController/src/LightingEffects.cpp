#include "LightingEffects.h"        // Связь с .h
#include "DataSerial.h"
#include "BasicMovement.h"
#include <Ultrasonic.h>           // подключаем библиотеку сенсоров
#include <Tlc5940.h>              // подключаем библиотеку драйвера

// Внешние зависимости 
extern int data_Array[];  // Глобальный массив параметров
extern bool stop;
extern DataSerial dataSerial;
extern BasicMovement myStaircase; 
extern bool allStair;                 // флаг срабатывания функции allStairWork()
extern bool Flags_Array[];



//------------ Включение/выключение всех ступеней разом ------------------------------------------------------------------------------------
void LightingEffects::all (int bright, bool state) {                       // параметры (яркость, состояние 0-выключить, 1-включить)
  dataSerial.outData(3, state ? "All" : "all", state);                             // ответ пользователю, что команда выполняется
  dataSerial.dataAvailable();                                            // проверяем, есть ли данные на входе
  if (stop) {                                                       // если флаг СТОП
    myStaircase.actionSTOP();                                                   	// вызываем функцию СТОП
    return;                                                           	// выходим из цикла
  }
  for (int step = 0; step < data_Array[8]; step ++) {   	          // увеличение ступеней от нижней до верхней с шагом "1"
    Tlc.set(step, bright);                         	                  // всем ступеням назначаем указанную яркость
  }
  Tlc.update();                                                     // применяем изменения
  dataSerial.outData(4, state ? "All" : "all", state);                             // ответ пользователю, что команда выполнена
}
//==========================================================================================================================================

//-------------Изменение яркости "на лету"---------------------------------------------------------------------------------------------------
void LightingEffects::onlineBright (int val) {
    for (int i = 0; i <= data_Array[8]; i++) {		// всем ступеням присваиваем нужную яркость
      Tlc.set(i, val);
  }
  Tlc.update();
}
//==========================================================================================================================================

//------------ Включение/выключение ступеней от середины к краям ---------------------------------------------------------------------------
void LightingEffects::different (int initVal, int target, int stepPWM, bool state) {    // параметры (нач.значение, целевое значение, шаг, состояние 0-выключить 1-включить)
  int up, down;
  dataSerial.outData(3, state ? "Different" : "different", state);                            // ответ пользователю, что команда выполняется
  byte center = data_Array[8]/2;                                      // вычисляем среднюю ступень

    for (up = center, center % 2 == 0 ? down = center - 1: down = center; up < data_Array[8]; up ++, down --) {   // отсчет ведем в зависимости от четности ступеней 
      dataSerial.dataAvailable();                                            // проверяем, есть ли данные на входе
      if (stop) {                                                       // если флаг СТОП
        myStaircase.actionSTOP();                                                       // вызываем функцию СТОП
        break;                                                          // выходим из цикла
      }      
      for (int u = initVal; state ? u < target : u >= target; state ? u += stepPWM : u -= stepPWM) {    // устанавливаем новое значение яркости в зависимости от состояния
        if ((!Tlc.get(up) || !Tlc.get(down)) && !state) break;                      // если в процессе тушения ступень уже была выключена, то покидаем блок
        if ((Tlc.get(up) == (uint16_t)target || Tlc.get(down) == (uint16_t)target) && state) break;     // если в процессе включения ступень уже была включена, то покидаем блок
          Tlc.set(up, u);                                                // устанавливаем значение яркости ступени идущей вверх
          Tlc.set(down, u);                                              // устанавливаем значение яркости ступени идущей вниз
          Tlc.update();                                                  // применяем изменения
          delay(data_Array[15]);                                         // применяем установленную задержку
      } 
    } 
    dataSerial.outData(4, state ? "Different" : "different", state);                                   // ответ пользователю, что команда выполнена
}
//==========================================================================================================================================

//------------ Включение/выключение ступеней от краев навстречу друг другу ----------------------------------------------------------------- 
void LightingEffects::towards (int initVal, int target, int stepPWM, bool state) {    // параметры (нач.значение, целевое значение, шаг, состояние 0-выключить 1-включить)
  dataSerial.outData(3, state ? "Towards" : "towards", state);                            // ответ пользователю, что команда выполняется
  byte center = data_Array[8]/2;                                      // вычисляем среднюю ступень
    for (int up = 0, down = data_Array[8] - 1; center % 2 == 0 ? up < center: up <= center; up ++, down --) {   // в зависимости от четности ступеней устанавливаем среднюю ступень
      dataSerial.dataAvailable();                                            // проверяем, есть ли данные на входе
      if (stop) {                                                       // если флаг СТОП
        myStaircase.actionSTOP();                                                       // вызываем функцию СТОП
        break;                                                          // выходим из цикла
      }      
      for (int u = initVal; state ? u < target : u >= target; state ? u += stepPWM : u -= stepPWM) {    // устанавливаем новое значение яркости в зависимости от состояния
        if ((!Tlc.get(up) || !Tlc.get(down)) && !state) break;                      // если в процессе тушения ступень уже была выключена, то покидаем блок
        if ((Tlc.get(up) == (uint16_t)target || Tlc.get(down) == (uint16_t)target) && state) break;     // если в процессе включения ступень уже была включена, то покидаем блок
          Tlc.set(up, u);                                                // устанавливаем значение яркости ступени идущей сверху
          Tlc.set(down, u);                                              // устанавливаем значение яркости ступени идущей снизу
          Tlc.update();                                                  // применяем изменения
          delay(data_Array[15]);                                         // применяем установленную задержку
      }
    }
    dataSerial.outData(4, state ? "Towards" : "towards", state);                                  // ответ пользователю, что команда выполняется 
}
//==========================================================================================================================================

//------------ Включение режима SOS --------------------------------------------------------------------------------------------------------
void LightingEffects::sos (int bright, bool state) {                       // параметры (яркость, состояние 1-зациклить 0 - один раз)
  dataSerial.outData(3, "SOS", 1);                                     // ответ пользователю, что команда выполняется
  
  do {
    int pause = 200;
    Tlc.setAll(0);                                                         // выключаем все ступени
    Tlc.update();
    
    delay(1000);
    for (byte cycle = 0; cycle < 3; cycle++) {                            // три такта по три включения
      if (cycle == 2) {                                                     // если третий такт
        delay(pause);                                                       
        pause = 200;                                                        // меняем паузу
      }
      
      for (byte on = 0; on < 3; on++) {
        if (dataSerial.dataAvailable()) {                                 // проверяем, если есть входные данные
          dataSerial.dataParse();                                         // парсим входные данные
        } 
        
        if (stop) {                             // если флаг СТОП
          myStaircase.actionSTOP();                                         // вызываем функцию СТОП
          state = 0;
          return;                                                           // выход из всей функции
        }
        delay(pause);                                                       // пауза
        Tlc.setAll(bright);                                                 // устанавливаем всем ступеням указанную яркость
        Tlc.update();                                                       // применяем изменения
        delay(pause);                                                       // пауза
        Tlc.setAll(0);                                                      // тушим все ступени
        Tlc.update();                                                       // применяем изменения
      }
      pause = 500;
    }
  } while (state);                                                          // если state = true, то бесконечно повторять
  
  dataSerial.outData(4, "SOS", 1);                                      // ответ пользователю, что команда выполнена
}
//==========================================================================================================================================

//------------ Включение ступеней имитируя люминесцентную лампу ----------------------------------------------------------------------------
void LightingEffects::luminescent (int bright) {                                      // параметры (яркость)

  byte f = 0;
  int pause = 1000;
  dataSerial.outData(3, "Luminescent", 1);                                              // ответ пользователю, что команда выполняется

  Tlc.setAll(0);
  Tlc.update();
  for (int first = 0, last = data_Array[8] - 1, b = 0; b <= bright ; b ++) {
      dataSerial.dataAvailable();                                            // проверяем, есть ли данные на входе
      if (stop) {                                                       // если флаг СТОП
        myStaircase.actionSTOP();                                                         // вызываем функцию СТОП
        break;                                                          // выходим из цикла
      }      
    Tlc.set(first, b);
    Tlc.set(last, b);
    Tlc.update();
    delayMicroseconds(500);
  } 

  Tlc.setAll(bright);
  Tlc.update();
  delay(700);
  
  do {
      dataSerial.dataAvailable();                                            // проверяем, есть ли данные на входе
      if (stop) {                                                       // если флаг СТОП
        myStaircase.actionSTOP();                                                         // вызываем функцию СТОП
        break;                                                          // выходим из цикла
      }      
    Tlc.setAll(bright/8);
    Tlc.update();

      delay(pause/2);

    for (int b = bright/8; b < bright; b ++) {
      Tlc.setAll(b);
      Tlc.update();
    }

    pause /= 4;
    f ++;
    delay(pause);
  } while (f < 5);

  dataSerial.outData(4, "Luminescent", 1);                                              // ответ пользователю, что команда выполнена
}
//==========================================================================================================================================
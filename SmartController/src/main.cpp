#include <Arduino.h>
#include <Tlc5940.h>                  // подключаем библиотеку драйвера
#include <Ultrasonic.h>               // подключаем библиотеку ультразвуковых датчиков
#include <EEPROM.h>
#include <SoftwareSerial.h>
#include "BasicMovement.h"          // Подключение класса
#include "DataSerial.h"          // Подключение класса
#include "Settings.h"          // Подключение класса
#include "Sensors.h"          // Подключение класса
#include "LightingEffects.h"          // Подключение класса


// внешние зависимости
extern int default_Array[17];
extern int data_Array[17];  // Глобальный массив параметров
extern bool Flags_Array[14];
extern SoftwareSerial btSerial;
extern Ultrasonic TopSensor;
extern Ultrasonic BottomSensor;
extern bool data_flag;
extern bool tumbler;
extern bool stop;
extern bool allStair;
extern bool dark;
extern int darkness;
extern int tumblerCount;

// переменные для работы с счетчиками времени
extern unsigned long startTime;
extern unsigned long currentStandByTime;
extern unsigned long standByTime;

extern DataSerial dataSerial;
extern LightingEffects lightEffects;
extern BasicMovement myStaircase;
extern Settings settings;
extern Sensors sensors;


// --------- Инициализация -----------------------------------------------------------------------------------------------------------------
void setup() {
  if (EEPROM.read(1000) != 123){                    // если по адресу 1000 нет ключа со значением 123 (первый запуск) // (при запросе учитывать, что ячейки  двухбайтовые - адрес 500)
    EEPROM.write(1000, 123);                        // запишем ключ
    EEPROM.put(0, default_Array);                   // запишем в память массив с дефолтными настройками, начиная с адреса 0
  }

//  Serial.begin(115200);         // раскоментировать для отладки

  Tlc.init(0);                                      // гасим все ступени
  btSerial.begin(57600);                            // открываем последовательный порт на скорости 57600
  EEPROM.get(0, data_Array);                      	// загружаем из памяти в рабочий массив настройки пользователя
  startTime = millis();                             // сохраняем в переменную время старта в мс.

    for (int i=0; i < (int)(sizeof(Flags_Array)); i++){	// обнуляем все флаги состояний системы
      Flags_Array[i] = 0;
    }
    Flags_Array[1] = dataSerial.arrayComparison();    // проверяем, установлены ли дефолтные настройки
}
//==========================================================================================================================================

//----------- Основной цикл ----------------------------------------------------------------------------------------------------------------
void loop() {

  while (Flags_Array[11] == true) {                     // если режим Охраны
    Tlc.setAll(0);                                     // тушим все ступени
    Tlc.update();
    if (dataSerial.dataAvailable()) {                         // проверяем, если data_flag установлен
      data_flag = false;                                   // сбрасываем флаг
      dataSerial.dataParse();                                         // парсим входные данные
    } 

    if (Flags_Array[12] == true) {                                        // если включен контроль сенсоров
      int top = sensors.sensorsCheck(TopSensor, data_Array[7]);           // опрашиваем верхний сенсор
      int bottom = sensors.sensorsCheck(BottomSensor, data_Array[7]);     // опрашиваем нижний сенсор
      if (bottom < data_Array[3]) {
        dataSerial.outData (4, "Alarm!", 1);                               // сообщение оператору, Тревога!
        dataSerial.outData (4, "Zbottom", 1);                               // сообщение оператору, сработал нижний сенсор
        if (Flags_Array[13] == true) lightEffects.sos(4095, 1);             // если есть флаг, запускаем бесконечный SOS режим
      } 
      if (top < data_Array[2]) {
        dataSerial.outData (4, "Alarm!", 1);                               // сообщение оператору, Тревога!
        dataSerial.outData (4, "Ztop", 1);                                  // сообщение оператору, сработал верхний сенсор
        if (Flags_Array[13] == true) lightEffects.sos(4095, 1);             // если есть флаг, запускаем бесконечный SOS режим
      }
    }
  }

  
  if (Flags_Array[0] == true) {                                                 // если StandBy режим
    currentStandByTime = millis();                                              // пишем текущее время в переменную
    if (currentStandByTime - standByTime >= 30000) {                            // если время входа в режим StandBy больше текущего времени на 30 сек.
      Flags_Array[0] = false;                                                   // снимаем флаг StandBy
      dataSerial.outData (4, "StandByOFF", 1);                                  // сообщение оператору, режим выключен
    }
  }

  if (dataSerial.dataAvailable()) {                         // проверяем, если data_flag установлен
      data_flag = false;                                   // сбрасываем флаг
      dataSerial.dataParse();                                         // парсим входные данные
  } else {

      int top = sensors.sensorsCheck(TopSensor, data_Array[7]);           // опрашиваем верхний датчик
      int bottom = sensors.sensorsCheck(BottomSensor, data_Array[7]);     // опрашиваем нижний датчик
            // - tumbler - выключатель - //   
      if (bottom < data_Array[4] || top < data_Array[4]) {			// если нижний или верхний меньше расстояния для выключателя
          tumblerCount ++;												                // увеличиваем счетчик выключателя
          if (tumbler && tumblerCount == 5) {								      // если режим выключатель уже включен и счетчик достиг 5
            lightEffects.all(0, 0);														                  // выключаем все ступени
            tumbler = 0;													                  // сбрасываем флаг выключателя
            dataSerial.outData (4, "tumblerOFF", 1);                               // сообщение оператору, сработал выключатель выключен
            tumblerCount = 0;												                // сбрасываем счетчик
          } else if (!tumbler && tumblerCount == 5) {					    // если режим выключатель выключен и счетчик достиг 5
            lightEffects.all(data_Array[10], 1);											            // включаем все ступени
            tumbler = 1;													                  // поднимаем флаг выключателя
            dataSerial.outData (4, "tumblerON", 1);                               // сообщение оператору, сработал выключатель включен 
            tumblerCount = 0;												                // сбрасываем счетчик
          }
          return;
      } else tumblerCount = 0;										              // сбрасываем счетчик

      if (!Flags_Array[0] && sensors.dayOrNight()) {              // если Ночь и не режим ожидания
        if (!tumbler && !stop) myStaircase.emergencyLighting(1);     // если  и не СТОП и не режим выключатель, включаем дежурную подсветку крайних ступеней
        stop = false;                                       // снимаем СТОП-флаг
        allStair = false;												            // снимаем флаг функции allStairWork()

        if (!tumbler && bottom > data_Array[4] && bottom <= data_Array[3]) {		// если не режим выключателя, а нижний датчик больше расстояния выключателя и меньше установленного
          dataSerial.outData (4, "Zbottom", 1);                                     // сообщение оператору, сработал нижний сенсор
          myStaircase.move(0, data_Array[10], data_Array[14], 1, 1, 1);					                  // запускаем включение лестницы вверх
          delay (data_Array[12]);
          if (!allStair) {												                                // если не включена вся лестница
            allStair = false;												                                // снимаем флаг функции allStairWork()
            myStaircase.move(data_Array[10], 0, data_Array[14], 1, 0, 1);					                  // запускаем тушение лестницы вверх
          }
          
        } else if (!tumbler && top > data_Array[4] && top <= data_Array[2]) {		  // аналогично с верхним датчиком
          dataSerial.outData (4, "Ztop", 1);                                        // сообщение оператору, сработал нижний сенсор  
          myStaircase.move(0, data_Array[10], data_Array[14], 0, 1, 1);
            delay (data_Array[12]);
            if (!allStair) {
              allStair = false;
              myStaircase.move(data_Array[10], 0, data_Array[14], 0, 0, 1);
            }
          }

      } else if (!Flags_Array[0] && !tumbler) {                                   // если не режим ожидания и не режим выключателя
            Tlc.setAll(0);                                                          // если День - тушим все ступени
            Tlc.update();                                                           // применяем изменения
        }
    }
}
//==========================================================================================================================================

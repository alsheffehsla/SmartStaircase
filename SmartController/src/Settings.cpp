#include "BasicMovement.h"        // Связь с .h
#include "DataSerial.h"
#include "Settings.h"
#include "Sensors.h"
#include "LightingEffects.h"          // Подключение класса
#include <SoftwareSerial.h>
#include <Ultrasonic.h>           // подключаем библиотеку сенсоров


// Внешние зависимости 
//extern bool stop;
extern unsigned long currentMotionTime, startMotionTime;

extern DataSerial dataSerial;
extern Ultrasonic TopSensor;
extern Ultrasonic BottomSensor;


#define T1 6                            // устанавливаем контакты для верхнего датчика
#define E1 5                            // устанавливаем контакты для верхнего датчика
#define T2 7                            // устанавливаем контакты для нижнего датчика
#define E2 8                            // устанавливаем контакты для нижнего датчика

Ultrasonic TopSensor(T1, E1);           // определяем нижний датчик
Ultrasonic BottomSensor(T2, E2);        // определяем верхний датчик
SoftwareSerial btSerial(2, 4); 		    // RX, TX - ноги контроллера для связи с BLE устройством

bool Flags_Array[14];                   // массив флагов текущих состояний системы (порядок см. ниже) 1-включен, 0-выключен;
// [0]-StandbyMode; [1]-DefaultSettings; [2]-night; [3]-cycle_flag; [4]-UpFlag; [5]-DownFlag;
// [6]-AllFlag; [7]-DifferentFlag; [8]-TowardsFlag; [9]-SOSFlag; [10]-LuminescentFlag; 
// [11]-SecurityMode; [12]-SensorControl; [13]-SecuritySOS

// внутренние флаги //
bool stop = 0;                          // флаг для остановки всех задач по входной команде 0х24 ($)
bool dark = 0;                          // переключатель, если 0 - то темно, 1 - светло
bool tumbler = 0;                       // флаг работы выключателя всей лестницы
bool allStair = 0;                      // флаг срабатывания функции allStepsOn()
bool data_flag = false;			        // флаг выборки данных из приемного буфера в переменную

int tumblerCount = 0;                   // счетчик работы выключателя
int darkness = 0;                       // накопительная переменная для проверки день - ночь

// переменные для работы с счетчиками времени
unsigned long currentTime = 1UL;            // текущее время 
unsigned long startTime = 1UL;              // время старта контроллера  ???
unsigned long currentMotionTime = 1UL;      // текущее время движения
unsigned long startMotionTime = 1UL;        // время начала движения
unsigned long standByTime = 1UL;            // время входа в режим StandBy
unsigned long currentStandByTime = 1UL;     // текущее время в режиме StandBy

String dataCollect = "";			    // промежуточная строка при приеме длинного пакета данных
String dataIn = "";                     // переменная для входных данных



// Глобальные экземпляры классов
BasicMovement myStaircase;         
LightingEffects lightEffects;
DataSerial dataSerial;
Settings settings;
Sensors sensors;


int default_Array[17] = {980,10,80,90,7,50,2000,1,16,200,1900,50,3000,10000,50,10,9};   // дефолтные настройки
int data_Array[17];     // рабочий массив с настройками
int temp_Array[17];     // временный массив для вывода данных из EEPROM при запросе
// int user_Array[17] лежит в EEPROM по адресу 0.

// Состав default_Array // Изменяемые настройки:
//==========================================================================================================================================
	// настройки фоторезистора //
//unsigned int dark = 980;              [0] референсное значение фоторезистора, выше которого считается ночь;
//int hysteresis = 10;                  [1] гистерезис переключения ночь-день
	//настройки ультразвуковых датчиков //
//int distanceTopOperate = 80;          [2] расстояние, при котором сработает верхний датчик, (см)
//int distanceBottomOperate = 90;       [3] расстояние, при котором сработает нижний датчик, (см)
//int distanceSwitch = 7;               [4] расстояние, меньше которого сработает выключатель (включение/выключение всей лестницы), (см)
//int ZadergkaSensora = 50;             [5] задержка между выстрелами сенсоров, (миллисекунды)        ---------   установить интервал от 15 - и выше.
//int sensorPollingDelay = 2000;        [6] интервал задержки срабатывания датчиков, чтобы одно пересечение не считалось за несколько, (миллисекунды)
//byte operateNumber = 1;               [7] количество срабатываний датчика для запуска функций (защита от случайных срабатываний и эл.магн. помех)
	// настройки свечения ступеней //
//byte numberOfSteps = 16;              [8] количество ступеней лестницы, (шт.)
//int emergencyLighting = 200;          [9] яркость первой и последней ступенек в ночном режиме, (дежурное освещение)
//int maxBrightness = 1900;             [10] максимальная яркость свечения, (min 0 - 4095 max)
//int delaySwitchingNextStep = 50;      [11] задержка перед включением/выключением следующей ступени, (миллисекунды)
//int timeGlowStep = 3000; 			        [12] задержка свечения ступеней перед последовательным выключением, (миллисекунды)
//int timeAllSteps = 10000;             [13] задержка свечения всей лестницы, (миллисекунды)
//int stepPWM = 50;                     [14] шаг увеличения яркости ШИМ, (min 0 - 4095 max)
//int delayPWM = 10;                    [15] задержка между шагами ШИМ (плавное включение), (миллисекунды) нельзя устанавливать 0
//byte landing = 9;                     [16] площадка разворота лестницы, (№ ступени)
//==========================================================================================================================================


//------------ Блок вывода флагов состояний контроллера ------------------------------------------------------------------------------------
void Settings::statesOfFlags(String data){
  String temp = data;
  int val;
  if (data == "100") {													// если запрос 100
    for (int i=0; i < (int)(sizeof(Flags_Array)); i++){                      // весь массив флагов
      btSerial.print(Flags_Array[i]);                                           // передаем поочередно
      btSerial.print(":");                                                      // с разделителем ':'
    }
    btSerial.println();
  } else {																// иначе разбираем запрос
      val = data.toInt();
      val += 1;
      data = String(val);
      switch (temp.toInt()) {
        case 110:
          Flags_Array[0] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг StandBy
          break;
        case 120:
          Flags_Array[1] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг DefaultSettings
          break;
        case 130:
          Flags_Array[2] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг night
          break;
        case 140:
          Flags_Array[3] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг cycle_flag
          break;
        case 150:
          Flags_Array[4] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг UpFlag
          break;
        case 160:
          Flags_Array[5] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг DownFlag
          break;
        case 170:
          Flags_Array[6] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг AllFlag
          break;
        case 180:
          Flags_Array[7] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг DifferentFlag
          break;
        case 190:
          Flags_Array[8] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг TowardsFlag
          break;
        case 200:
          Flags_Array[9] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг SOSFlag
          break;
        case 210:
          Flags_Array[10] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг LuminescentFlag
          break;
        case 220:
          Flags_Array[11] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг SecurityMode
          break;
        case 230:
          Flags_Array[12] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг SensorControl
          break;
        case 240:
          Flags_Array[13] ? dataSerial.outData(4, data, 0) : dataSerial.outData(4, temp, 0);         // флаг SecuritySOS
          break;

        default:
          dataSerial.outData (2, temp, 0);                         // сообщение оператору "Неверные данные"
          break;
      }
  }
}

//==========================================================================================================================================


#include "BasicMovement.h"        // Связь с .h
#include "DataSerial.h"
#include <Ultrasonic.h>           // подключаем библиотеку сенсоров
#include <Tlc5940.h>              // подключаем библиотеку драйвера
#include <SoftwareSerial.h>

// Внешние зависимости 
extern int data_Array[];          // Глобальный массив параметров
extern bool Flags_Array[];
extern bool stop;
extern bool allStair;                 // флаг срабатывания функции allStairWork()
extern unsigned long currentTime ,currentMotionTime, startMotionTime;
extern SoftwareSerial btSerial; 		  // RX, TX - ноги контроллера для связи с BLE устройством

extern DataSerial dataSerial;
extern Ultrasonic TopSensor;
extern Ultrasonic BottomSensor;


//------------ Дежурное освещение ----------------------------------------------------------------------------------------------------------
void BasicMovement::emergencyLighting(bool val) { 			// включаем первую и последнюю ступеньки на дежурную яркость

  if(val) {											// если 1
    Tlc.set(0, data_Array[9]);							// первой ступени задаем значение дежурного освещения
    Tlc.set(data_Array[8] - 1, data_Array[9]);			// последней ступени задаем значение дежурного освещения
  } else {											// если 0
    Tlc.set(0, 0);										// выключаем первую ступень
    Tlc.set(data_Array[8] - 1, 0);						// выключаем последнюю ступень
  }
  Tlc.update();
}
//==========================================================================================================================================

// +++ Класс движения вверх/вниз +++
// параметры (нач.знач., целевое знач., шаг, направл. 1-вверх 0-вниз, состояние 0-выкл 1-вкл, 1-вызов из рабочего цикла 0-из настроек)

void BasicMovement::move(int initVal, int target, int stepPWM, bool trend, bool state, bool work) { 
  int step = 0;                                                         // переменная для подсчета ступеней
  int top = 0;
  int bottom = 0;

  if(trend) dataSerial.outData(3, state ? "Up" : "up", state);                       // ответ пользователю, что команда вверх выполняется
     else   dataSerial.outData(3, state ? "Down" : "down", state);                       // ответ пользователю, что команда вниз выполняется
 
    for (trend ? step = 0 : step = data_Array[8] - 1; trend ? step < data_Array[8] : step >= 0; trend ? step ++ : step --) { // увеличиваем ступень на 1
      dataSerial.dataAvailable();                                            // проверяем, есть ли данные на входе
      if (stop) {                                                       // если флаг СТОП
        actionSTOP();                                                      // вызываем функцию СТОП
        break;                                                             // выходим из цикла
      }      
      for (int u = initVal; state ? u < target : u >= target; state ? u += stepPWM : u -= stepPWM){ // устанавливаем новое значение яркости в зависимости от state
        Tlc.set(step, u);                                               // устанавливаем значение яркости текущей ступени
        if (work && state && (step==0 || step==data_Array[8] - 1) && u<data_Array[9]) { // при включении учитываем деж.яркость крайних ступенек
          Tlc.set(step, u = data_Array[9]);
        }
        if (work && state==0 && (step==0 || step==data_Array[8] - 1) && u<=data_Array[9]) { // при выключении учитываем деж.яркость крайних ступенек
          Tlc.set(step, u = data_Array[9]);
          u=target;
        }

        Tlc.update();                                                   // применяем изменения
        delay(data_Array[15]);                                          // применяем установленную задержку
      }   
      top = TopSensor.Ranging(CM);
      bottom = BottomSensor.Ranging(CM);
      if (trend && state && top <= data_Array[2]) btSerial.println("400,Utop");
      if (!trend && state && bottom <= data_Array[3]) btSerial.println("400,Dbottom");
      if ((!trend && top <= data_Array[2]) || (!trend && !state && bottom <= data_Array[3]) ||
         (trend && bottom <= data_Array[3]) || (trend && !state && top <= data_Array[2])) {		// если сработал ????? дописать
        if (top < data_Array[2]) {
          trend ? btSerial.println(state ? "400,Utop" : "400,utop") : btSerial.println(state ? "400,Dtop" : "400,dtop");    // сообщение, сработал верхний датчик
        }
        if (bottom < data_Array[3]) {
          trend ? btSerial.println(state ? "400,Ubottom" : "400,ubottom") : btSerial.println(state ? "400,Dbottom" : "400,dbottom");    // сообщение, сработал нижний датчик
        }

        currentMotionTime = millis();																		// запоминаем текущее время 
        if (currentMotionTime - startMotionTime >= (unsigned long)data_Array[6]) {		// если текущее время больше времени старта на установленное значение
          Serial.println(currentMotionTime - startMotionTime);
          startMotionTime = currentMotionTime;													// сбросим стартовое время
          allStepsOn();																						    // вызываем ф-ю включения всей лестницы
          return;
        }   
      } 

      if (step == data_Array[16] - 1) delay(data_Array[11] * 10);		// если достигли ступени-платформы разворота, задержка умноженная на 10
      else delay(data_Array[11]);											// для других ступеней обычная задержка
   }

   if(trend) dataSerial.outData(4, state ? "Up" : "up", state);                // ответ пользователю, что команда вверх выполнена
        else dataSerial.outData(4, state ? "Down" : "down", state);                             // ответ пользователю, что команда вниз выполнена
                                
}

//------------ Включение всех ступеней с контролем датчиков --------------------------------------------------------------------------------
void BasicMovement::allStepsOn() {
    dataSerial.outData(3, "All", 1);                                   	// ответ пользователю, что команда выполняется
    Flags_Array[6] = true;
    allStair = true;
    int top = 0;
    int bottom = 0;
    for (int step = 0; step < data_Array[8]; step ++) {   	// увеличение ступеней от нижней до верхней с шагом "1"
      Tlc.set(step, data_Array[10]);                         	// включаем каждую ступень на максимальную яркость
    }
    Tlc.update();                                       	// применяем изменения
    dataSerial.outData(4, "All", 1);                                   	// ответ пользователю, что команда выполнена

      delay(data_Array[13]);                                 // задержка свечения всех ступеней          
      dataSerial.outData(3, "down", 1);                             		// ответ пользователю, что команда тушения вниз выполняется
    
      for (int pwm = data_Array[10]; pwm >= 0; pwm -= data_Array[14]) {  	// уменьшение яркости от максимума до "0" 
            if (pwm - data_Array[14] < data_Array[9] ) {                      // если остаточное значение ШИМ меньше, чем дежурное освещение, то
                Tlc.set(data_Array[8] - 1, data_Array[9]);           				// выключаем последнюю ступень до дежурной величины 
                Tlc.update();                               						// применяем изменения
                delay(data_Array[15]);                         					// задержка перед следующим шагом уменьшения яркости
              }
          }
          
      for (int step = data_Array[8] - 2; step >= 1; step --) {      // увеличение ступенек от предпоследней до второй с шагом "1"
            for (int pwm = data_Array[10]; pwm >= 0; pwm -= data_Array[14]) { // уменьшение яркости от максимума до "0" 
                if (pwm < data_Array[14]) pwm=0;                        	// проверка, если остаточное значение ШИМ меньше, чем шаг, то приравняем к "0"
                Tlc.set(step, pwm);                            			// выключаем каждую ступень поочередно с плавным уменьшением яркости
                Tlc.update();                                  			// применяем изменения
                delay(data_Array[15]);                            		// задержка перед следующим шагом уменьшения яркости
              }
            top = TopSensor.Ranging(CM);
            bottom = BottomSensor.Ranging(CM);
            if(top < data_Array[2] || bottom < data_Array[3]) {  // проверяем, если сработал верхний или нижний датчик,
                if (top < data_Array[2]) dataSerial.outData(4,"Atop",1);            // сообщение, сработал верхний датчик
                if (bottom < data_Array[3]) dataSerial.outData(4,"Abottom",1);     // сообщение, сработал нижний датчик
                currentMotionTime = millis();                     		// пишем текущее время 
                if(currentMotionTime - startMotionTime > (unsigned long)data_Array[6]) {  // если разность текущего времени и времени срабатывания больше заданного интервала
                    startMotionTime = currentMotionTime;           			// сбрасываем текущее время 
                    allStepsOn();                             				// включаем все ступени на полную яркость
                    return;                                   				// покидаем функцию
                  }
              }
            delay(data_Array[11]);                            			// задержка перед выключением следующей ступени
        }

      for (int pwm = data_Array[10]; pwm >= 0; pwm -= data_Array[14]) {      // уменьшение яркости от максимума до "0" 
                if (pwm - data_Array[14] < data_Array[9]) {                       // если остаточное значение ШИМ меньше, чем дежурное освещение, то
                    Tlc.set(0, data_Array[9]);                        				// выключаем первую ступень до дежурной величины
                    Tlc.update();                               						// применяем изменения
                    delay(data_Array[15]);                         					// задержка перед следующим шагом уменьшения яркости
                  }
              }
      dataSerial.outData(4, "down", 1);                             					// ответ пользователю, что команда выполнена 
      Flags_Array[6] = false;
}
//==========================================================================================================================================


//------------ СТОП всех выполняемых команд ------------------------------------------------------------------------------------------------
void BasicMovement::actionSTOP() {
  stop = true;                                          // переход в режим ожидания (флаг StandBy)
  Tlc.setAll(0);                                    // всем ступеням назначаем указанную яркость
  Tlc.update();                                     // применяем изменения
  dataSerial.outData(4, "STOP",  1);                         		// ответ - команда выполнена
}
//==========================================================================================================================================


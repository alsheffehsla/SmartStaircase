// обработчик подключения к устройству по кнопке подключения Bluetooth//
async function connectionBt(form, backform) {
	openTermForm(1);
	Sound('click');
	await connectBlueTooth();		// вызов функции подключения

	if (connectionFlagBT) {
		openForm(form);
		let targetForm = document.getElementById(form);
		targetForm.insertAdjacentHTML('afterbegin',
      '<span class="green-msg-connect">Соединение Bt установлено !</span>');
		  if (codeFlag) {
			  targetForm.insertAdjacentHTML('afterbegin',
		  '<span class="green-msg-access">Полный доступ к управлению</span>');
		  } else {
			  targetForm.insertAdjacentHTML('afterbegin',
		  '<span class="green-msg-no-access">Управление лестницей ограничено</span>');
		  }
	//	openTermForm(0);
	} else {
		alert ('Соединение Bt потеряно!');
		openForm(backform);
	//	openTermForm(0);
	}
}

// Кэш объекта выбранного устройства
let deviceCache = null;

// Кэш объекта характеристики
let characteristicCache = null;

// Промежуточный буфер для входящих данных
let readBuffer = '';

// Запуск выбора Bluetooth устройства и подключение к нему
function connectBlueTooth() {
  return (deviceCache ? Promise.resolve(deviceCache) :
      requestBluetoothDevice()).
      then(device => connectDeviceAndCacheCharacteristic(device)).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}

// Запрос выбора Bluetooth устройства
function requestBluetoothDevice() {
  log('Запрос устройства Bluetooth...');

  return navigator.bluetooth.requestDevice({
    filters: [{services: [0xFFE0]}],
  }).
      then(device => {
        log('выбрано Bluetooth устройство "'+ device.name +'"');
        deviceCache = device;
        deviceCache.addEventListener('gattserverdisconnected',
            handleDisconnection);

        return deviceCache;
      });
}

// Обработчик разъединения
function handleDisconnection(event) {
  let device = event.target;

  log('Bluetooth-устройство "'+ device.name +'" отключено, переподключение...');

  connectDeviceAndCacheCharacteristic(device).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}

// Подключение к определенному устройству, получение сервиса и характеристики
function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCache) {
    return Promise.resolve(characteristicCache);
  }
  Sound('creak');
  log('Подключение к GATT серверу ...');

  return device.gatt.connect().
      then(server => {
        log('GATT сервер подключен, получение сервиса...');

        return server.getPrimaryService(0xFFE0);
      }).
      then(service => {
        log('Сервис найден, получение характеристики...');

        return service.getCharacteristic(0xFFE1);
      }).
      then(characteristic => {
        log('Характеристика получена');
        characteristicCache = characteristic;

        return characteristicCache;
      });
}

// Включение получения уведомлений об изменении характеристики
function startNotifications(characteristic) {
  log('Запуск уведомлений...');

  return characteristic.startNotifications().
      then(() => {
        log('Уведомления запущены');
		connectionFlagBT = true;
        characteristic.addEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
      });
}

// Получение данных
function handleCharacteristicValueChanged(event) {
  let value = new TextDecoder().decode(event.target.value);
	// обработка пакетов размером более 20 Байт
  for (let c of value) {
    if (c === '\n') {
      let data = readBuffer.trim();
      readBuffer = '';

      if (data) {
        receive(data);
      }
    }
    else {
      readBuffer += c;
    }
  }
}

// Отключиться от подключенного устройства
function disconnect(form) {
	Sound('click');
//	openTermForm(1);

  if (deviceCache) {
    log('Отключение от Bluetooth-устройства "' + deviceCache.name + '" ...');
    deviceCache.removeEventListener('gattserverdisconnected',
        handleDisconnection);

    if (deviceCache.gatt.connected) {
      deviceCache.gatt.disconnect();
      log('Bluetooth-устройство "' + deviceCache.name + '" отключено');
    }
    else {
      log('Bluetooth-устройство "' + deviceCache.name +
          '" уже отключено');
    }
  }

  if (characteristicCache) {
    characteristicCache.removeEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged);
    characteristicCache = null;
  }

  if (checkcode == true || checkcode == "true") {
	deviceCache = null;	// если не обнулять, то автоматическое подключение к последнему устройству
  } 
  
  connectionFlagBT = false;
  	openForm(form);
	openTermForm(0);
}


// Отправить данные подключенному устройству по Bluetooth
function sendBt(data) {
  data = String(data);

  if (!data || !characteristicCache) {
    return;
  }

  if (data == '@O') clearInterval(timerID);
  
  if (data.length > 20) {
    data += '|';
	let chunks = data.match(/(.|[\r\n]){1,19}/g);
//	chunks += '|';
	chunks[0] += '^';
	log(chunks[0], 'out');
	console.log(chunks[0]);
  
    writeToCharacteristic(characteristicCache, chunks[0]);

    for (let i = 1; i < chunks.length; i++) {
      chunks[i] += '^';
	  log(chunks[i], 'out');
	  console.log(chunks[i]);
	  setTimeout(() => {
        writeToCharacteristic(characteristicCache, chunks[i]);
      },i*500);
    }
  }
  else {
    writeToCharacteristic(characteristicCache, data);
  }

  log(data, 'out');

}

// Записать значение в характеристику
function writeToCharacteristic(characteristic, data) {
  characteristic.writeValue(new TextEncoder().encode(data));
}
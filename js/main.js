// Получение ссылок на элементы UI
//let connectButton = document.getElementById('btn_Connect');
//let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('terminal-form');
let inputField = document.getElementById('inputTerminal');

let isTerminalAutoScrolling = true;

let dataInput = '';
let dataExchange = false;
let passFlag = false;
let authorization = false;
let connectionFlag = false;
let code = 2345;

// Проверка кода подключения к устройству //
function choiseInput(inputName, form) {
	let choise = document.getElementById(inputName);
	if (choise.value == code) {
		choise.value = '';
		passFlag = true;
		closeAllMsg();
		closeAllForms();
		openTermForm();
		connection(form);
		
	} else if (choise.value == '') {
		noneCodeInput();
		}else {
			choise.value = '';  // Обнулить текстовое поле
			MsgNone();
			}
}

// обработчик подключения к устройству по кнопке //
async function connection(form) {
	openTermForm(1);
	await connect();		// вызов функции подключения
	if (connectionFlag) {
		openForm(form);
		let targetForm = document.getElementById(form);
		targetForm.insertAdjacentHTML('afterbegin',
      '<span class="green-msg-connect">Соединение установлено !</span>');
		  if (passFlag) {
			  targetForm.insertAdjacentHTML('afterbegin',
		  '<span class="green-msg-access">Полный доступ к управлению</span>');
		  } else {
			  targetForm.insertAdjacentHTML('afterbegin',
		  '<span class="green-msg-no-access">Управление лестницей ограничено</span>');
		  }
		openTermForm(0);
	} else {
		alert ('Соединение потеряно!');
		openTermForm(0);
	}
}

// Подключение к устройству при нажатии на кнопку Connect
//connectButton.addEventListener('click', function() {
//  connect();
//});

// Обработчик выбранных чекбоксов включения сценариев //
function checkedCheckbox() {
	const chbArray = {};
	let dataOut = '@';
	document.querySelectorAll('label:has(+ input:checked)').forEach((elem) => {
		let checkedBoxes = elem.innerHTML;
//		console.log(checkedBoxes);
		let labelID = elem.getAttribute('id');
//		console.log(labelID);
		chbArray[checkedBoxes] = labelID;
	
		switch (checkedBoxes) {
			case 'Включить все ступени':
				dataOut += 'A';      // (0x41)
				break;
			case 'Восходящая волна':
				dataOut += 'Uu';      //(0x55,0x75)
				break;
			case 'Нисходящая волна':
				dataOut += 'Dd';      //(0x44,0x64)
				break;
			case 'Встречные волны':
				dataOut += 'Tt';      //(0x54,0x74)
				break;
			case 'Расходящиеся волны':
				dataOut += 'Ff';      //(0x46,0x66)
				break;
			case 'Люминесцентная лампа':
				dataOut += 'L';       //(0x4C)
				break;
			case 'Туда-обратно':
				dataOut += 'UuDd'; //(0x55,0x75,0x44,0x64)
				break;
			case 'SOS':
				dataOut += 'S';      //(0x53)
				break;
			case 'Выключить':
				dataOut += 'a';      //(0x61)
				break;
			default:
				break;
		}
	});
		console.log(dataOut);		// удалить!!
		send (dataOut);
		dataOut = '';
		
	for (key in chbArray) {			// удалить !!
		console.log(`${key} = ${chbArray[key]}`);
	}
}


// Отключение от устройства при нажатии на кнопку Disconnect
// disconnectButton.addEventListener('click', function() {
//  disconnect();
// });

// Обработка события отправки формы
sendForm.addEventListener('submit', function(event) {
  event.preventDefault(); // Предотвратить отправку формы
  send(inputField.value); // Отправить содержимое текстового поля
  inputField.value = '';  // Обнулить текстовое поле
  inputField.focus();     // Вернуть фокус на текстовое поле
});

// Кэш объекта выбранного устройства
let deviceCache = null;

// Кэш объекта характеристики
let characteristicCache = null;

// Промежуточный буфер для входящих данных
let readBuffer = '';

// Запустить выбор Bluetooth устройства и подключиться к выбранному
function connect() {
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
		connectionFlag = true;
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

// Обработка полученных данных
function receive(data) {
  log(data, 'in');
  dataExchange = true;
  dataInput = data;
}

// Вывод в терминал
function log(data, type = '') {
  terminalContainer.insertAdjacentHTML('beforeend',
      '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
	
	if (isTerminalAutoScrolling) {
    scrollElement(terminalContainer);
  }
}

// Отключиться от подключенного устройства
function disconnect(form) {
	openTermForm(1);

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

  deviceCache = null;	// если не обнулять, то автоматическое подключение к последнему устройству
  
  connectionFlag = false;
  	openForm(form);
	openTermForm(0);
}

// Отправить данные подключенному устройству
function send(data) {
  data = String(data);

  if (!data || !characteristicCache) {
    return;
  }

 // data += '\n';


  if (data.length > 20) {
    let chunks = data.match(/(.|[\r\n]){1,20}/g);

    writeToCharacteristic(characteristicCache, chunks[0]);

    for (let i = 1; i < chunks.length; i++) {
      setTimeout(() => {
        writeToCharacteristic(characteristicCache, chunks[i]);
      }, i * 100);
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
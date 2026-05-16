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
let codeFlag = false;
let authorization = false;
let connectionFlagBT = false;
let connectionFlagWiFi = false;


////////////////////////////// Проверка кода доступа при подключении к устройству по Bluetooth///////////////////////////////
function choiseInputBt(inputName, form, backform) {
	Sound('click');
	let choise = document.getElementById(inputName);
	
	if (checkcode == false || checkcode == "false") {
		codeFlag = true;
		closeAllMsg();
		closeAllForms();	
		
	//	openForm(form);								// временное, удалить!!!!!

		connectionBt(form, backform);   						//  восстановить !!!


	} else if (choise.value != "" && choise.value == code) {
		choise.value = '';
		codeFlag = true;
		closeAllMsg();
		closeAllForms();
	//	openTermForm();


	//	openForm(form);								// временное, удалить!!!!!

		connectionBt(form, backform);   						//  восстановить !!!
		
	} else if (choise.value == '') {
		noneCodeInput();
		}else {
			choise.value = '';  // Обнулить текстовое поле
			MsgNone();
			}
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////// Проверка кода доступа при подключении к устройству по WiFi///////////////////////////////
function choiseInputWiFi(inputName, form, backform) {
	Sound('click');
	let choise = document.getElementById(inputName);
	
	if (checkcode == false || checkcode == "false") {
		codeFlag = true;
		closeAllMsg();
		closeAllForms();		
		connectionWiFi(form, backform);   //          ??????????????????????
	} else if (choise.value != "" && choise.value == code) {
		choise.value = '';
		codeFlag = true;
		closeAllMsg();
		closeAllForms();
	//	openTermForm();
		connectionWiFi(form, backform);     //          ??????????????????????
		
	} else if (choise.value == '') {
		noneCodeInput();
		}else {
			choise.value = '';  // Обнулить текстовое поле
			MsgNone();
			}
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////// Обработчик выбранных чекбоксов включения сценариев /////////////////////////////////////
function checkedCheckbox() {
	Sound('click');
	const chbArray = {};
	let dataOut = new String('@');
	document.querySelectorAll('label:has(+ input:checked)').forEach((elem) => {
		let checkedBoxes = elem.innerHTML;
		console.log(checkedBoxes);
		let labelID = elem.getAttribute('id');
		console.log(labelID);
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
			case 'Зациклить сценарий':
				dataOut += 'C';      //(0x43)
				break;
			default:
				
				break;
		}
	});
		
		if (!dataOut.includes('C')) {		// если в строке нет 'C' (0x43) -(зацикливание не выбрано)
			dataOut += 'c';          // (0x63)  -  добавим в строку отмену зацикливания
		}
		
		console.log(dataOut);		// удалить!!
		sendOut(dataOut);				// отправить
		dataOut = '';
		
	for (key in chbArray) {			// удалить !! и выше chbArray тоже
		console.log(`${key} = ${chbArray[key]}`);
	}
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////// Обработка события отправки формы ////////////////////////////////////////////////
sendForm.addEventListener('submit', function(event) {
  event.preventDefault(); 		// Предотвратить отправку формы
  sendOut(inputField.value); 	// Отправить содержимое текстового поля   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  inputField.value = '';  // Обнулить текстовое поле
  inputField.focus();     // Вернуть фокус на текстовое поле
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////// Распределение каналов отправки /////////////////////////////////////////////////
async function sendOut(data){
	dataInput = '';
	if(connectionFlagWiFi){
		sendWiFi(data); 			// Отправить по WiFi
	} else	sendBt(data);				// по Bluetooth

	if (typeof logToIndexedDB === 'function') {
        await logToIndexedDB(data, 'send', 'Отправка команды');
    }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////// Обработка полученных данных ////////////////////////////////////////////////////
function receive(data) {
  log(data, 'in');
  dataExchange = true;
  dataInput = data;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////// Вывод в терминал ///////////////////////////////////////////////////////////////
function log(data, type = '') {
  terminalContainer.insertAdjacentHTML('beforeend',
      '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
	
	if (isTerminalAutoScrolling) {
    scrollElement(terminalContainer);
  }

	if (savelog == true || savelog == "true") {
	//	LocalStorageEntry(getDateTime(), data);			// запись логов  в LocalStorage отключил, т.к. добавил IndexedDB
	//  console.log(getDateTime());

		if (typeof logToIndexedDB === 'function') {					// проверить запись в  БД !!!!!!!!
			logToIndexedDB(data, 'receive', 'Получен ответ');
		}

	}
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Отслеживаем все перезагрузки страницы
window.addEventListener('beforeunload', function(e) {
    console.log('Страница будет перезагружена!');
    console.trace(); 					// Покажет стек вызовов
});


 let passForm = document.getElementById('2form-auth'); 
 let inputPass = document.getElementById('input_box');
// let bckToGen = document.getElementById('btn_Back_Gen');
let greenMsg = false;
let redMsg = false;
let passWord = "qwerty";

// при загрузке выключить все сообщения о неверном пароле и коде //
document.getElementById("wr_pass").style.display = "none"; 
document.getElementById("wr_code").style.display = "none"; 
document.getElementById("non_code").style.display = "none";  
document.getElementById("none_pass").style.display = "none";

/* пишем в поле значение ползунка яркости по умолчанию при загрузке */
let range = document.querySelector('.range-input');
document.getElementById("progress_value").innerHTML = range.value;

/* получаем текущее значение ползунка от устройства по кнопке - !!! удалить !!!*/
function progressValue() {
	send('!'+'10'); 		// запрос к устройству (0x21, 10)
	setTimeout(getBrightValue,300);
}

/* устанавливаем текущее значение яркости устройства при загрузке формы*/
function getBrightValue() {
	let bright = dataInput / 40.95 ;
	document.getElementById("progress_value").innerHTML = Math.round(bright);
	document.querySelector('.range-input').value = Math.round(bright);
};

let brightValue = function () {
	document.getElementById("progress_value").innerHTML = this.value;
	let sendVal = Math.round(this.value * 40.95);
	let dataSend = '#'+'10'+':'+ sendVal + ';#';
	send (dataSend);
} 

/* Контроль движения ползунка яркости */
range.addEventListener('input', brightValue, false);

/* Контроль отпускания ползунка яркости */
range.addEventListener('mouseup', brightValue, false);

//  //
function MsgNone() {
	if (authorization) {
		document.getElementById("gr_Msg").style.display = "none";
	} else {	
		document.getElementById("red_Msg").style.display = "none";
	}
	document.getElementById("non_code").style.display = "none";	
	document.getElementById("wr_code").style.display = "block";
}

//  //
function noneCodeInput() {
	if (authorization) {
		document.getElementById("gr_Msg").style.display = "none";
	} else {
		document.getElementById("red_Msg").style.display = "none";
	}
	document.getElementById("wr_code").style.display = "none";	
	document.getElementById("non_code").style.display = "block";
}

// Обработка события ввода пароля //
passForm.addEventListener('submit', function(event) {
	event.preventDefault(); // Предотвратить отправку формы
	if (inputPass.value == passWord) {
		passFlag = true;
		inputPass.value = '';  	// Обнулить текстовое поле
		document.getElementById("wr_pass").style.display = "none";
		openForm('6form-with-auth');

	} else if (inputPass.value == '') {
		document.getElementById("wr_pass").style.display = "none";
		document.getElementById("none_pass").style.display = "block";
		inputPass.focus();     // Вернуть фокус на текстовое поле
		} else	{
			inputPass.value = '';  // Обнулить текстовое поле
			inputPass.focus();     // Вернуть фокус на текстовое поле
			document.getElementById("none_pass").style.display = "none";
			document.getElementById("wr_pass").style.display = "block";
			}
});

// подключение без кода доступа //
function OnOffStaircase(val) {
	//openTermForm();
	if (val) {
		send('@A');		// (0x40, 0x41)
		document.getElementById("btn_On_Staircase").style.display = "none";
		document.getElementById("btn_On_Staircase2").style.display = "none";
		document.getElementById("btn_On_Staircase3").style.display = "none";
		document.getElementById("btn_Off_Staircase").style.display = "block";
		document.getElementById("btn_Off_Staircase2").style.display = "block";
		document.getElementById("btn_Off_Staircase3").style.display = "block";
	} else {
		send('@a');		//(0x40, 0x61)
		document.getElementById("btn_Off_Staircase").style.display = "none";
		document.getElementById("btn_Off_Staircase2").style.display = "none";
		document.getElementById("btn_Off_Staircase3").style.display = "none";
		document.getElementById("btn_On_Staircase").style.display = "block";
		document.getElementById("btn_On_Staircase2").style.display = "block";
		document.getElementById("btn_On_Staircase3").style.display = "block";
	}
}

// Закрыть все формы //
function closeAllForms() {
	let formsToHide = document.getElementsByClassName("tab-form");
	for (var i = 0; i < formsToHide.length; i++) {
		formsToHide[i].style.display = "none";
	}
	clearAllInputs();
}

// Закрыть все сообщения //
function closeAllMsg() {
	document.getElementById("wr_pass").style.display = "none"; 
	document.getElementById("wr_code").style.display = "none"; 
	document.getElementById("non_code").style.display = "none";
	document.getElementById("none_pass").style.display = "none";
}

// Очистить все поля ввода //
function clearAllInputs() {
	document.getElementById('input_Code').value = '';
	inputPass.value = '';  // Обнулить текстовое поле
}

// Открыть нужную форму //
function openForm(needForm) {
	closeAllForms();
	closeAllMsg();
	clearAllInputs();
	let targetForm = document.getElementById(needForm);
	targetForm.style.display = "block";
	
	if (needForm == '6form-with-auth') {
		document.getElementById('6form-with-auth').insertAdjacentHTML('afterbegin', 
			'<span class="green-msg-success">Добро пожаловать!</span>');
			
	}
	
	if (needForm == '7form-connect-with-auth') {
		if (passFlag) {
			if (greenMsg){
				let elem = document.querySelector('#gr_Msg');
				elem.remove();
				greenMsg = false;
			}
			targetForm.insertAdjacentHTML('afterbegin',
				'<span class="green-msg-success" id="gr_Msg">Добро пожаловать!</span>');
			authorization = true;
			greenMsg = true;
		} else {
			if (redMsg){
				let elem = document.querySelector('#red_Msg');
				elem.remove();
				redMsg = false;
			}
			targetForm.insertAdjacentHTML('afterbegin',
				'<span class="red-msg" id="red_Msg">Вы не авторизованы!<br><small><small>Ваши функции ограничены.</small></small></span>');			
			authorization = false;
			redMsg = true;
		}
	}
	
	if (needForm == '11form-scenario-set') {
		send('!'+'10'); 		// запрос значения яркости от устройства (0x21, 10)
		setTimeout(getBrightValue,300);
	}
}

// Закрыть приложение //
function windowClose() {
//window.location.href="about:blank";
window.close();
}


function touchHandler(event) {
    var touch = event.changedTouches[0];

    var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent({
        touchstart: "mousedown",
        touchmove: "mousemove",
        touchend: "mouseup"
    }[event.type], true, true, window, 1,
        touch.screenX, touch.screenY,
        touch.clientX, touch.clientY, false,
        false, false, false, 0, null);

    touch.target.dispatchEvent(simulatedEvent);
 //   event.preventDefault();
}

function init(e) {
    e.addEventListener("touchstart", touchHandler, true);
    e.addEventListener("touchmove", touchHandler, true);
    e.addEventListener("touchend", touchHandler, true);
    e.addEventListener("touchcancel", touchHandler, true);
}





let draggingElement;
let touchElement;
let originalElement;
let cloneElement;
let offsetX;
let offsetY;

	// Drag & Drop сценариев //
document.querySelectorAll('.label').forEach(e => {		// для каждого сценария
    e.draggable = true;			// добавляем свойство позволяющее перетаскивание

		// события для мыши:
    e.ondragstart = e => {		// если перетаскивание начато
        
		e.dataTransfer.setData("text/plain", e.target.id);		// задаем тип и значение перетаскиваемых данных
        e.target.classList.add('dragging');			// добавляем к классу 'dragging' (чтобы css отрабатывал)
    }

    e.ondragover = e => {		// когда над целью перетаскивания
        
		e.preventDefault();		// отменить стандартные вызовы, чтобы поле не двигалось
        let old = document.querySelector('.over');		// ищем через класс элемент
        old && old.classList.remove('over');		// удаляем через класс рамку элемента
        e.target.classList.add('over');		// задаем текущему элементу рамку через класс (см.CSS)
    }

    e.ondrop = e => {			// при сбрасывании на цель
        
		let old = document.querySelector('.dragging');		// ищем через класс элемент
        old && old.classList.remove('dragging');		// удаляем класс 'dragging' элемента
        old = document.querySelector('.over');			// ищем через класс элемент
        old && old.classList.remove('over');			// удаляем через класс рамку элемента 
        let v = e.target.innerHTML;						// сохраняем текст 'label'
        let a = e.dataTransfer.getData('text/plain');	// получаем по типу значение перетаскиваемых данных
        let fromEl = document.querySelector('#'+ a);	// находим элемент по полученному значению
        e.target.innerHTML = fromEl.innerHTML;			// подменяем цель на перетаскиваемый элемент
        fromEl.innerHTML = v;							// подменяем перетаскиваемый элемент на цель
    }
	
	// события для тача:
   e.addEventListener('touchstart', function(event) {		// прикосновение тача
        
		touchElement = event.target.id;			//  сохраняем ID перетаскиваемого элемента
		originalElement = event.target;				// сохраняем 'label' целиком
		offsetX = event.changedTouches[0].clientX - originalElement.getBoundingClientRect().left;	// смещение элемента по X, относительно тача
		offsetY = event.changedTouches[0].clientY - originalElement.getBoundingClientRect().top;	// смещение элемента по Y, относительно тача
		cloneElement = originalElement.cloneNode(true);		// клонируем перетаскиваемый элемент
		cloneElement.id = 'clone-' + touchElement;			// задаем ID клону
		cloneElement.classList.add('clone');				// задаем клону класс .clone
		document.body.appendChild(cloneElement);			// вставляем клон в тело документа
		let rect = originalElement.getBoundingClientRect();	// получаем расположение перетаскиваемого элемента относительно окна
		cloneElement.style.left = rect.left + 'px';		//	передаем эти кооржинаты X клону
		cloneElement.style.top = rect.top + 'px';		//	передаем эти кооржинаты Y клону
		event.target.classList.add('dragging');		//	добавляем перетаскиваемому элементу класс 'dragging'
		event.target.classList.add('over');			//	добавляем перетаскиваемому элементу класс 'over'
    })

    e.addEventListener('touchmove', e => {		// перемещение тача
		
		e.preventDefault();						// отменить стандартные вызовы, чтобы поле не двигалось
		cloneElement.style.left = e.changedTouches[0].clientX - offsetX + 'px';	// задаем клону смещение относительно тача по X
		cloneElement.style.top = e.changedTouches[0].clientY - offsetY + 'px';	// задаем клону смещение относительно тача по Y	
		const dropElement = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);	// фиксируем элемент под тачем
		if (dropElement && dropElement.classList.contains('label')) {	//	если этот элемент 'label'
			let old = document.querySelector('.over');	//	 ищем через класс элемент
			old && old.classList.remove('over');		// удаляем через класс рамку элемента
			dropElement.classList.add('over');			// задаем текущему элементу рамку через класс (см.CSS)
		}
	})
	

    e.addEventListener('touchend', e => {	// если тач отпустили
        
		cloneElement.remove();					// удаляем клона
		const dropElement = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);	// фиксируем элемент под тачем
		if (dropElement && dropElement.classList.contains('label')) {	//	если этот элемент 'label'
			let old = document.querySelector('.dragging');		//	 ищем через класс элемент
			old && old.classList.remove('dragging');			// удаляем класс 'dragging' элемента
			old = document.querySelector('.over');				//	 ищем через класс элемент
			old && old.classList.remove('over');				// удаляем через класс рамку элемента
			

			let v = dropElement.innerHTML;						// сохраняем текст 'label'
			let a = touchElement;								// получаем ID перетаскиваемого элемента 
			let fromEl = document.querySelector('#'+ a);		// находим элемент по полученному значению
			dropElement.innerHTML = fromEl.innerHTML;			// подменяем цель на перетаскиваемый элемент
			fromEl.innerHTML = v;								// подменяем перетаскиваемый элемент на цель
		}
		touchElement = null;									// обнуляем ID перетаскиваемого элемента
    })	
});


// Обработка полей формы настроек лестницы при вводе значений//
function serializeForm(formNode) {
  const {elements} = formNode
  
  const data = Array.from(elements)
	.filter((item) => !!item.name)
	.map((elem) => {
	  const {name, value} = elem
	  return {name, value}
  })
  
  let filtered = data.filter(function(el){		// фильтр списка
	  return el.value != '';						// только заполненные поля 
  })
  
  let dataOut = '#';
  filtered.forEach((val) => {
	  switch (val.name) {
		  case 'number_of_steps':
			  dataOut += '8'+':'+ val.value + ';';
			  break;
		  case 'max_bright':
			  dataOut += '10'+':'+ val.value + ';';
			  break;
		  case 'emergency_bright':
			  dataOut += '9'+':'+ val.value + ';';
			  break;
		  case 'brightness_step':
			  dataOut += '14'+':'+ val.value + ';';
			  break;
		  case 'step_delay':
			  dataOut += '15'+':'+ val.value + ';';
			  break;
		  case 'next_step_delay':
			  dataOut += '11'+':'+ val.value + ';';
			  break;
		  case 'delay_before_off':
			  dataOut += '12'+':'+ val.value + ';';
			  break;
		  case 'landing_step':
			  dataOut += '16'+':'+ val.value + ';';
			  break;
		  case 'all_step_on_delay':
			  dataOut += '13'+':'+ val.value + ';';
			  break;
		  case 'light_sens_threshold':
			  dataOut += '0'+':'+ val.value + ';';
			  break;
		  case 'day_night_delay':
			  dataOut += '1'+':'+ val.value + ';';
			  break;
		  case 'top_sonar_range':
			  dataOut += '2'+':'+ val.value + ';';
			  break;
		  case 'bottom_sonar_range':
			  dataOut += '3'+':'+ val.value + ';';
			  break;
		  case 'switch_sonar_range':
			  dataOut += '4'+':'+ val.value + ';';
			  break;
		  case 'sonar_shots_delay':
			  dataOut += '5'+':'+ val.value + ';';
			  break;
		  case 'polling_interval_trigg':
			  dataOut += '6'+':'+ val.value + ';';
			  break;
		  case 'number_sonar_trigg':
			  dataOut += '7'+':'+ val.value + ';';
			  break;
	  }
  })
		dataOut += '#';
			send (dataOut);
		dataOut = '';
		
  console.log(filtered)  // впоследствии удалить!
}

// Загрузка настроек лестницы по нажатию кнопки Загрузить настройки//
async function getSettings() {
	dataInput = '';
	dataExchange = false;
	send ('?');
	if(dataExchange) {
		dataExchange = false;
		downloadSettings();
	} else {
		setTimeout(downloadSettings, 300);
		}
}

// загрузка настроек лестницы
function downloadSettings() {
	console.log(dataInput);		// удалить !!
	dataExchange = false;
	let tempData = dataInput.split(':');
	tempData.forEach((val, index) => {
		switch (index) {
			case 0:
				document.getElementById('light-sens-threshold').value = val;
				break;
			case 1:
				document.getElementById('day-night-delay').value = val;
				break;
			case 2:
				document.getElementById('top-sonar-range').value = val;
				break;
			case 3:
				document.getElementById('bottom-sonar-range').value = val;
				break;
			case 4:
				document.getElementById('switch-sonar-range').value = val;
				break;
			case 5:
				document.getElementById('sonar-shots-delay').value = val;
				break;
			case 6:
				document.getElementById('polling-interval-trigg').value = val;
				break;
			case 7:
				document.getElementById('number-sonar-trigg').value = val;
				break;
			case 8:
				document.getElementById('number-of-steps').value = val;
				break;
			case 9:
				document.getElementById('emergency-bright').value = Math.round(val / 40.95);
				break;
			case 10:
				document.getElementById('max-bright').value = Math.round(val / 40.95);
				break;
			case 11:
				document.getElementById('next-step-delay').value = val;
				break;
			case 12:
				document.getElementById('delay-before-off').value = val;
				break;
			case 13:
				document.getElementById('all-step-on-delay').value = val;
				break;
			case 14:
				document.getElementById('brightness-step').value = val;
				break;
			case 15:
				document.getElementById('step-delay').value = val;
				break;
			case 16:
				document.getElementById('landing-step').value = val;
				break;
		}
 })
	dataInput = '';
}

// обработчик отправки формы настроек лестницы
const applicantForm = document.getElementById('10form-stair-settings')
applicantForm.addEventListener('submit', handleFormSubmit)

// ручная отправка формы настроек лестницы
function handleFormSubmit(event) {
  event.preventDefault()
  serializeForm(applicantForm)
}

// Проверка ввода значений в форме настроек лестницы //
function checkValue(input) {
	if (input.name == "number_of_steps") {
		document.getElementById('landing-step').value = 0;
	}
	if (input.name == "landing_step") {
		if (document.getElementById('number-of-steps').value == "") {
			input.value = 0;
		} else {
			input.max = document.getElementById('number-of-steps').value;
		}
	}
	if (input.value > input.max && input.value.length >= input.max.length) {
		input.value = input.max;
	} else if (input.value < input.min) {
		input.value = input.min;
	}
}
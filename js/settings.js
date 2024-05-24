let defaultPassWord = "qwerty";
let defaultCode = "0000";
let defaultFone = "url('images/blue.jpg')";
let defaultSound = false;
let defaultCheckPass = false;
let defaultCheckCode = false;
let defaultLog = false;
let fone = "";
let sound = false;
let checkpass = false;
let checkcode = false;
let savelog = false;

let creak = new Audio(); // Создаём новый элемент Audio
creak.src = 'sounds/creak.mp3'; // Указываем путь к звуку 
let click = new Audio(); // Создаём новый элемент Audio
click.src = 'sounds/click.mp3'; // Указываем путь к звуку 

async function Sound(soundname) {
	if (sound == true || sound == "true") {
		if (soundname == 'creak') creak.play();
		if (soundname == 'click') click.play();
	}
}


// Получение текущей даты и времени
function getDateTime() {
        let now     = new Date(); 
        let year    = now.getFullYear();
        let month   = now.getMonth()+1; 
        let day     = now.getDate();
        let hour    = now.getHours();
        let minute  = now.getMinutes();
        let second  = now.getSeconds(); 
        let millisecond  = now.getMilliseconds(); 
        if(month.toString().length == 1) {
             month = '0'+month;
        }
        if(day.toString().length == 1) {
             day = '0'+day;
        }   
        if(hour.toString().length == 1) {
             hour = '0'+hour;
        }
        if(minute.toString().length == 1) {
             minute = '0'+minute;
        }
        if(second.toString().length == 1) {
             second = '0'+second;
        }   
        if(millisecond.toString().length == 1) {
             millisecond = '0'+millisecond;
        }   
        var dateTime = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second+':'+millisecond;   
         return dateTime;	
}

// Чтение/Запись настроек при старте программы
function GetStartSettings() {

	let temppass = localStorage.getItem('PASSWORD');	// читаем текущее значение PASSWORD
	if (temppass == null) {								// если его нет в памяти
		LocalStorageEntry('PASSWORD', defaultPassWord);		// пишем в память дефолтное значение
		passWord = localStorage.getItem('PASSWORD');		// пишем в переменную текущее значение PASSWORD
	} else {											// если значение есть в памяти
		passWord = temppass;								// пишем его в переменную
	}
	
	let tempcode = localStorage.getItem('CODE');		// остальные аналогично
	if (tempcode == null) {
		LocalStorageEntry('CODE', defaultCode);
		code = localStorage.getItem('CODE');
	} else {
		code = tempcode;
	}
	
	let tempfone = localStorage.getItem('FONE');
	if (tempfone == null) {
			LocalStorageEntry('FONE', defaultFone);
			fone = localStorage.getItem('FONE');
		} else {
			fone = tempfone;
		}
	document.body.style.backgroundImage = fone;
		
	
	let tempsound = localStorage.getItem('SOUND');
	if (tempsound == null) {
		LocalStorageEntry('SOUND', defaultSound);
		sound = localStorage.getItem('SOUND');
	} else {
		sound = tempsound;
	}
	
	let tempcheck = localStorage.getItem('CHECKPASS');
	if (tempcheck == null) {
		LocalStorageEntry('CHECKPASS', defaultCheckPass);
		checkpass = localStorage.getItem('CHECKPASS');
	} else {
		checkpass = tempcheck;
	}
	
	let tempcheckcode = localStorage.getItem('CHECKCODE');
	if (tempcheckcode == null) {
		LocalStorageEntry('CHECKCODE', defaultCheckCode);
		checkcode = localStorage.getItem('CHECKCODE');
	} else {
		checkcode = tempcheckcode;
	}
	
	let templog = localStorage.getItem('LOG');
	if (templog == null) {
		LocalStorageEntry('LOG', defaultLog);
		savelog = localStorage.getItem('LOG');
	} else {
		savelog = templog;
	}
}

// обработчик формы настроек приложения
const AppSettingsForm = document.getElementById('form-app-settings')
AppSettingsForm.addEventListener('submit', FormSubmit)

// ручная отправка настроек приложения
function FormSubmit(event) {
  Sound('click');
  event.preventDefault();
	settingsForm(AppSettingsForm); 
	alert('Настройки сохранены!');
}

// Обработка полей формы настроек приложения//
async function settingsForm(formNodes) {
  const {elements} = formNodes
  
   Array.from(elements)
    .forEach((element) => {
      const { name, value, checked } = element
	  switch (name) {
		case 'FoneList':
			if (value == 'blue') {
				fone = "url('images/blue.jpg')";
			} else if (value == 'red') {
				fone = "url('images/red.jpg')";
			} else if (value == 'yellow') {
				fone = "url('images/yellow.jpg')";
			} else if (value == 'green') {
				fone = "url('images/green.jpg')";
			}
			LocalStorageEntry('FONE', fone);
			document.body.style.backgroundImage = fone;
			break;
		case 'Sound':
			sound = checked;
			LocalStorageEntry('SOUND', checked);
			break;
		case 'new_pass':
			if (value != "") {
				passWord = value;
			LocalStorageEntry('PASSWORD', passWord);				
			} else break;
			break;
		case 'new_code':
			if (value != "") {
				code = value;
				LocalStorageEntry('CODE', code);				
			} else break;
			break;
		case 'AskPassAlways':
			checkpass = checked;
			LocalStorageEntry('CHECKPASS', checked);
			break;
		case 'AskCodeAlways':
			checkcode = checked;
			LocalStorageEntry('CHECKCODE', checked);
			if (checkcode == true || checkcode == "true") deviceCache = null;
			break;
		case 'SaveLog':
			savelog = checked;
			LocalStorageEntry('LOG', checked);
			break;
	  }
	  
//      console.log({ name, value, checked })
    })
}

// Запись в локальное хранилище браузера //
function LocalStorageEntry(key, value) {
	try {
		localStorage.setItem(key, value);		// пытаемся записать в память
	} catch (e) {								// отлавливаем ошибки
		if(e instanceof DOMException && e.code === 22) {	// если есть превышение квоты пространства
			alert('Локальное хранилище переполнено. Лог будет очищен!');	// предупреждение пользователю
			window.localStorage.clear();								// очищаем локальное хранилище
			localStorage.setItem('PASSWORD', passWord);					// восстанавливаем в хранилище нужные значения
			localStorage.setItem('CODE', code);
			localStorage.setItem('FONE', fone);
			localStorage.setItem('SOUND', sound);
			localStorage.setItem('CHECKPASS', checkpass);
			localStorage.setItem('CHECKCODE', checkcode);
			localStorage.setItem('LOG', savelog);
		}
	}
}
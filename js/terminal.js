
// открытие формы терминала //
function openTermForm(val) {
	if (val) {   // если 1, то открывем форму
		document.getElementById("terminal-form").style.display = "block";
	} else {		// если 0, то закрываем форму
		document.getElementById("terminal-form").style.display = "none";
	}
}

// автоскролл внутри терминала //
const scrollElement = (element) => {
  const scrollTop = element.scrollHeight - element.offsetHeight;

  if (scrollTop > 0) {
    element.scrollTop = scrollTop;
  }
};

// ссылка на терминал
const terminalWindow = document.querySelector('.term-form')
const terminalBlock = document.querySelector('.term-block')

// состояние элемента (форма терминала) - тащат/не тащат
let dragging = false

// координаты точки до начала движения.
let startX = 0
let startY = 0

// массив стартовых обрабатываемых событий для окна терминала //
let terminal_startevent_list = ["mousedown", "touchstart"];

// отслеживаем события из массива (нажатия) для окна терминала //
terminal_startevent_list.forEach(function(event){
// при нажатии отмечаем dragging как true — элемент начали тащить.
//	terminalWindow.addEventListener(event, (e) => {
	terminalBlock.addEventListener(event, (e) => {
	  dragging = true
	  // получаем стиль элемента:
	const style = window.getComputedStyle(terminalWindow)
	  // считываем значение каждой переменной 
	const  translateX = parseInt(style.getPropertyValue('--x'))
	const  translateY = parseInt(style.getPropertyValue('--y'))
  // вычисляем начальные координаты
	if (e.type == "mousedown"){   			// для мыши
	  startX = e.pageX - translateX
	  startY = e.pageY - translateY
	} else if (e.type == "touchstart") {  	// для тача
		startX = e.touches[0].clientX - translateX
		startY = e.touches[0].clientY - translateY
	}
	})
})

// массив стартовых обрабатываемых событий для body //
let body_startevent_list = ["mousemove", "touchmove"];		// для нажатия мыши или тача

// отслеживаем события из массива (перемещения) для body //
body_startevent_list.forEach(function(event){

	// обрабатываем событие перемещения мыши по body
	document.body.addEventListener(event, (e) => {
	  // если элемент не тащат, то ничего не делаем
	  if (!dragging) return
		e.preventDefault();		// останавливаем стандартный обработчик, чтобы не таскать само body
	  // если тащат, то высчитываем новое положение,
		if (e.type == "mousemove"){				// для мыши
		  // указываем, какое значение должна принять каждая из переменных:
			terminalWindow.style.setProperty("--x", `${e.pageX - startX}px`)
			terminalWindow.style.setProperty("--y", `${e.pageY - startY}px`)
		} else if (e.type == "touchmove") {		// для тача
			terminalWindow.style.setProperty("--x", `${e.changedTouches[0].clientX - startX}px`)
			terminalWindow.style.setProperty("--y", `${e.changedTouches[0].clientY - startY}px`)
		}
	}, {passive: false}) 	// делаем функцию активной, чтобы можно было остановить стандартный обработчик

})

// массив стоповых обрабатываемых событий для body //
let body_stopevent_list = ["mouseup", "touchend"];		// для отпускания мыши или тача
body_stopevent_list.forEach(function(event){
	document.body.addEventListener(event, () => {		
	dragging = false
	})
})

const elem = document.getElementById('terminal-form');

// создаем красную кнопку закрытия формы терминала //
const handle = document.createElement('div');
Object.assign(handle.style, { width: '8px', height: '8px', background: 'blue', position: 'absolute', right: '0', bottom: '-26px', borderTopLeftRadius: '3px', borderBottomRightRadius: '10px', cursor: 'nwse-resize' });
elem.append(handle);

// создаем синий ярлычок на форме терминала для изменения размеров //
const closeTerm = document.createElement('div');
Object.assign(closeTerm.style, { width: '20px', height: '16px', background: 'red', position: 'absolute', right: '0', top: '27px', borderBottomLeftRadius: '8px', borderTopRightRadius: '10px', cursor: 'pointer'});
elem.append(closeTerm);

// при нажатии красной кнопки - закрываем терминал //
closeTerm.addEventListener('mousedown', e => {
  e.preventDefault();
  openTermForm(0);
});

// при нажатии мыши на синий ярлычок //
handle.addEventListener('mousedown', e => {
  e.preventDefault();	// останавливаем стандартный обработчик
  // получаем начальные координаты
  let startXX = e.clientX, startYY = e.clientY;	
  const startWidth = parseInt(window.getComputedStyle(elem).width, 10);
  const startHeight = parseInt(window.getComputedStyle(elem).height, 10);
	// изменяем размеры терминала
  const doDrag = (e) => {
	dragging = false;  		  
    elem.style.width = `${startWidth + e.clientX - startXX}px`;
    elem.style.height = `${startHeight + e.clientY- startYY}px`;
 };
	// прекращаем изменять размеры
  const stopDrag = () => {
    document.documentElement.removeEventListener('mousemove', doDrag, false);
    document.documentElement.removeEventListener('mouseup', stopDrag);
  };
	// вызов нужной функции при нажатии мыши и отпускании
  document.documentElement.addEventListener('mousemove', doDrag, false);
  document.documentElement.addEventListener('mouseup', stopDrag);
});

// при таче на синий ярлычок //
handle.addEventListener('touchstart', e => {
  e.preventDefault();	// останавливаем стандартный обработчик
  // получаем начальные координаты
  const startXX = e.touches[0].clientX, startYY = e.touches[0].clientY;
  const startWidth = parseInt(window.getComputedStyle(elem).width, 10);
  const startHeight = parseInt(window.getComputedStyle(elem).height, 10);
	// изменяем размеры терминала
  const doDrag = (e) => {
    elem.style.width = `${startWidth + e.changedTouches[0].clientX - startXX}px`;
    elem.style.height = `${startHeight + e.changedTouches[0].clientY- startYY}px`;
	dragging = false;
  };
	// прекращаем изменять размеры
  const stopDrag = () => {
    document.documentElement.removeEventListener('touchmove', doDrag, false);
    document.documentElement.removeEventListener('touchend', stopDrag);
  };
	// вызов нужной функции при таче и отпускании
  document.documentElement.addEventListener('touchmove', doDrag, false);
  document.documentElement.addEventListener('touchend', stopDrag);
});

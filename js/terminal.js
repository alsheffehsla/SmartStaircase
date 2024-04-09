
const scrollElement = (element) => {
  const scrollTop = element.scrollHeight - element.offsetHeight;

  if (scrollTop > 0) {
    element.scrollTop = scrollTop;
  }
};

function openTermForm(val) {
	if (val) {
		document.getElementById("terminal-form").style.display = "block";
	} else {
		document.getElementById("terminal-form").style.display = "none";
	}
}

// ссылка на терминал
const terminalWindow = document.querySelector('.term-form')

// состояние элемента - тащат/не тащат
let dragging = false

// координаты точки до начала движения.
let startX = 0
let startY = 0

// при нажатии мышью отмечаем dragging как true — элемент начали тащить.
terminalWindow.addEventListener('mousedown', (e) => {
  dragging = true

  // получаем стиль элемента:
  const style = window.getComputedStyle(terminalWindow)

  // считываем значение каждой переменной 
  const translateX = parseInt(style.getPropertyValue('--x'))
  const translateY = parseInt(style.getPropertyValue('--y'))

  // вычисляем начальные координаты
  startX = e.pageX - translateX
  startY = e.pageY - translateY
})

// обрабатываем событие перемещения мыши по body
document.body.addEventListener('mousemove', (e) => {
  // если элемент не тащат, то ничего не делаем
  if (!dragging) return

  // если тащат, то высчитываем новое положение,

  // указываем, какое значение должна принять каждая из переменных:
	terminalWindow.style.setProperty("--x", `${e.pageX - startX}px`)
	terminalWindow.style.setProperty("--y", `${e.pageY - startY}px`)
})

// когда отпускаем мышь, отмечаем dragging как false.
document.body.addEventListener('mouseup', () => {
  dragging = false
})



const elem = document.getElementById('terminal-form');
// elem.style.position = 'relative';
const handle = document.createElement('div');
Object.assign(handle.style, { width: '8px', height: '8px', background: 'blue', position: 'absolute', right: '0', bottom: '-26px', borderTopLeftRadius: '3px', borderBottomRightRadius: '10px', cursor: 'nwse-resize' });
elem.append(handle);

const closeTerm = document.createElement('div');
Object.assign(closeTerm.style, { width: '20px', height: '16px', background: 'red', position: 'absolute', right: '0', top: '27px', borderBottomLeftRadius: '8px', borderTopRightRadius: '10px', cursor: 'pointer'});
elem.append(closeTerm);

closeTerm.addEventListener('mousedown', e => {
  e.preventDefault();
  openTermForm(0);
});

handle.addEventListener('mousedown', e => {
  e.preventDefault();
  const startXX = e.pageX, startYY = e.pageY;
  const startWidth = parseInt(window.getComputedStyle(elem).width, 10);
  const startHeight = parseInt(window.getComputedStyle(elem).height, 10);

  const doDrag = (e) => {
	 
    elem.style.width = `${startWidth + e.pageX - startXX}px`;
    elem.style.height = `${startHeight + e.pageY- startYY}px`;
	dragging = false;
  };

  const stopDrag = () => {
    document.documentElement.removeEventListener('mousemove', doDrag);
    document.documentElement.removeEventListener('mouseup', stopDrag);
  };

  document.documentElement.addEventListener('mousemove', doDrag);
  document.documentElement.addEventListener('mouseup', stopDrag);
});
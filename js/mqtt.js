
let defaultServer = "m1.wqtt.ru";
let defaultPort = "19817";
let defaultUsername = "u_RH9ZJW";
let defaultUserpass = "0sisuT7y";
let defaultDeviceTopic = "tasmota_768E24";
let defaultTopik_1 = "cmnd/tasmota_768E24/SerialRecv2";
let defaultTopik_2 = "tele/tasmota_768E24/RESULT";


// обработчик формы настроек MQTT
const MqttSettingsForm = document.getElementById('form-mqtt-settings')
MqttSettingsForm.addEventListener('submit', FormMqttSubmit)

// ручная отправка настроек приложения
function FormMqttSubmit(event) {
  Sound('click');
  event.preventDefault();
	settingsMqttForm(MqttSettingsForm); 
	alert('Настройки сохранены!');
}

// Обработка полей формы настроек приложения//
async function settingsMqttForm(formNodes) {
  const {elements} = formNodes
  
   Array.from(elements)
    .forEach((element) => {
      const { name, value } = element
	  switch (name) {
		case 'server':
			if (value != "") {
				server = value;
				LocalStorageEntry('SERVER', server);				
			} else break;
			break;
		case 'port':
			if (value != "") {
				port = value;
				LocalStorageEntry('PORT', port);				
			} else break;
			break;
		case 'username':
			if (value != "") {
				username = value;
				LocalStorageEntry('USERNAME', username);				
			} else break;
			break;
		case 'userpass':
			if (value != "") {
				userpass = value;
				LocalStorageEntry('USERPASS', userpass);				
			} else break;
			break;
		case 'deviceTopic':
			if (value != "") {
				devicetopic = value;
				LocalStorageEntry('DEVICETOPIC', devicetopic);				
			} else break;
			break;
		case 'topik_1':
			if (value != "" && value != " ") {
				topik1 = value;
				LocalStorageEntry('TOPIC1', topik1);				
			} else break;
			break;
		case 'topik_2':
			if (value != "" && value != " ") {
				topik2 = value;
				LocalStorageEntry('TOPIC2', topik2);				
			} else break;
			break;
		}

    })
}

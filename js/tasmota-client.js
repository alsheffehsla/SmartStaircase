
let mqttClient = null;

function getBrokerConfig() {
  return {
    server: localStorage.getItem('SERVER'),
    port: localStorage.getItem('PORT'),
    username: localStorage.getItem('USERNAME'),
    password: localStorage.getItem('USERPASS'),
    deviceTopic: localStorage.getItem('DEVICETOPIC'),
  };
}


// обработчик подключения к устройству по кнопке подключения WiFi
async function connectionWiFi(form, backform) {
  // openTermForm(1);
  Sound('click');
	await connectWiFi();		// вызов функции подключения

  if (connectionFlagWiFi) {
		openForm(form);
		let targetForm = document.getElementById(form);
		targetForm.insertAdjacentHTML('afterbegin',
      '<span class="green-msg-connect">Соединение WiFi установлено !</span>');
		  if (codeFlag) {
			  targetForm.insertAdjacentHTML('afterbegin',
		  '<span class="green-msg-access">Полный доступ к управлению</span>');
		  } else {
			  targetForm.insertAdjacentHTML('afterbegin',
		  '<span class="green-msg-no-access">Управление лестницей ограничено</span>');
		  }
	//	openTermForm(0);
	} else {
		  alert ('Соединение WiFi потеряно!');
		  openForm(backform);
	//	openTermForm(0);
	}
}

// Запуск подключения к устройству по WiFi
function connectWiFi(form, backform) {
  return new Promise((resolve, reject) => {
    // Проверка уже подключенного клиента
    if (mqttClient && mqttClient.connected) {
      log("MQTT уже подключен");
      connectionFlagWiFi = true;
      resolve(true);  // разрешаем Promise
      return;
    }

   //  const { server, port, username, password } = getBrokerConfig();

    const url = `wss://${server}:${port}`;
    const options = {
      username: username,
      password: userpass,
      clientId: "web_client_" + Math.random().toString(16).slice(2, 8),  // уникальный ID, чтобы брокер не продолжал старую сессию
      clean: true,  // "чистый сеанс" - при каждом подключении клиент считается «новым»
      reconnectPeriod: 5000,
    };

    try {
      log("Соединение с " + url);
      mqttClient = mqtt.connect(url, options);

      mqttClient.on("connect", () => {
        log("MQTT подключен");
        connectionFlagWiFi = true;
        subscribe();
        resolve(true);  // Разрешаем Promise при успешном подключении
      });

      mqttClient.on("message", (topic, payload) => {
        const text = payload.toString();
        const content = extractSerial(text);
        if(content){
          receive(content);
        }

      });

      mqttClient.on("error", (err) => {
        log("MQTT ERROR: " + (err ? err.message || err : "unknown"));
        reject(err);  // Отклоняем Promise при ошибке
      });

      mqttClient.on("close", () => {
        log("MQTT отключен");
        connectionFlagWiFi = false;
        manageStatusTimer();
      });

    } catch (e) {
      log("MQTT ERROR: " + e.message);
      reject(e);
    }
  });
}

// Извлечение данных из входной строки
function extractSerial(str) {
  try {
    const obj = JSON.parse(str);
    return obj.SerialReceived || str;
  } catch (e) {
    return str;
  }
}



// MQTT подписка на топики подключенного устройства 
function subscribe() {
  //const topics = getSubscribeTopics();
  const topics = ["cmnd/tasmota_768E24/SerialRecv2", "tele/tasmota_768E24/RESULT"];
  if (mqttClient && mqttClient.connected) {
    topics.forEach(topic => {
      mqttClient.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          log("ОШИБКА: " + topic + " " + err);
        } else {
          log("ПОДПИСКА: " + topic);
        }
      });
    });
  }
}

function publish(topic, payload) {
  if (!mqttClient || !mqttClient.connected) {
    log("Не отправлено (нет соединения)");
    return;
  }

  mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      log("PUB ERROR: " + topic + " " + err);
    } else {
      log(`${payload}`, 'out');
    }
  });
}

function sendWiFi(data) {
  const { deviceTopic } = getBrokerConfig();
  const topic = `cmnd/${deviceTopic}/SerialSend2`;
  //const msg = document.getElementById("sendMsg").value.trim();
  const msg = data;
  if (!msg) {
    log("Не отправлено (пустое сообщение)");
    return;
  }

  publish(topic, msg);    // отправка сообщения
}

function disconnectWiFi() {
  if (mqttClient) {
    log("Отключение...");
    mqttClient.end();
    mqttClient = null;
    connectionFlagWiFi = false;
    manageStatusTimer();
  } else {
    log("Нет активного MQTT клиента");
  }
}
  
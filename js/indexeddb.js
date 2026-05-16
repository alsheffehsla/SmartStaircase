// Названия базы и хранилища
const DB_NAME = 'StaircaseDB';
const DB_VERSION = 1;
const STORE_NAME = 'event_logs';

// Открытие/создание базы данных
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = function(event) {
            console.error('Ошибка открытия IndexedDB:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            resolve(db);
        };
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            
            // Создаем хранилище, если его нет
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // Создаем индексы для удобного поиска
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                objectStore.createIndex('type', 'type', { unique: false });
                objectStore.createIndex('date', 'date', { unique: false });
                
                console.log('Хранилище IndexedDB создано');
            }
        };
    });
}

// Запись события в IndexedDB
async function writeToIndexedDB(eventData) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        
        // Формируем запись
        const record = {
            timestamp: Date.now(),
            date: new Date().toLocaleString(),
            type: eventData.type || 'info',
            command: eventData.command || '',
            data: eventData.data || '',
            details: eventData.details || ''
        };
        
        const request = objectStore.add(record);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = function() {
               // console.log('Событие сохранено в IndexedDB, id:', request.result);
                resolve(request.result);
            };
            
            request.onerror = function(event) {
                console.error('Ошибка сохранения в IndexedDB:', event.target.error);
                reject(event.target.error);
            };
            
            transaction.oncomplete = function() {
                db.close();
            };
        });
        
    } catch (error) {
        console.error('Ошибка записи в IndexedDB:', error);
    }
}

// Чтение всех событий из IndexedDB
async function readAllFromIndexedDB() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = function() {
                db.close();
                resolve(request.result);
            };
            
            request.onerror = function(event) {
                console.error('Ошибка чтения из IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
        
    } catch (error) {
        console.error('Ошибка чтения IndexedDB:', error);
        return [];
    }
}

// Чтение событий с фильтром (например, за последние N дней)
async function readFilteredFromIndexedDB(daysLimit = 7) {           // ???????????????????  можно задавать глобальной переменной
    try {
        const allEvents = await readAllFromIndexedDB();
        const limitTime = Date.now() - (daysLimit * 24 * 60 * 60 * 1000);
        
        return allEvents.filter(event => event.timestamp >= limitTime);
    } catch (error) {
        console.error('Ошибка фильтрации:', error);
        return [];
    }
}

// Удаление события по ID
async function deleteFromIndexedDB(id) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(id);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = function() {
                console.log('Событие удалено из IndexedDB, id:', id);
                db.close();
                resolve(true);
            };
            
            request.onerror = function(event) {
                console.error('Ошибка удаления из IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
        
    } catch (error) {
        console.error('Ошибка удаления:', error);
        return false;
    }
}

// Очистка всех событий (очистить хранилище)
async function clearIndexedDB() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.clear();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = function() {
                console.log('Хранилище IndexedDB очищено');
                db.close();
                resolve(true);
            };
            
            request.onerror = function(event) {
                console.error('Ошибка очистки IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
        
    } catch (error) {
        console.error('Ошибка очистки:', error);
        return false;
    }
}

// Удаление старых событий (оставить только последние N)
async function pruneOldEvents(keepCount = 10000) {      // последние 10000 событий
    try {
        const allEvents = await readAllFromIndexedDB();
        
        if (allEvents.length <= keepCount) {
            return false;
        }
        
        // Сортируем по timestamp (старые первыми)
        allEvents.sort((a, b) => a.timestamp - b.timestamp);
        const toDelete = allEvents.slice(0, allEvents.length - keepCount);
        
        for (const event of toDelete) {
            await deleteFromIndexedDB(event.id);
        }
        
        console.log(`Удалено ${toDelete.length} старых событий`);
        return true;
        
    } catch (error) {
        console.error('Ошибка очистки старых событий:', error);
        return false;
    }
}

// Экспорт всех событий в JSON
async function exportIndexedDBToJSON() {
    const events = await readAllFromIndexedDB();
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `staircase_logs_${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Экспорт завершен');
}

// Вывод количества записей
async function getIndexedDBCount() {
    try {
        const allEvents = await readAllFromIndexedDB();
        return allEvents.length;
    } catch (error) {
        console.error('Ошибка подсчета:', error);
        return 0;
    }
}



// Запись команды в IndexedDB (если включено логирование)
async function logToIndexedDB(command, direction, data) {
    if (savelog == true || savelog == "true") {
        await writeToIndexedDB({
            type: direction, // 'send' или 'receive'
            command: command,
            data: data || '',
            details: `${direction == 'send' ? 'Отправка' : 'Получение'}: ${command}`
        });
        
        // Периодически чистим старые записи (оставляем последние 500)
        const count = await getIndexedDBCount();
        if (count > 500) {
            await pruneOldEvents(400);
        }
    }
}


// Просмотр логов в консоли и алерте
async function viewIndexedDBLogs() {
    const events = await readAllFromIndexedDB();
    console.table(events);
    alert(`В базе ${events.length} событий. Откройте консоль (F12) для просмотра.`);
}
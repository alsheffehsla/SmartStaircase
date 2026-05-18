// ========== АНАЛИЗАТОР ПАР СОБЫТИЙ ==========

let currentPairs = [];
let currentPairsPage = 1;
const pairsPerPage = 20;

// Инициализация анализатора
function initPairAnalyser() {
    // Закрытие модального окна
    const closeBtn = document.querySelector('.pair-analysis-close');
    const modal = document.getElementById('modal-pair-analysis');
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (modal) modal.style.display = 'none';
        };
    }
    
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }
    
    // Кнопка анализа
    const analyzeBtn = document.getElementById('btn-analyze-pairs');
    if (analyzeBtn) {
        analyzeBtn.onclick = () => findPairs();
    }
    
    // Кнопка вычисления среднего
    const avgBtn = document.getElementById('btn-calc-average');
    if (avgBtn) {
        avgBtn.onclick = () => calculateAndShowAverage();
    }
    
    // Кнопка экспорта
    const exportBtn = document.getElementById('btn-export-pairs');
    if (exportBtn) {
        exportBtn.onclick = () => exportPairsToJSON();
    }
    
    // Нумерация страниц
    setupPairsPagination();
    
    // Заполнение выпадающих списков событиями
    loadEventOptions();
}

// Загрузка уникальных команд для выпадающих списков
async function loadEventOptions() {
    const logs = await readAllFromIndexedDB();
    const commands = [...new Set(logs.map(log => log.command).filter(c => c && c !== ''))];
    
    const select1 = document.getElementById('event1-select');
    const select2 = document.getElementById('event2-select');
    
    if (select1 && select2) {
        // const options = commands.map(cmd => `<option value="${escapeHtml(cmd)}">${escapeHtml(cmd)}</option>`).join('');    //строка обычного вывода без подмены описанием
        const options = commands.map(cmd => `<option value="${escapeHtml(cmd)}">${escapeHtml(CommandMapper.mapToReadable(cmd))}</option>`).join('');
        select1.innerHTML = '<option value="">-- Выберите событие --</option>' + options;
        select2.innerHTML = '<option value="">-- Выберите событие --</option>' + options;
    }
}

// Поиск пар событий
// Поиск пар событий (исправленная версия)
// Поиск пар событий (исправленная версия с очисткой)
async function findPairs() {
    // Получаем выбранные команды
    let event1 = document.getElementById('event1-select').value;
    let event2 = document.getElementById('event2-select').value;
    const custom1 = document.getElementById('event1-custom').value.trim();
    const custom2 = document.getElementById('event2-custom').value.trim();
    
    if (custom1) event1 = custom1;
    if (custom2) event2 = custom2;
    
    if (!event1 || !event2) {
        alert('Пожалуйста, выберите или введите оба события');
        return;
    }
    
    const maxInterval = parseInt(document.getElementById('max-interval').value) || 30000;
    
    // Получаем все логи
    const allLogs = await readAllFromIndexedDB();
    
    // Нормализуем команды для поиска
    const normalizedEvent1 = event1.trim();
    const normalizedEvent2 = event2.trim();
    
    // Ищем события
    const events1 = allLogs.filter(log => {
        if (!log.command) return false;
        return log.command.trim() === normalizedEvent1;
    }).sort((a, b) => a.timestamp - b.timestamp);
    
    const events2 = allLogs.filter(log => {
        if (!log.command) return false;
        return log.command.trim() === normalizedEvent2;
    }).sort((a, b) => a.timestamp - b.timestamp);
    
    // Если событий нет, показываем подсказку
    if (events1.length === 0) {
        alert(`Событие "${normalizedEvent1}" не найдено в логах.`);
        return;
    }
    if (events2.length === 0) {
        alert(`Событие "${normalizedEvent2}" не найдено в логах.`);
        return;
    }
    
    // Формируем пары
    const pairs = [];
    let event2Index = 0;
    
    for (const ev1 of events1) {
        while (event2Index < events2.length && events2[event2Index].timestamp <= ev1.timestamp) {
            event2Index++;
        }
        
        if (event2Index < events2.length) {
            const ev2 = events2[event2Index];
            const interval = ev2.timestamp - ev1.timestamp;
            
            if (interval <= maxInterval && interval >= 0) {
                pairs.push({
                    id: pairs.length + 1,
                    event1_time: ev1.date,
                    event1_command: ev1.command,
                    event1_timestamp: ev1.timestamp,
                    event1_id: ev1.id,
                    event2_time: ev2.date,
                    event2_command: ev2.command,
                    event2_timestamp: ev2.timestamp,
                    event2_id: ev2.id,
                    interval_ms: interval,
                    interval_sec: (interval / 1000).toFixed(3)
                });
            }
        }
    }
    
    currentPairs = pairs;
    currentPairsPage = 1;
    
    // ===== ОЧИСТКА ПРЕДЫДУЩИХ ЗНАЧЕНИЙ =====
    // Очищаем вывод среднего времени
    const avgSpan = document.getElementById('average-time');
    if (avgSpan) {
        avgSpan.innerHTML = '-';
    }
    
    // Очищаем таблицу от старых данных (покажем "загрузка")
    const tbody = document.getElementById('pairs-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7">Поиск пар...</td></tr>';
    }
    // =======================================
    
    // Показываем результаты
    const resultsDiv = document.getElementById('pairs-results');
    if (resultsDiv) resultsDiv.style.display = 'block';
    
    // Обновляем счетчик
    const countSpan = document.getElementById('pairs-count');
    if (countSpan) countSpan.textContent = pairs.length;
    
    // Рендерим таблицу
    renderPairsTable();
    
    if (pairs.length === 0) {
        alert(`Пар событий не найдено.\n\nВозможные причины:\n- События идут в неправильном порядке\n- Слишком маленький максимальный интервал\n- Между событиями есть другие события того же типа`);
    }
}

// Рендер таблицы пар
function renderPairsTable() {
    const tbody = document.getElementById('pairs-table-body');
    if (!tbody) return;
    
    if (currentPairs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Пары не найдены</td></tr>';
        return;
    }
    
    const start = (currentPairsPage - 1) * pairsPerPage;
    const end = start + pairsPerPage;
    const pagePairs = currentPairs.slice(start, end);
    const maxPage = Math.ceil(currentPairs.length / pairsPerPage);
    
    // Обновляем пагинацию
    const prevBtn = document.getElementById('btn-pairs-prev');
    const nextBtn = document.getElementById('btn-pairs-next');
    const pageInfo = document.getElementById('pairs-page-info');
    
    if (prevBtn) prevBtn.disabled = currentPairsPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPairsPage >= maxPage;
    if (pageInfo) pageInfo.textContent = `Страница ${currentPairsPage} из ${maxPage || 1}`;
    
    let html = '';
    for (const pair of pagePairs) {
        html += `
            <tr>
                <td>${pair.id}</td>
                <td style="white-space: nowrap;">${pair.event1_time}</td>
                <!-- <td><code>${escapeHtml(pair.event1_command)}</code></td>  -->       <!-- Строка для обычного вывода без подмены описанием -->
                <td><code>${escapeHtml(CommandMapper.mapToReadable(pair.event1_command))}</code></td>
                <td style="white-space: nowrap;">${pair.event2_time}</td>
                <!-- <td><code>${escapeHtml(pair.event2_command)}</code></td>  -->       <!-- Строка для обычного вывода без подмены описанием -->
                <td><code>${escapeHtml(CommandMapper.mapToReadable(pair.event2_command))}</code></td>
                <td>${pair.interval_ms.toLocaleString()} мс</td>
                <td>${pair.interval_sec} сек</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
}

// Вычисление и отображение среднего времени
function calculateAndShowAverage() {
    if (currentPairs.length === 0) {
        alert('Нет пар для вычисления среднего времени');
        return;
    }
    
    const sum = currentPairs.reduce((acc, pair) => acc + pair.interval_ms, 0);
    const average = sum / currentPairs.length;
    
    const avgSpan = document.getElementById('average-time');
    if (avgSpan) {
        avgSpan.innerHTML = `${Math.round(average).toLocaleString()} мс (${(average / 1000).toFixed(3)} сек)`;
    }
    
    // Показываем дополнительную статистику
    const minInterval = Math.min(...currentPairs.map(p => p.interval_ms));
    const maxInterval = Math.max(...currentPairs.map(p => p.interval_ms));
    
    alert(`Статистика по ${currentPairs.length} парам:\n\n` +
          `Среднее время: ${Math.round(average).toLocaleString()} мс (${(average / 1000).toFixed(3)} сек)\n` +
          `Минимальное: ${minInterval.toLocaleString()} мс (${(minInterval / 1000).toFixed(3)} сек)\n` +
          `Максимальное: ${maxInterval.toLocaleString()} мс (${(maxInterval / 1000).toFixed(3)} сек)\n` +
          `Разброс: ${(maxInterval - minInterval).toLocaleString()} мс`);
}

// Экспорт пар в JSON
function exportPairsToJSON() {
    if (currentPairs.length === 0) {
        alert('Нет пар для экспорта');
        return;
    }
    
    const dataStr = JSON.stringify(currentPairs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pairs_analysis_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Пагинация для пар
function setupPairsPagination() {
    const prevBtn = document.getElementById('btn-pairs-prev');
    const nextBtn = document.getElementById('btn-pairs-next');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentPairsPage > 1) {
                currentPairsPage--;
                renderPairsTable();
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            const maxPage = Math.ceil(currentPairs.length / pairsPerPage);
            if (currentPairsPage < maxPage) {
                currentPairsPage++;
                renderPairsTable();
            }
        };
    }
}

// Открытие окна анализа пар
function openPairAnalyzer() {
    const modal = document.getElementById('modal-pair-analysis');
    if (modal) {
        modal.style.display = 'flex';
        loadEventOptions(); // Обновляем список команд
    }
}

// Добавляем escapeHtml если её нет
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
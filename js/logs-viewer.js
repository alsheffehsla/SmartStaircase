// ========== Просмотрщик логов INDEXEDDB ==========

let currentLogsData = [];
let currentPage = 1;
let rowsPerPage = 20;
let currentFilters = {
    period: 'all',
    dateFrom: null,
    dateTo: null,
    type: 'all',
    command: ''
};

// Инициализация просмотрщика логов
let paginationInitialized = false; // Флаг, чтобы не инициализировать дважды

function initLogsViewer() {
    // Предотвращаем двойную инициализацию
    if (paginationInitialized) {
        console.log('Просмотрщик логов уже инициализирован');
        return;
    }
    paginationInitialized = true;
    
    // Применение фильтров
    const applyBtn = document.getElementById('btn-apply-filters');
    if (applyBtn) {
        // Удаляем старый обработчик, если есть
        const newApplyBtn = applyBtn.cloneNode(true);
        applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
        newApplyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            applyFiltersAndReload();
            return false;
        });
    }
    
    // Сброс фильтров
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
        const newResetBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
        newResetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            resetFilters();
            applyFiltersAndReload();
            return false;
        });
    }
    
    // Полный вывод в консоль
    const fullConsoleBtn = document.getElementById('btn-full-console');
    if (fullConsoleBtn) {
        const newFullConsoleBtn = fullConsoleBtn.cloneNode(true);
        fullConsoleBtn.parentNode.replaceChild(newFullConsoleBtn, fullConsoleBtn);
        newFullConsoleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showFullConsole();
            return false;
        });
    }
    
    // Экспорт
    const exportBtn = document.getElementById('btn-export-logs');
    if (exportBtn) {
        const newExportBtn = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
        newExportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            exportLogsToJSON();
            return false;
        });
    }
    
    // Очистка логов
    const clearBtn = document.getElementById('btn-clear-logs');
    if (clearBtn) {
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
        newClearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Очистить все логи? Это действие необратимо!')) {
                clearAllLogs();
            }
            return false;
        });
    }
    
    // График
    const chartBtn = document.getElementById('btn-chart-logs');
    if (chartBtn) {
        const newChartBtn = chartBtn.cloneNode(true);
        chartBtn.parentNode.replaceChild(newChartBtn, chartBtn);
        newChartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showChartModal();
            return false;
        });
    }
    

    setupPaginationHandlers();
    
    // Период "свои даты"
    const periodSelect = document.getElementById('filter-period');
    if (periodSelect) {
        const newPeriodSelect = periodSelect.cloneNode(true);
        periodSelect.parentNode.replaceChild(newPeriodSelect, periodSelect);
        newPeriodSelect.addEventListener('change', function(e) {
            const customDates = document.getElementById('custom-dates');
            if (e.target.value === 'custom') {
                if (customDates) customDates.style.display = 'flex';
            } else {
                if (customDates) customDates.style.display = 'none';
            }
        });
    }
    
    // Настройка сортировки
    setupSorting();
}

// Отдельная функция для настройки нумерации страниц
function setupPaginationHandlers() {
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    
    // Обработчик для кнопки "Предыдущая"
    if (prevBtn) {
        // Удаляем все старые обработчики через клонирование
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        
        newPrevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // console.log('Предыдущая страница, текущая:', currentPage);
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
            return false;
        });
    }
    
    // Обработчик для кнопки "Следующая"
    if (nextBtn) {
        // Удаляем все старые обработчики через клонирование
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        newNextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const maxPage = Math.ceil(currentLogsData.length / rowsPerPage);
            // console.log('Следующая страница, текущая:', currentPage, 'Максимум:', maxPage);
            if (currentPage < maxPage) {
                currentPage++;
                renderTable();
            }
            return false;
        });
    }
}

// Применение фильтров и перезагрузка
async function applyFiltersAndReload() {
    // Собираем фильтры
    currentFilters.period = document.getElementById('filter-period')?.value || 'all';
    currentFilters.type = document.getElementById('filter-type')?.value || 'all';
    currentFilters.command = document.getElementById('filter-command')?.value.trim() || '';
    
    if (currentFilters.period === 'custom') {
        currentFilters.dateFrom = document.getElementById('date-from')?.value || null;
        currentFilters.dateTo = document.getElementById('date-to')?.value || null;
    } else {
        currentFilters.dateFrom = null;
        currentFilters.dateTo = null;
    }
    
    // Загружаем данные
    await loadLogsData();
    
    // СБРАСЫВАЕМ СТРАНИЦУ НА 1 (важно!)
    currentPage = 1;
    
    // Рендерим таблицу
    renderTable();
    
    // Обновляем datalist команд
    updateCommandDatalist();
}


async function openLogsViewer() {
    console.log('openLogsViewer вызвана');
    
    try {
        // Открываем форму
        openForm('form-logs-viewer');
        
        // Загружаем данные
        await loadLogsData();
        
        // Сбрасываем страницу на 1
        currentPage = 1;
        
        // Переустанавливаем обработчики страниц
        setupPaginationHandlers();
        
        // Рендерим
        renderTable();
        
        // Обновляем список команд
        updateCommandDatalist();
        
        console.log('Логи загружены, записей:', currentLogsData.length);
    } catch (error) {
        console.error('Ошибка в openLogsViewer:', error);
    }
}


// Загрузка данных из IndexedDB
async function loadLogsData() {
    try {
        let logs = await readAllFromIndexedDB();
        
        // Фильтрация по периоду
        logs = filterByPeriod(logs);
        
        // Фильтрация по типу
        if (currentFilters.type !== 'all') {
            logs = logs.filter(log => log.type === currentFilters.type);
        }
        
        // Фильтрация по команде
        if (currentFilters.command) {
            logs = logs.filter(log => 
                log.command && log.command.includes(currentFilters.command)
            );
        }
        
        // Сортировка по времени (новые сверху)
        logs.sort((a, b) => b.timestamp - a.timestamp);
        
        currentLogsData = logs;
        
        // Обновляем счетчик
        const countSpan = document.getElementById('logs-count');
        if (countSpan) countSpan.textContent = `Записей: ${currentLogsData.length}`;
        
    } catch (error) {
        console.error('Ошибка загрузки логов:', error);
        currentLogsData = [];
    }
}

// Фильтрация по временному периоду
function filterByPeriod(logs) {
    const now = new Date();
    let fromDate = null;
    let toDate = null;
    
    switch (currentFilters.period) {
        case 'today':
            fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'yesterday':
            fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'custom':
            if (currentFilters.dateFrom) {
                fromDate = new Date(currentFilters.dateFrom);
            }
            if (currentFilters.dateTo) {
                toDate = new Date(currentFilters.dateTo);
                toDate.setHours(23, 59, 59);
            }
            break;
        default:
            return logs;
    }
    
    return logs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (fromDate && logDate < fromDate) return false;
        if (toDate && logDate > toDate) return false;
        return true;
    });
}

// Обновление выпадающего списка команд
function updateCommandDatalist() {
    const commands = [...new Set(currentLogsData.map(log => log.command).filter(c => c))];
    const datalist = document.getElementById('command-list');
    if (datalist) {
        datalist.innerHTML = commands.map(c => `<option value="${c}">`).join('');
    }
}

// Рендер таблицы с нумерацией страниц
function renderTable() {
    const tbody = document.getElementById('logs-table-body');
    if (!tbody) {
        console.error('Элемент logs-table-body не найден');
        return;
    }
    
    if (!currentLogsData || currentLogsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Нет данных для отображения</td></tr>';
        // Обновляем состояние кнопок страниц
        updatePaginationButtonsState();
        return;
    }
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = currentLogsData.slice(start, end);
    const maxPage = Math.ceil(currentLogsData.length / rowsPerPage);
    
    // Обновляем состояние кнопок (без навешивания обработчиков!)
    updatePaginationButtonsState(currentPage, maxPage);
    
    // Обновляем текст информации о странице
    const pageInfo = document.getElementById('page-info');
    if (pageInfo) {
        pageInfo.textContent = `Страница ${currentPage} из ${maxPage || 1}`;
    }
    
    // Рендерим строки
    let html = '';
    for (const log of pageData) {
        html += `
            <tr>
                <td style="white-space: nowrap;">${log.date || new Date(log.timestamp).toLocaleString()}</td>
                <td><code>${escapeHtml(log.command || '-')}</code></td>
                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml((log.data || log.details || '-').substring(0, 50))}</td>
                <td class="log-type-${log.type || 'info'}">${log.type || 'info'}</td>
                <td><button class="btn-details" data-id="${log.id}">Подробнее</button></td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
}

// Отдельная функция для обновления состояния кнопок нумерации страниц
function updatePaginationButtonsState(currentPageVal, maxPageVal) {
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    
    if (prevBtn) {
        prevBtn.disabled = (currentPageVal <= 1);
    }
    if (nextBtn) {
        nextBtn.disabled = (currentPageVal >= maxPageVal);
    }
}

// Показать подробности события
async function showDetails(id) {
    // console.log('showDetails вызван для id:', id);
    
    try {
        const allLogs = await readAllFromIndexedDB();
        const log = allLogs.find(l => l.id === id);
        
        if (!log) {
            console.error('Лог не найден:', id);
            return;
        }
        
        // Создаем модальное окно (если его нет)
        let detailModal = document.getElementById('detail-modal');
        if (!detailModal) {
            detailModal = document.createElement('div');
            detailModal.id = 'detail-modal';
            detailModal.className = 'detail-modal';
            detailModal.innerHTML = `
                <div class="detail-modal-content">
                    <div class="detail-modal-header">
                        <span>📋 Детальная информация о событии</span>
                        <span class="detail-modal-close">&times;</span>
                    </div>
                    <div class="detail-modal-body" id="detail-modal-body">
                        <!-- сюда вставим данные -->
                    </div>

                </div>
            `;
            document.body.appendChild(detailModal);
        }
        
        // Формируем содержимое
        const detailsHtml = `
            <table class="detail-table">
                <tr><th>Поле</th><th>Значение</th></tr>
                <tr><td>ID</td><td>${log.id}</td></tr>
                <tr><td>Дата/Время</td><td>${log.date || new Date(log.timestamp).toLocaleString()}</td></tr>
                <tr><td>Тип события</td><td class="log-type-${log.type || 'info'}">${log.type || 'info'}</td></tr>
                <tr><td>Команда</td><td><code>${escapeHtml(log.command || '-')}</code></td></tr>
                <tr><td>Данные</td><td style="word-break: break-all;">${escapeHtml(log.data || '-')}</td></tr>
                <tr><td>Детали</td><td style="word-break: break-all;">${escapeHtml(log.details || '-')}</td></tr>
                <tr><td>Timestamp</td><td>${log.timestamp}</td></tr>
            </table>
        `;
        
        const bodyElement = document.getElementById('detail-modal-body');
        if (bodyElement) bodyElement.innerHTML = detailsHtml;
        
        // Показываем модальное окно
        detailModal.style.display = 'flex';
        
        // Настройка закрытия
        const closeBtn = detailModal.querySelector('.detail-modal-close');
        const okBtn = document.getElementById('detail-modal-ok');
        
        const closeModal = function(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            detailModal.style.display = 'none';
            return false;
        };
        
        // Удаляем старые обработчики, чтобы не было дублей
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', closeModal);
        }
        
        if (okBtn) {
            const newOkBtn = okBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOkBtn, okBtn);
            newOkBtn.addEventListener('click', closeModal);
        }
        
        // Закрытие по клику вне окна
        detailModal.addEventListener('click', function(e) {
            if (e.target === detailModal) {
                closeModal();
            }
        });
        
    } catch (error) {
        console.error('Ошибка в showDetails:', error);
    }
}

// Полный вывод 
async function showFullConsole() {
    const allLogs = await readAllFromIndexedDB();
    const output = JSON.stringify(allLogs, null, 2);
    const preElement = document.getElementById('full-console-output');
    if (preElement) {
        preElement.textContent = output;
    }
    const modal = document.getElementById('modal-full-console');
    if (modal) modal.style.display = 'block';
}

// Экспорт логов
async function exportLogsToJSON() {
    const data = currentLogsData.length > 0 ? currentLogsData : await readAllFromIndexedDB();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staircase_logs_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Очистка всех логов
async function clearAllLogs() {
    await clearIndexedDB();
    await loadLogsData();
    renderTable();
}

// Сброс фильтров
function resetFilters() {
    const periodSelect = document.getElementById('filter-period');
    const typeSelect = document.getElementById('filter-type');
    const commandInput = document.getElementById('filter-command');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    if (periodSelect) periodSelect.value = 'all';
    if (typeSelect) typeSelect.value = 'all';
    if (commandInput) commandInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    document.getElementById('custom-dates').style.display = 'none';
    
    currentFilters = {
        period: 'all',
        dateFrom: null,
        dateTo: null,
        type: 'all',
        command: ''
    };
}

// Настройка сортировки
function setupSorting() {
    const headers = document.querySelectorAll('#logs-table th');
    let sortColumn = null;
    let sortDirection = 'asc';
    
    headers.forEach((header, index) => {
        header.addEventListener('click', () => {
            const columns = ['date', 'command', 'data', 'type'];
            if (index < columns.length) {
                if (sortColumn === columns[index]) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = columns[index];
                    sortDirection = 'asc';
                }
                
                sortLogsData(sortColumn, sortDirection);
                renderTable();
            }
        });
    });
}

function sortLogsData(column, direction) {
    currentLogsData.sort((a, b) => {
        let valA, valB;
        switch (column) {
            case 'date':
                valA = a.timestamp;
                valB = b.timestamp;
                break;
            case 'command':
                valA = a.command || '';
                valB = b.command || '';
                break;
            case 'data':
                valA = (a.data || a.details || '');
                valB = (b.data || b.details || '');
                break;
            case 'type':
                valA = a.type || '';
                valB = b.type || '';
                break;
            default:
                return 0;
        }
        
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// Модальное окно для полного вывода
function setupModals() {
    // Закрытие модального окна консоли
    const closeConsole = document.querySelector('.modal-console-close');
    const modalConsole = document.getElementById('modal-full-console');
    if (closeConsole && modalConsole) {
        closeConsole.onclick = () => modalConsole.style.display = 'none';
        window.onclick = (event) => {
            if (event.target === modalConsole) modalConsole.style.display = 'none';
        };
    }
}

// График
let chartInstance = null;

async function showChartModal() {
    const modal = document.getElementById('modal-chart');
    if (!modal) return;
    
    modal.style.display = 'block';
    
    // Готовим данные для графика
    const data = currentLogsData.length > 0 ? currentLogsData : await readAllFromIndexedDB();
    const chartData = prepareChartData(data);
    
    drawChart(chartData, 'bar');
    
    // Кнопки переключения типа графика
    document.getElementById('btn-chart-bar').onclick = () => drawChart(chartData, 'bar');
    document.getElementById('btn-chart-line').onclick = () => drawChart(chartData, 'line');
}

function prepareChartData(logs) {
    // Группируем по дням и типам
    const dailyStats = {};
    
    logs.forEach(log => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!dailyStats[date]) {
            dailyStats[date] = { send: 0, receive: 0, system: 0, info: 0, error: 0 };
        }
        const type = log.type || 'info';
        if (dailyStats[date][type] !== undefined) {
            dailyStats[date][type]++;
        } else {
            dailyStats[date]['info']++;
        }
    });
    
    const dates = Object.keys(dailyStats).sort();
    const sendData = dates.map(d => dailyStats[d].send);
    const receiveData = dates.map(d => dailyStats[d].receive);
    const systemData = dates.map(d => dailyStats[d].system);
    const errorData = dates.map(d => dailyStats[d].error);
    
    return { dates, sendData, receiveData, systemData, errorData };
}

function drawChart(chartData, type) {
    const canvas = document.getElementById('events-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(ctx, {
        type: type === 'bar' ? 'bar' : 'line',
        data: {
            labels: chartData.dates,
            datasets: [
                {
                    label: 'Отправленные',
                    data: chartData.sendData,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: '#4caf50',
                    borderWidth: 1
                },
                {
                    label: 'Полученные',
                    data: chartData.receiveData,
                    backgroundColor: 'rgba(33, 150, 243, 0.7)',
                    borderColor: '#2196f3',
                    borderWidth: 1
                },
                {
                    label: 'Системные',
                    data: chartData.systemData,
                    backgroundColor: 'rgba(255, 152, 0, 0.7)',
                    borderColor: '#ff9800',
                    borderWidth: 1
                },
                {
                    label: 'Ошибки',
                    data: chartData.errorData,
                    backgroundColor: 'rgba(244, 67, 54, 0.7)',
                    borderColor: '#f44336',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top', labels: { color: '#fff' } },
                title: { display: true, text: 'Статистика событий по дням', color: '#fff' }
            },
            scales: {
                x: { ticks: { color: '#ccc' }, grid: { color: '#444' } },
                y: { ticks: { color: '#ccc', stepSize: 1 }, grid: { color: '#444' } }
            }
        }
    });
}

// Настройка модального окна графика
function setupChartModal() {
    const closeBtn = document.querySelector('.modal-chart-close');
    const modal = document.getElementById('modal-chart');
    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target === modal) modal.style.display = 'none';
        };
    }
}

// Функция открытия просмотрщика логов
async function openLogsViewer() {
    openForm('form-logs-viewer');
    await loadLogsData();
    renderTable();
    updateCommandDatalist();
}

// Утилита для экранирования HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initLogsViewer();
    setupModals();
    setupChartModal();
    document.getElementById('logs-table-body')?.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-details');
    if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
            showDetails(parseInt(id));
        }
        return false;
    }
});
});
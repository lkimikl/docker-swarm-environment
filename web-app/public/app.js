let refreshInterval;
let cacheHits = 0;
let dbRequests = 0;

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('current-time').textContent = timeString;
}

async function checkServiceStatus() {
    const services = [
        { id: 'web-app', endpoint: '/health', name: 'Веб-приложение' },
        { id: 'db', endpoint: '/db', name: 'PostgreSQL' },
        { id: 'redis', endpoint: '/cache', name: 'Redis' },
        { id: 'nginx', endpoint: '/health', name: 'Nginx' }
    ];

    for (const service of services) {
        try {
            const response = await fetch(service.endpoint);
            const card = document.getElementById(`${service.id}-card`);
            
            if (!card) continue;
            
            const indicator = card.querySelector('.status-indicator');
            const statusText = card.querySelector('.status-text');
            
            if (response.ok) {
                indicator.className = 'status-indicator online';
                statusText.textContent = '✓ Работает';
                
                if (service.endpoint === '/db') dbRequests++;
                if (service.endpoint === '/cache') cacheHits++;
                
                updateStats();
            } else {
                indicator.className = 'status-indicator offline';
                statusText.textContent = '✗ Ошибка';
            }
        } catch (error) {
            const card = document.getElementById(`${service.id}-card`);
            if (!card) continue;
            
            const indicator = card.querySelector('.status-indicator');
            const statusText = card.querySelector('.status-text');
            
            indicator.className = 'status-indicator offline';
            statusText.textContent = '✗ Нет связи';
        }
    }
}

async function testEndpoint(type) {
    const endpoints = {
        web: '/health',
        nginx: '/health',
        db: '/db',
        redis: '/cache'
    };
    
    const button = event.target.closest('.btn-test');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Тестирование...';
    button.disabled = true;
    
    try {
        const response = await fetch(endpoints[type]);
        const data = await response.json();
        
        if (type === 'db' && data.error) {
            alert(`❌ БАЗА ДАННЫХ НЕ РАБОТАЕТ!\n\nОшибка: ${data.error}\n\nБаза данных PostgreSQL не запущена.`);
        } else {
            alert(`✅ ${type.toUpperCase()} работает!\n\nОтвет: ${JSON.stringify(data, null, 2)}`);
        }
    } catch (error) {
        alert(`❌ ${type.toUpperCase()} недоступен!\n\nОшибка: ${error.message}`);
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

async function loadSystemInfo() {
    try {
        const response = await fetch('/info');
        const data = await response.json();
        
        document.getElementById('hostname').textContent = truncateText(data.hostname || 'swarm-node', 20);
        document.getElementById('hostname').title = data.hostname;
        
        const uptime = Math.floor(data.uptime || 0);
        document.getElementById('uptime').textContent = formatUptime(uptime);
        
        const startTime = new Date(Date.now() - (uptime * 1000));
        const timeString = startTime.toLocaleString('ru-RU');
        document.getElementById('start-time').textContent = truncateText(timeString, 25);
        document.getElementById('start-time').title = timeString;
    } catch (error) {
        console.error('Ошибка загрузки информации:', error);
    }
}

function updateStats() {
    document.getElementById('db-requests').textContent = dbRequests;
    document.getElementById('cache-hits').textContent = cacheHits;
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function truncateText(text, maxLength = 20) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function refreshAll() {
    checkServiceStatus();
    loadSystemInfo();
    updateStats();
}

function showSwarmNodes() {
    const info = `=== Docker Swarm Ноды ===\n\n` +
                `Для просмотра выполните в терминале:\n` +
                `docker node ls\n\n` +
                `Пример вывода:\n` +
                `ID                        HOSTNAME   STATUS  AVAILABILITY  MANAGER STATUS\n` +
                `abc123 *   manager1   Ready   Active        Leader\n` +
                `def456     worker1    Ready   Active\n\n` +
                `* - текущая нода`;
    
    document.getElementById('swarm-content').textContent = info;
    document.getElementById('swarm-modal').style.display = 'flex';
}

function showSwarmServices() {
    const info = `=== Docker Swarm Сервисы ===\n\n` +
                `Команды:\n` +
                `docker stack services test-env\n` +
                `docker service ls\n\n` +
                `Наш стек содержит 6 сервисов:\n` +
                `1. nginx (2 реплики)\n` +
                `2. web (3 реплики)\n` +
                `3. db (1 реплика)\n` +
                `4. cache (2 реплики)\n` +
                `5. prometheus (1 реплика)\n` +
                `6. grafana (1 реплика)\n\n` +
                `Всего: 10 реплик`;
    
    document.getElementById('swarm-content').textContent = info;
    document.getElementById('swarm-modal').style.display = 'flex';
}

function showSwarmTasks() {
    const info = `=== Docker Swarm Задачи ===\n\n` +
                `Команда:\n` +
                `docker stack ps test-env\n\n` +
                `Каждая реплика сервиса - это задача (task)\n` +
                `Swarm автоматически распределяет задачи по нодам\n` +
                `и перезапускает их при сбоях.`;
    
    document.getElementById('swarm-content').textContent = info;
    document.getElementById('swarm-modal').style.display = 'flex';
}

function closeSwarmModal() {
    document.getElementById('swarm-modal').style.display = 'none';
}

function scaleService() {
    const service = prompt('Какой сервис масштабировать? (web/nginx/cache):', 'web');
    const replicas = prompt('Сколько реплик?', '3');
    
    if (service && replicas) {
        alert(`Команда для масштабирования:\n\ndocker service scale test-env_${service}=${replicas}\n\nВыполните в терминале.`);
    }
}

function showSwarmCommands() {
    const commands = `=== Основные команды Docker Swarm ===\n\n` +
                    `# Инициализация Swarm\n` +
                    `docker swarm init\n\n` +
                    `# Деплой стека\n` +
                    `docker stack deploy -c docker-stack.yml test-env\n\n` +
                    `# Просмотр сервисов\n` +
                    `docker stack services test-env\n\n` +
                    `# Просмотр задач\n` +
                    `docker stack ps test-env\n\n` +
                    `# Масштабирование\n` +
                    `docker service scale test-env_web=5\n\n` +
                    `# Логи\n` +
                    `docker service logs test-env_web\n\n` +
                    `# Удаление стека\n` +
                    `docker stack rm test-env`;
    
    document.getElementById('swarm-content').textContent = commands;
    document.getElementById('swarm-modal').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    setInterval(updateTime, 1000);
    
    checkServiceStatus();
    loadSystemInfo();
    
    refreshInterval = setInterval(checkServiceStatus, 30000);
    
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('swarm-modal');
        if (event.target === modal) {
            closeSwarmModal();
        }
    });
});

document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', e => e.preventDefault());
});
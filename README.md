# Docker Swarm Тестовая Среда

Полнофункциональная тестовая среда для веб-приложений на Docker Swarm с красивым Dashboard.

## Архитектура
- **Nginx** - веб-сервер и прокси
- **Web App** - Node.js приложение с Dashboard
- **PostgreSQL** - база данных
- **Redis** - кэш-сервер
- **Prometheus** + **Grafana** - система мониторинга

## Быстрый запуск

### 1. Подготовка проекта
```powershell
# Перейти в папку проекта
cd C:\docker-swarm-environment

# Собрать образ веб-приложения
docker build -t test-environment-web:latest .

# Инициализировать Swarm кластер
docker swarm init

# Проверить статус
docker node ls
# Должно показать: текущая нода как MANAGER

# Создать конфигурации для сервисов
docker config create nginx_config ./nginx/nginx.conf
docker config create prometheus_config ./prometheus/prometheus.yml

# Проверить созданные конфиги
docker config ls

# Развернуть всю среду
docker stack deploy -c docker-stack.yml test-env

# Проверить запущенные сервисы
docker stack services test-env

# Подождать 30 секунд для полного запуска
Start-Sleep -Seconds 30

# Показать статус всех задач
docker stack ps test-env

# Показать логи веб-приложения
docker service logs test-env_web
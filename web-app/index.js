const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const path = require('path');

const app = express();
const port = 3000;

const dbPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'testdb',
    password: process.env.DB_PASSWORD || 'password123',
    port: 5432,
});

const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'cache'}:6379`
});

let requestCount = {
    db: 0,
    cache: 0,
    total: 0
};

(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Redis подключен');
    } catch (err) {
        console.error('❌ Ошибка Redis:', err.message);
    }
})();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    requestCount.total++;
    res.json({
        status: 'OK',
        service: 'test-environment',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        hostname: process.env.HOSTNAME || require('os').hostname(),
        node: process.env.HOSTNAME || 'swarm-node'
    });
});

app.get('/api/db', async (req, res) => {
    requestCount.db++;
    requestCount.total++;
    
    try {
        const result = await dbPool.query('SELECT NOW() as time, version() as version');
        res.json({
            success: true,
            database: 'PostgreSQL',
            connection: 'active',
            time: result.rows[0].time,
            version: result.rows[0].version,
            hostname: process.env.HOSTNAME,
            requestCount: requestCount.db
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            connection: 'failed'
        });
    }
});

app.get('/api/cache', async (req, res) => {
    requestCount.cache++;
    requestCount.total++;
    
    try {
        const visits = await redisClient.incr('visits');
        res.json({
            success: true,
            service: 'Redis',
            visits: visits,
            hostname: process.env.HOSTNAME,
            requestCount: requestCount.cache
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            connection: 'failed'
        });
    }
});

app.get('/api/info', (req, res) => {
    requestCount.total++;
    res.json({
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'production',
        hostname: process.env.HOSTNAME || require('os').hostname(),
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        requestCounts: requestCount
    });
});

app.get('/api/stats', (req, res) => {
    res.json({
        totalRequests: requestCount.total,
        dbRequests: requestCount.db,
        cacheRequests: requestCount.cache,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    requestCount.total++;
    res.json({
        status: 'OK',
        service: 'web-app',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/db', async (req, res) => {
    requestCount.db++;
    requestCount.total++;
    
    try {
        const result = await dbPool.query('SELECT NOW() as time');
        res.json({
            database: 'PostgreSQL',
            time: result.rows[0].time,
            hostname: process.env.HOSTNAME
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/cache', async (req, res) => {
    requestCount.cache++;
    requestCount.total++;
    
    try {
        const visits = await redisClient.incr('visits');
        res.json({
            message: 'Redis работает!',
            visits: visits,
            hostname: process.env.HOSTNAME
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/info', (req, res) => {
    requestCount.total++;
    res.json({
        service: 'web-app',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'production',
        hostname: process.env.HOSTNAME,
        memory: process.memoryUsage()
    });
});

app.get('/', (req, res) => {
    requestCount.total++;
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.json({
            message: 'Docker Swarm Test Environment',
            endpoints: [
                '/api/health',
                '/api/db',
                '/api/cache',
                '/api/info',
                '/api/stats'
            ]
        });
    }
});

app.listen(port, () => {
    console.log("=".repeat(60));
    console.log("🚀 DOCKER SWARM ТЕСТОВАЯ СРЕДА ЗАПУЩЕНА!");
    console.log("=".repeat(60));
    console.log(`📊 Dashboard: http://localhost`);
    console.log(`🔧 API Health: http://localhost/api/health`);
    console.log(`🗄️  База данных: http://localhost/api/db`);
    console.log(`⚡ Кэш Redis: http://localhost/api/cache`);
    console.log(`📈 Prometheus: http://localhost:9090`);
    console.log(`📊 Grafana: http://localhost:3001 (admin/admin)`);
    console.log("=".repeat(60));
    console.log(`Порт: ${port} | Окружение: ${process.env.NODE_ENV}`);
    console.log(`Хостнейм: ${process.env.HOSTNAME || 'swarm-service'}`);
    console.log("=".repeat(60));
});
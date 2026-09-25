importScripts('./contract.js');

/** Как часто (мс) slowFunction отдаёт управление event loop */
const YIELD_INTERVAL = 50;

const pause = () => new Promise(resolve => setTimeout(resolve));

// Считает порциями и между ними отдаёт управление, чтобы не блокировать поток SW целиком
const slowFunction = async (timeout = 3000) => {
    const start = performance.now();
    let chunkStart = start;
    let x = 0;
    let i = 0;
    do {
        i += 1;
        x += (Math.random() - 0.5) * i;
        if (performance.now() - chunkStart >= YIELD_INTERVAL) {
            await pause();
            chunkStart = performance.now();
        }
    } while (performance.now() - start < timeout);
    return i;
}

const readResult = async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(RESULT_URL);
    return response ? response.json() : null;
}

const writeResult = async (value) => {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(RESULT_URL, new Response(JSON.stringify(value), {
        headers: { 'Content-Type': 'application/json' }
    }));
}

const recalculate = async (timeout) => {
    const value = await slowFunction(timeout);
    await writeResult(value);
    return { value, fromCache: false };
}

const handlers = {
    [Commands.START]: async ({ timeout }) => {
        const cachedValue = await readResult();
        if (cachedValue !== null) {
            return { value: cachedValue, fromCache: true };
        }
        return recalculate(timeout);
    },
    [Commands.RECALCULATE]: ({ timeout }) => recalculate(timeout)
};

const handleCommand = async ({ name, data }) => {
    const handler = handlers[name];
    if (!handler) {
        throw new Error(`Неизвестная команда: ${name}`);
    }
    return handler(data ?? {});
}

self.addEventListener('message', event => {
    const client = event.source;
    // waitUntil не даёт браузеру остановить SW, пока идёт расчёт
    event.waitUntil(
        handleCommand(event.data)
            .then(data => client.postMessage({ name: Responses.RESULT, data }))
            .catch(error => client.postMessage({ name: Responses.ERROR, data: { message: error.message } }))
    );
});

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', evt => {
    evt.waitUntil(self.clients.claim());
});

const cache = {
    result: null
};

const slowFunction = (timeout = 3000) => {
    let start = performance.now();
    let x = 0;
    let i = 0;
    do {
        i += 1;
        x += (Math.random() - 0.5) * i;
    } while (performance.now() - start < timeout);
    return i;
}

const recalculate = (timeout) => {
    cache.result = slowFunction(timeout);
    return cache.result;
}

const getCachedResult = (timeout) => {
    const cachedResult = cache.result;
    if (cachedResult) {
        return cachedResult;
    } else {
        return recalculate(timeout);
    }
}

const clean = () => {
    console.log('clean cache');
    cache.result = null;
    return null;
}

const broadcast = async (msg) => {
    const clients = await self.clients.matchAll();
    for (const client of clients) {
        client.postMessage(msg);
    }
}

self.addEventListener('message', evt => {
    console.log('message', evt);
    const data = evt.data;
    if (data.name === 'start') {
        const result = getCachedResult(data.data.timeout);
        broadcast({
            name: 'result',
            data: result
        });
    }

    if (data.name === 'recalculate') {
        const result = recalculate(data.data.timeout);
        broadcast({
            name: 'result',
            data: result
        });
    }

    if (data.name === 'unregister') {
        const result = clean();
        broadcast({
            name: 'result',
            data: result
        });
    }
});

self.addEventListener('activate', async (evt) => {
    console.log('activate', evt);
    evt.waitUntil(self.clients.claim());
});

let timeSeededSketch = function (p) {
    let mapWidth = 40;
    let mapHeight;
    let tileWidth;
    let offsetX = 0.0;
    // let noiseStep = 0.015;
    let noiseStep = 0.01;
    let initialTime;
    let initialTimeUTCMs;
    let seed;
    let timerId;
    let initialized = false;
    let offsetFromServerTimeMs = 0;
    let syncedTime;

    const recalcMapSize = () => {
        tileWidth = p.width / mapWidth;
        mapHeight = Math.floor(p.height / tileWidth);
    };

    const calcCanvasSize = () => {
        const tvImage = document.getElementById('tv-image');
        const canvasWidth = Math.floor(tvImage.clientWidth * 0.72);
        const canvasHeight = Math.floor(tvImage.clientHeight * 0.33);

        return { width: canvasWidth, height: canvasHeight };
    };

    const loadUTCTimeBasedSeed = async () => {
        let useServerTime = true;
        let response;
        if (useServerTime) {
            response = await fetch('http://worldtimeapi.org/api/timezone/UTC');
        } else {
            // Fallback to the client's time instead of server's in case of an error.
            return { datetime: new Date().getTime() };
        }

        if (!response.ok) {
            // const message = `Error: ${response.status}`;
            // throw new Error(message);

            // Fallback to the client's time instead of server's in case of an error.
            return { datetime: new Date().getTime() };
        }

        const data = await response.json();

        return data;
    };

    // p.mousePressed = function mousePressed() {
    //     p.remove(); // remove whole sketch on mouse press
    // }

    p.setup = function () {
        const canvasSize = calcCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
        p.background("#750909");
        //p.frameRate(1);
        p.noiseSeed(100);
        recalcMapSize();

        const requestStartTime = new Date();
        loadUTCTimeBasedSeed()
            .then((data) => {
                const requestEndTime = new Date();
                const requestDurationMs = requestEndTime - requestStartTime;
                // Calculate client time offset to server time.
                // Always add that offset to compensate.
                const nowServer = new Date(new Date(data.datetime).getTime() + requestDurationMs / 2);
                const nowClient = new Date();

                offsetFromServerTimeMs = nowClient.getTime() - nowServer.getTime();

                initialized = true;
                if (timerId) {
                    clearInterval(timerId);
                }

                const syncedTimestamp = nowClient.getTime() + offsetFromServerTimeMs;
                syncedTime = new Date(syncedTimestamp);

                offsetX = (syncedTimestamp) / 10000;

                timerId = setInterval(() => {
                    const syncedTimestamp = new Date().getTime() + offsetFromServerTimeMs;
                    syncedTime = new Date(syncedTimestamp);
                    offsetX = syncedTimestamp / 10000;
                }, 50);
            })
            .catch(err => {
                console.log(`Got an error fetching time: ${err}`);
            });
    }

    p.draw = function () {
        if (!initialized) {
            return;
        }

        p.background("#750909");

        let noiseOffset = offsetX;
        for (let col = 0; col < mapWidth; col++) {
            const x = col * tileWidth;
            const worldY = p.noise(noiseOffset);
            const y = Math.floor(worldY * tileWidth * mapHeight);
            p.fill('#C2B280');
            p.rect(x, y, tileWidth);

            let worldX = Math.floor(noiseOffset * 100);
            let seed = worldX;

            let charsToConsider = 200; // More chars -> better the mix.
            const noiseSeed = xmur3(seed + String.fromCharCode(worldX % charsToConsider))();
            const randomFn = mb32(noiseSeed);
            const randomInt = (min, max) => ~~((randomFn() * (max - min)) + min);
            const hasCactus = randomInt(0, 20) === 1;
            if (hasCactus) {
                p.fill('green');
                const cactusHeight = randomInt(1, 6);

                for (let h = 1; h < cactusHeight; h++) {
                    p.rect(x, y - tileWidth * h, tileWidth);
                }

                const hasTop = randomInt(0, 5);
                if (hasTop === 1) {
                    p.rect(x, y - tileWidth * cactusHeight, tileWidth);
                    p.rect(x - tileWidth, y - tileWidth * cactusHeight, tileWidth);
                    p.rect(x + tileWidth, y - tileWidth * cactusHeight, tileWidth);

                    p.fill('pink');
                    p.rect(x, y - tileWidth * (cactusHeight + 1), tileWidth);
                }
            }

            noiseOffset += noiseStep;
        }

        // p.fill('white');
        // p.textSize(10);
        // p.text(`OffsetX:${offsetX}`, 5, 15);

        p.textStyle(p.BOLD);
        if (p.second() % 2 == 0) {
            p.fill('white');
        } else {
            p.fill('red');
        }
        p.textSize(12);
        p.text(`LIVE`, p.width - 35, 15);

        p.fill('white');
        p.textSize(12);
        p.textStyle(p.NORMAL);

        const t = syncedTime;
        const syncedTimeText = `${t.getUTCHours()}:${t.getUTCMinutes()}:${t.getUTCSeconds()}:${t.getUTCMilliseconds()}`;
        p.text(syncedTimeText, 10, 15);
    };

    p.windowResized = () => {
        const canvasSize = calcCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();
    };
};
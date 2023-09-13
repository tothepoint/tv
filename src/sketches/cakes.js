const getClientTimeOffsetFromServer = (clientTimestamp, serverTimestamp) => {
    const offsetFromServerTimeMs = serverTimestamp - clientTimestamp;

    return offsetFromServerTimeMs;
};

const loadUTCTimeBasedSeed = async () => {
    let useServerTime = true;
    let response;
    if (useServerTime) {
        // Do a call to "prime" the communication.
        response = await fetch('http://worldtimeapi.org/api/timezone/UTC');

        response = await fetch('http://worldtimeapi.org/api/timezone/UTC');
    } else {
        // Fallback to the client's time instead of server's in case of an error.
        return { datetime: new Date().getTime() };
    }

    if (!response.ok) {
        timeSyncError = true;
        console.log('Time sync error, server response:', response);
        // const message = `Error: ${response.status}`;
        // throw new Error(message);

        // Fallback to the client's time instead of server's in case of an error.
        return { datetime: new Date().getTime() };
    }

    const data = await response.json();

    return data;
};

const loadAndCalculateTimeOffsetFromServerMs = (p) => {
    const promise = new Promise((resolve, reject) => {

        // p.noiseSeed(100);
        //recalcMapSize();

        const requestStartTime = new Date();
        loadUTCTimeBasedSeed()
            .then((data) => {
                const requestEndTime = new Date();
                const requestDurationMs = requestEndTime - requestStartTime;
                // Calculate client time offset to server time.
                // Always add that offset to compensate.
                const nowServer = new Date(new Date(data.datetime).getTime());
                const nowClient = new Date();

                const nowClientTimestamp = nowClient.getTime();
                const nowServerTimestamp = nowServer.getTime();
                offsetFromServerTimeMs = getClientTimeOffsetFromServer(nowClientTimestamp, nowServerTimestamp);

                resolve(offsetFromServerTimeMs);

                // initialized = true;
                // if (timerId) {
                //     clearInterval(timerId);
                // }

                // const syncedTimestamp = nowClient.getTime() + offsetFromServerTimeMs;
                // syncedTime = new Date(syncedTimestamp);
                // const TIME_TO_OFFSET_FACTOR = 0.0001;

                // offsetX = (syncedTimestamp) * TIME_TO_OFFSET_FACTOR;

                // const rawServerTime = data.datetime || data.dateTime;
                // const rawServerTimeDate = new Date(rawServerTime);

                // if (freezeAfterFirstFrame) {
                //     // DEBUG PURPOSES.
                //     const debugInfo = {
                //         requestStartTime,
                //         requestEndTime,
                //         requestDurationMs,
                //         offsetFromServerTimeMs,
                //         nowServer,
                //         nowClient,
                //         offsetX,
                //         syncedTime,
                //         rawServerTime,
                //         rawServerTimeDate
                //     };
                //     const debugDiv = document.createElement('div');
                //     debugDiv.style.position = 'absolute';
                //     debugDiv.style.top = 0;
                //     debugDiv.style.left = 0;
                //     debugDiv.innerText = JSON.stringify(debugInfo).split(',').join(',\n').replace('{', '').replace('}', '');
                //     document.body.appendChild(debugDiv);
                // }

                // timerId = setInterval(() => {
                //     const syncedTimestamp = new Date().getTime() + offsetFromServerTimeMs;
                //     syncedTime = new Date(syncedTimestamp);
                //     offsetX = syncedTimestamp * TIME_TO_OFFSET_FACTOR;
                // }, 50);
            })
            .catch(err => {
                console.log(`Got an error fetching time: ${err}`);
            });

    });

    return promise;
};

let cakesSketch = function (p) {
    let mapWidth = 64;
    let mapHeight;
    let tileWidth;
    let offsetX = 0.0;
    // let noiseStep = 0.015;
    let noiseStep = 0.005;
    let initialTime;
    let initialTimeUTCMs;
    let seed;
    let timerId;
    let initialized = false;
    let offsetFromServerTimeMs = 0;
    let syncedTime;
    let freezeAfterFirstFrame = false;
    let firstFrameDrawn = false;
    let timeSyncError = false;
    let drawNext = true;

    const recalcMapSize = () => {
        tileWidth = p.width / mapWidth;
        mapHeight = Math.floor(p.height / tileWidth);
    };

    p.setup = function () {
        const canvasSize = calcTvCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
        p.background("#750909");
        p.frameRate(12);
        p.noiseSeed(100);
        recalcMapSize();

        loadAndCalculateTimeOffsetFromServerMs().then(offsetFromServerTimeMs => {
            const nowClient = new Date();
            const syncedTimestamp = nowClient.getTime() + offsetFromServerTimeMs;
            syncedTime = new Date(syncedTimestamp);
            const TIME_TO_OFFSET_FACTOR = 0.0001;
            const CAKE_SHOWN_DURATION_MS = 5000;

            offsetX = (syncedTimestamp);// * TIME_TO_OFFSET_FACTOR;
            offsetX = offsetX - offsetX % CAKE_SHOWN_DURATION_MS;

            if (timerId) {
                clearInterval(timerId);
            }

            timerId = setInterval(() => {
                const syncedTimestamp = new Date().getTime() + offsetFromServerTimeMs;
                syncedTime = new Date(syncedTimestamp);
                offsetX = syncedTimestamp; // * TIME_TO_OFFSET_FACTOR;
                offsetX = offsetX - offsetX % CAKE_SHOWN_DURATION_MS;
            }, 50);

            initialized = true;

            setInterval(() => {
                drawNext = true;
            }, 5000);
        });
    }

    p.draw = function () {
        if (!initialized) {
            return;
        }

        // if (!drawNext) {
        //     return;
        // }

        p.background("black");

        // Draw a cake.

        let noiseOffset = offsetX;
        let worldX = Math.floor(noiseOffset * 100);
        let seed = worldX;
        // console.log('seed', seed);

        let charsToConsider = 200; // More chars -> better the mix.
        const noiseSeed = xmur3(seed + String.fromCharCode(worldX % charsToConsider))();
        const randomFn = mb32(noiseSeed);
        const randomInt = (min, max) => ~~((randomFn() * (max - min)) + min);

        const cakeHeight = Math.floor(p.height * 0.5);
        const cakeMaxWidth = Math.floor(p.width * 0.7);

        const layerCount = randomInt(1, 10);
        let cakeHeightLeft = cakeHeight;

        p.noStroke();

        let layerOffset = Math.floor((p.height - cakeHeight) / 2) + cakeHeight;
        let firstLayerTopY;
        const layerTopCenterX = Math.floor(p.width / 2);
        const layerBottomCenterX = layerTopCenterX;
        const layerTopHeight = Math.floor(p.height * 0.2);
        const layerBottomHeight = layerTopHeight;
        const layerMinWidth = Math.floor(p.width / 2) * 0.1;
        let layerPrevWidth = randomInt(cakeMaxWidth / 1.5, cakeMaxWidth);
        let topLayerWidth = 0;

        const randomColor = () => {
            const r = randomInt(0, 255 + 1);
            const g = randomInt(0, 255 + 1);
            const b = randomInt(0, 255 + 1);
            const color = p.color(r, g, b);

            return color;
        };

        for (let layerIdx = 0; layerIdx < layerCount; layerIdx++) {
            const layerWidthStrategy = randomInt(0, 3);
            const layerHeight = randomInt(0, cakeHeightLeft);
            let layerWidth = 0;
            switch (layerWidthStrategy) {
                case 0:
                    // layerWidth = randomInt(layerMinWidth, cakeMaxWidth); // Random layer width.
                    layerWidth = randomInt(layerMinWidth, layerPrevWidth); // Widest to lowest ordered random layer width.
                    break;
                case 1:
                    layerWidth = randomInt(layerMinWidth, layerPrevWidth); // Widest to lowest ordered random layer width.
                    break;
                case 2:
                    layerWidth = cakeMaxWidth; // Even layer width.
                    break;
            }
            const layerTopBottomHeight = layerTopHeight * (layerWidth / cakeMaxWidth);

            const layerColor = randomColor();
            const layerTopColor = randomColor();
            const layerTopY = layerOffset - layerHeight;

            const topLayer = layerIdx === layerCount - 1;
            if (topLayer) {
                firstLayerTopY = layerTopY;
                topLayerWidth = layerWidth;
            }

            // Cake layer's bottom part.
            p.fill(layerColor);
            p.ellipse(layerBottomCenterX, layerOffset, layerWidth, layerTopBottomHeight);

            // Cake layer's middle part.
            p.fill(layerColor);
            p.rect(Math.floor(layerTopCenterX - layerWidth / 2), layerOffset - layerHeight, layerWidth, layerHeight);

            // Cake layer's top part.
            p.fill(layerTopColor);
            p.ellipse(layerTopCenterX, layerTopY, layerWidth, layerTopBottomHeight);

            cakeHeightLeft -= layerHeight;
            layerOffset -= layerHeight;
            layerPrevWidth = layerWidth;
        }

        const berryAreaMaxWidth = topLayerWidth;
        const berryWidthScale = topLayerWidth / cakeMaxWidth;
        const allBerriesSameColor = randomInt(0, 2) === 0;
        let berryColor = randomColor();
        for (let i = 0; i < 10; i++) {
            const berryRadius = randomInt(Math.floor(cakeMaxWidth / 20 * berryWidthScale), Math.floor(cakeMaxWidth / 40 * berryWidthScale));
            let berryX = randomInt(layerTopCenterX - berryAreaMaxWidth / 2, layerTopCenterX + berryAreaMaxWidth / 2);
            // let berryY = -30 + firstLayerTopY + randomInt(-layerTopHeight / 2 + berryRadius, layerTopHeight / 2 - berryRadius);
            let berryY = -30 + firstLayerTopY + randomInt(-layerTopHeight / 2 + berryRadius, layerTopHeight / 2 - berryRadius);
            //p.fill('red');
            if (!allBerriesSameColor) {
                berryColor = randomColor();
            }

            p.fill(berryColor);
            p.ellipse(berryX, berryY, berryRadius, berryRadius);
        }

        drawNext = false;
    };

    p.windowResized = () => {
        const canvasSize = calcTvCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();
    };
};
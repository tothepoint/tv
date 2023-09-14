let timeSeededSketch = function (p) {
    let mapWidth = 64;
    let mapHeight;
    let tileWidth;
    let offsetX = 0.0;
    // let noiseStep = 0.015;
    let noiseStep = 0.005;
    let timerId;
    let initialized = false;
    let offsetFromServerTimeMs = 0;
    let syncedTime;
    let freezeAfterFirstFrame = false;
    let firstFrameDrawn = false;
    let timeSyncError = false;

    const recalcMapSize = () => {
        tileWidth = Math.ceil(p.width / mapWidth);
        mapHeight = Math.ceil(p.height / tileWidth);
    };

    // p.mousePressed = function mousePressed() {
    //     p.remove(); // remove whole sketch on mouse press
    // }

    p.setup = function () {
        const urlParams = new URLSearchParams(window.location.search);
        const freeze = urlParams.get('freeze');
        if (freeze === 'true') {
            freezeAfterFirstFrame = true;
        }

        const canvasSize = calcTvCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
        p.background("#750909");
        //p.frameRate(30);
        p.noiseSeed(100);
        recalcMapSize();

        loadAndCalculateTimeOffsetFromServerMs()
            .then((offsetFromServerTimeMsResult) => {
                // Calculate client time offset to server time.
                // Always add that offset to compensate.
                const nowClient = new Date();

                offsetFromServerTimeMs = offsetFromServerTimeMsResult;

                initialized = true;
                if (timerId) {
                    clearInterval(timerId);
                }

                const syncedTimestamp = nowClient.getTime() + offsetFromServerTimeMs;
                syncedTime = new Date(syncedTimestamp);
                const TIME_TO_OFFSET_FACTOR = 0.0001;

                offsetX = (syncedTimestamp) * TIME_TO_OFFSET_FACTOR;

                timerId = setInterval(() => {
                    const syncedTimestamp = new Date().getTime() + offsetFromServerTimeMs;
                    syncedTime = new Date(syncedTimestamp);
                    offsetX = syncedTimestamp * TIME_TO_OFFSET_FACTOR;
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

        if (freezeAfterFirstFrame && firstFrameDrawn) {
            return;
        }

        // p.background("#750909");
        const skyBlue = '#89b8e4';
        p.background(skyBlue);

        let noiseOffset = offsetX;
        let worldX = Math.floor(noiseOffset * 100);
        for (let col = 0; col < mapWidth; col++) {
            const x = Math.floor(col * tileWidth);
            const worldY = p.noise(noiseOffset);
            const y = Math.floor(worldY * tileWidth * mapHeight);
            p.noStroke();
            p.fill('#C2B280');
            p.rect(x, y, tileWidth);

            p.fill('#C2B280');
            p.rect(x, y + tileWidth, tileWidth, p.height - y);

            // let worldX = Math.floor(noiseOffset * 100);
            // let worldX = Math.floor(noiseOffset * 100);
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

            worldX += 1;
            noiseOffset += noiseStep;
        }

        // p.fill('white');
        // p.textSize(10);
        // p.text(`OffsetX:${offsetX}`, 5, 15);

        p.textStyle(p.BOLD);
        if (p.second() % 2 == 0) {
            p.fill('black');
        } else {
            p.fill('red');
        }
        p.textSize(18);
        p.text(`LIVE`, p.width - tileWidth * 16, tileWidth * 6);

        p.fill('black');
        p.textSize(18);
        p.textStyle(p.NORMAL);

        const t = syncedTime;
        const syncedTimeText = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}:${t.getMilliseconds().toString().padStart(2, '0')}`;
        p.text(syncedTimeText, tileWidth * 8, tileWidth * 6);

        if (timeSyncError) {
            p.fill('black');
            p.textSize(18);
            p.textStyle(p.NORMAL);
            p.text('E', tileWidth * 6, tileWidth * 6);
        }

        firstFrameDrawn = true;
    };

    p.windowResized = () => {
        const canvasSize = calcTvCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();
    };
};
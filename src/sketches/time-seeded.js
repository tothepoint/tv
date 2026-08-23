import { calcTvCanvasSize } from '../tv-utils.js';
import { xmur3, mb32 } from '../random-utils.js';
import { loadAndCalculateTimeOffsetFromServerMs } from '../time-sync-utils.js';

export const timeSeededSketch = function (p) {
    let mapWidth = 64;
    let mapHeight;
    let tileWidth;
    let offsetX = 0.0;
    // one noise step per column
    let noiseStep = 0.005;
    let timerId;
    let initialized = false;
    let offsetFromServerTimeMs = 0;
    let syncedTime;
    let freezeAfterFirstFrame = false;
    let firstFrameDrawn = false;
    let timeSyncError = false;

    // Model (precalculated columns)
    let columns = []; // array of column objects for consecutive steps
    let modelStartStep = 0; // integer step index corresponding to columns[0]
    let bufferMultiplier = 3; // keep 3 * mapWidth steps precalculated (2 extra screen widths)

    const recalcMapSize = () => {
        tileWidth = Math.ceil(p.width / mapWidth);
        mapHeight = Math.ceil(p.height / tileWidth);
    };

    const computeColumnForStep = (step) => {
        // noiseOffset is step * noiseStep
        const noiseOffset = step * noiseStep;
        const worldY = p.noise(noiseOffset);
        const y = Math.floor(worldY * tileWidth * mapHeight);

        // derive the deterministic seed from noiseOffset similar to previous logic
        const worldX = Math.floor(noiseOffset * 100);
        let charsToConsider = 200; // More chars -> better the mix.
        const noiseSeed = xmur3(worldX + String.fromCharCode(worldX % charsToConsider))();
        const randomFn = mb32(noiseSeed);
        const randomInt = (min, max) => ~~((randomFn() * (max - min)) + min);
        const hasCactus = randomInt(0, 20) === 1;
        let cactus = null;
        if (hasCactus) {
            const cactusHeight = randomInt(1, 6);
            const hasTop = randomInt(0, 5) === 1;
            cactus = { height: cactusHeight, hasTop };
        }

        return { y, cactus };
    };

    const ensureModelCoverage = (startStep) => {
        // rebuild model to be the desired window starting at startStep
        const desiredLen = mapWidth * bufferMultiplier;
        const newCols = new Array(desiredLen);
        for (let i = 0; i < desiredLen; i++) {
            newCols[i] = computeColumnForStep(startStep + i);
        }
        columns = newCols;
        modelStartStep = startStep;
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
        p.background('#750909');
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

                // initialize model around current offset
                const startStep = Math.floor(offsetX / noiseStep);
                ensureModelCoverage(startStep);

                timerId = setInterval(() => {
                    const syncedTimestamp = new Date().getTime() + offsetFromServerTimeMs;
                    syncedTime = new Date(syncedTimestamp);
                    offsetX = syncedTimestamp * TIME_TO_OFFSET_FACTOR;

                    // update model if needed (rebuild for simplicity)
                    const newStartStep = Math.floor(offsetX / noiseStep);
                    if (newStartStep !== modelStartStep) {
                        ensureModelCoverage(newStartStep);
                    }
                }, 50);
            })
            .catch(err => {
                console.log(`Got an error fetching time: ${err}`);
                timeSyncError = true;
            });
    };

    p.draw = function () {
        if (!initialized) return;
        if (freezeAfterFirstFrame && firstFrameDrawn) return;

        const skyBlue = '#89b8e4';
        p.background(skyBlue);

        // Determine start step and fractional offset for smooth scrolling
        const continuousStep = offsetX / noiseStep; // continuous step coordinate
        const startStep = Math.floor(continuousStep);
        const frac = continuousStep - startStep; // 0..1 fractional progress to next column

        // If model is out of sync (rare), rebuild quickly
        if (startStep !== modelStartStep) {
            ensureModelCoverage(startStep);
        }

        // number of columns to draw (cover screen + one extra for fractional shift)
        const colsOnScreen = mapWidth + 1;

        p.noStroke();
        for (let i = 0; i < colsOnScreen; i++) {
            const col = columns[i];
            if (!col) continue; // safety

            const x = Math.floor((i * tileWidth) - (frac * tileWidth));

            const y = col.y;
            p.fill('#C2B280');
            p.rect(x, y, tileWidth);
            p.fill('#C2B280');
            p.rect(x, y + tileWidth, tileWidth, p.height - y);

            if (col.cactus) {
                p.fill('green');
                for (let h = 1; h < col.cactus.height; h++) {
                    p.rect(x, y - tileWidth * h, tileWidth);
                }
                if (col.cactus.hasTop) {
                    p.rect(x, y - tileWidth * col.cactus.height, tileWidth);
                    p.rect(x - tileWidth, y - tileWidth * col.cactus.height, tileWidth);
                    p.rect(x + tileWidth, y - tileWidth * col.cactus.height, tileWidth);

                    p.fill('pink');
                    p.rect(x, y - tileWidth * (col.cactus.height + 1), tileWidth);
                }
            }
        }

        // HUD
        p.textStyle(p.BOLD);
        if (p.second() % 2 == 0) p.fill('black'); else p.fill('red');
        p.textSize(18);
        p.text('LIVE', p.width - tileWidth * 16, tileWidth * 6);

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

        // rebuild model because tileWidth/mapHeight changed
        const startStep = Math.floor(offsetX / noiseStep);
        ensureModelCoverage(startStep);
    };
};
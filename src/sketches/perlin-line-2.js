let perlinLine2Sketch = function (p) {
    let mapWidth = 40;
    let mapHeight;
    let tileWidth;
    let offsetX = 0.0;
    // let noiseStep = 0.015;
    let noiseStep = 1;

    const recalcMapSize = () => {
        tileWidth = p.width / mapWidth;
        mapHeight = Math.floor(p.height / tileWidth);
    };

    // p.mousePressed = function mousePressed() {
    //     p.remove(); // remove whole sketch on mouse press
    // }

    p.setup = function () {
        const canvasSize = calcTvCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
        p.background("#750909");
        //p.frameRate(1);
        recalcMapSize();
    }

    p.draw = function () {
        p.background("#750909");

        p.fill('yellow');

        let noiseOffset = offsetX;
        for (let col = 0; col < mapWidth; col++) {
            const x = col * tileWidth;
            // const worldY = Math.floor(p.noise(/*col + */noiseOffset / 50) * mapHeight);
            const worldY = p.noise(noiseOffset / 50);
            const y = Math.floor(worldY * tileWidth * mapHeight);
            p.rect(x, y, tileWidth);

            const worldX = /*col +*/ noiseOffset;
            // let seed = (worldX & 0xFFFFF) << 16 | (worldY & 0xFFFFF);
            let seed = (worldX & 0xFFFFF) << 16;
            let charsToConsider = 200; // More chars -> better the mix.
            const noiseSeed = xmur3(seed + String.fromCharCode(worldX % charsToConsider))();
            const randomFn = mb32(noiseSeed);
            const randomInt = (min, max) => ~~((randomFn() * (max - min)) + min);
            const hasCactus = randomInt(0, 20) === 1;
            if (hasCactus) {
                p.rect(x, y - tileWidth, tileWidth);
                p.rect(x, y - tileWidth * 2, tileWidth);
            }

            noiseOffset += noiseStep;
        }

        // offsetX += 0.003;
        offsetX += 1;
    };

    p.windowResized = () => {
        const canvasSize = calcTvCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();
    };
};
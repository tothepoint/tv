let perlinLine2Sketch = function (p) {
    let tileWidth = 8;
    let offsetX = 0.0;
    // let noiseStep = 0.015;
    let noiseStep = 1;


    const calcCanvasSize = () => {
        const tvImage = document.getElementById('tv-image');
        const canvasWidth = Math.floor(tvImage.clientWidth * 0.72);
        const canvasHeight = Math.floor(tvImage.clientHeight * 0.33);

        return { width: canvasWidth, height: canvasHeight };
    };

    // p.mousePressed = function mousePressed() {
    //     p.remove(); // remove whole sketch on mouse press
    // }

    p.setup = function () {
        const canvasSize = calcCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
        p.background("#750909");
        //p.frameRate(1);
    }

    p.draw = function () {
        p.background("#750909");

        const mapWidth = Math.floor(p.width / tileWidth);
        const mapHeight = Math.floor(p.height / tileWidth);

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
        const canvasSize = calcCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
    };
};
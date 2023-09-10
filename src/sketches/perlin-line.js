let perlinLineSketch = function (p) {
    let mapWidth = 40;
    let mapHeight;
    let tileWidth;
    let offsetX = 0.0;
    let noiseStep = 0.015;

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
        recalcMapSize();
    }

    p.draw = function () {
        p.background("#750909");

        let noiseOffset = offsetX;
        for (let col = 0; col < mapWidth; col++) {
            const x = col * tileWidth;
            const y = Math.floor(p.noise(noiseOffset) * mapHeight) * tileWidth;
            p.rect(x, y, tileWidth);
            noiseOffset += noiseStep;
        }

        offsetX += 0.003;
    };

    p.windowResized = () => {
        const canvasSize = calcTvCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();
    };
};
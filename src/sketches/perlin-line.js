let perlinLineSketch = function (p) {
    let tileWidth = 8;
    let offsetX = 0.0;
    let noiseStep = 0.015;


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
    }

    p.draw = function () {
        p.background("#750909");

        const mapWidth = Math.floor(p.width / tileWidth);
        const mapHeight = Math.floor(p.height / tileWidth);

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
        const canvasSize = calcCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
    };
};
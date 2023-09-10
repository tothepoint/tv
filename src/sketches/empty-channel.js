let emptyChannelSketch = function (p) {
    let mapWidth = 64;
    let mapHeight;
    let tileWidth;

    const recalcMapSize = () => {
        tileWidth = p.width / mapWidth;
        mapHeight = Math.floor(p.height / tileWidth);
    };

    p.setup = function () {
        const canvasSize = calcTvCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
        p.background("#750909");
        p.frameRate(12);
        recalcMapSize();
    }

    p.draw = function () {
        p.background("#750909");

        for (let col = 0; col < mapWidth; col++) {
            for (let row = 0; row < mapHeight; row++) {
                const x = col * tileWidth;
                const y = row * tileWidth;
                const tileOn = Math.random() > 0.5;
                if (tileOn) {
                    p.fill('white');
                    p.rect(x, y, tileWidth);
                }
            }
        }
    };

    p.windowResized = () => {
        const canvasSize = calcTvCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();
    };
};
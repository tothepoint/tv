let emptyChannelSketch = function (p) {
    let mapWidth = 40;
    let mapHeight;
    let tileWidth;

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

    p.setup = function () {
        const canvasSize = calcCanvasSize();
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
        const canvasSize = calcCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();
    };
};
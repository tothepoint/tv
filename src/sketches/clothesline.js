import { calcTvCanvasSize } from '../tv-utils.js';
import { xmur3, mb32 } from '../random-utils.js';
import { loadAndCalculateTimeOffsetFromServerMs } from '../time-sync-utils.js';

export const clotheslineSketch = function (p) {
    let initialized = false;
    let offsetFromServerTimeMs = 0;

    const SPEED_PX_PER_SEC = 20;
    const ITEM_SPACING_PX = 140;
    const LINE_SAG_PX = 15;
    const CLOTHES_OFFSET_Y = 4;

    const PALETTE = [
        '#FF595E',
        '#FFCA3A',
        '#8AC926',
        '#1982C4',
        '#6A4C93',
        '#FF9F1C',
        '#2EC4B6',
        '#E71D36',
        '#FF6B6B',
        '#4ECDC4',
        '#F7FFF7',
        '#1A535C',
        '#FFE66D',
        '#FF6B6B',
        '#4ECDC4',
        '#556270',
        '#C7F464',
        '#FF6B6B',
        '#C44D58',
        '#FFB400',
    ];

    const BACKGROUND_COLOR = '#89b8e4';
    const ROPE_COLOR = '#5C4033';
    const PEG_COLOR = '#3A2820';
    const HANGER_COLOR = '#E0E0E0';

    p.setup = function () {
        const canvasSize = calcTvCanvasSize();

        p.createCanvas(canvasSize.width, canvasSize.height);

        loadAndCalculateTimeOffsetFromServerMs()
            .then((offsetMs) => {
                offsetFromServerTimeMs = offsetMs;
                initialized = true;
            })
            .catch((err) => {
                console.error('Time sync failed:', err);
                initialized = true;
            });
    };

    p.draw = function () {
        if (!initialized) return;

        const nowMs = Date.now() + offsetFromServerTimeMs;
        const worldX = (nowMs / 1000) * SPEED_PX_PER_SEC;
        const lineY = p.height * 0.45;

        p.background(BACKGROUND_COLOR);

        drawClothesline(lineY);

        const minIndex = Math.floor(
            (worldX - ITEM_SPACING_PX) / ITEM_SPACING_PX
        );
        const maxIndex = Math.ceil(
            (worldX + p.width + ITEM_SPACING_PX) / ITEM_SPACING_PX
        );

        for (let itemIndex = minIndex; itemIndex <= maxIndex; itemIndex++) {
            renderClotheslineItem(itemIndex, worldX, lineY);
        }

        renderHUD(nowMs);
    };

    function drawClothesline(lineY) {
        p.push();
        p.stroke(ROPE_COLOR);
        p.strokeWeight(3);
        p.noFill();

        p.beginShape();

        for (let x = 0; x <= p.width; x += 4) {
            p.vertex(x, lineY + getLineSag(x));
        }

        p.endShape();
        p.pop();
    }

    function getLineSag(x) {
        if (p.width <= 0) return 0;

        return Math.sin((x / p.width) * p.PI) * LINE_SAG_PX;
    }

    function renderClotheslineItem(itemIndex, worldX, lineY) {
        const itemWorldX = itemIndex * ITEM_SPACING_PX;
        const screenX = itemWorldX - worldX;

        const rand = mb32(xmur3(`clothes_item_${itemIndex}`)());

        if (rand() <= 0.2) return;

        const colorIndex = Math.floor(rand() * PALETTE.length);
        const itemColor = PALETTE[colorIndex];
        const patternColor = PALETTE[getDifferentColorIndex(rand, colorIndex)];

        const itemType = Math.floor(rand() * 10) < 7 ? 'shirt' : 'pants';

        const itemY =
            lineY +
            getLineSag(screenX) +
            CLOTHES_OFFSET_Y;

        p.push();
        p.translate(screenX, itemY);

        drawPeg();
        drawHanger({ w: 30, h: 80 });

        if (itemType === 'shirt') {
            const radius = 18 + rand() * 14;
            const dimensions = {
                w: radius * 1.5,
                h: radius * 1.8,
            };
            const patternType = Math.floor(rand() * 4);
            drawShirtBase(dimensions, itemColor);
            drawPattern(dimensions, patternType, patternColor, rand);
            drawShirtOutline(dimensions);
        } else {
            const scale = 0.8 + rand() * 0.4;
            drawPants(itemColor, patternColor, scale, rand);
        }

        p.pop();
    }

    function getDifferentColorIndex(rand, excludedIndex) {
        let index = Math.floor(rand() * (PALETTE.length - 1));

        if (index >= excludedIndex) {
            index++;
        }

        return index;
    }

    function drawPeg() {
        p.push();
        p.stroke(PEG_COLOR);
        p.strokeWeight(2);
        p.line(0, -6, 0, 6);
        p.pop();
    }

    function drawHanger({ w, h }) {
        p.push();
        p.stroke(HANGER_COLOR);
        p.strokeWeight(2);
        p.noFill();

        p.line(0, h * 0.15, 0, -h * 0.1);

        const hookSize = w * 0.25;

        // p.arc(
        //     hookSize / 2,
        //     -h * 0.1,
        //     hookSize,
        //     hookSize,
        //     p.PI,
        //     p.TWO_PI + p.QUARTER_PI
        // );

        p.pop();
    }

    function getShirtVertices({ w, h }) {
        return [
            [0, h * 0.15],
            [-w * 0.25, 0],
            [-w * 0.5, h * 0.05],
            [-w * 0.8, h * 0.4],
            [-w * 0.5, h * 0.5],
            [-w * 0.45, h],
            [w * 0.45, h],
            [w * 0.5, h * 0.5],
            [w * 0.8, h * 0.4],
            [w * 0.5, h * 0.05],
            [w * 0.25, 0],
        ];
    }

    function drawShirtBase(dimensions, color) {
        p.push();
        p.fill(color);
        p.noStroke();
        drawShirtPath(dimensions);
        p.pop();
    }

    function drawShirtPath(dimensions) {
        p.beginShape();

        for (const [x, y] of getShirtVertices(dimensions)) {
            p.vertex(x, y);
        }

        p.endShape(p.CLOSE);
    }

    function drawPattern(dimensions, patternType, color, rand) {
        const ctx = p.drawingContext;

        ctx.save();

        createShirtClipPath(dimensions);
        ctx.clip();

        switch (patternType) {
            case 1:
                drawHorizontalStripes(dimensions, color);
                break;

            case 2:
                drawPolkaDots(dimensions, color, rand);
                break;

            case 3:
                drawDiagonalStripes(dimensions, color);
                break;
        }

        ctx.restore();
    }

    function createShirtClipPath(dimensions) {
        const ctx = p.drawingContext;
        const vertices = getShirtVertices(dimensions);

        ctx.beginPath();
        ctx.moveTo(vertices[0][0], vertices[0][1]);

        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i][0], vertices[i][1]);
        }

        ctx.closePath();
    }

    function drawHorizontalStripes({ w, h }, color) {
        p.push();
        p.stroke(color);
        p.strokeWeight(h * 0.1);

        for (let y = h * 0.15; y < h; y += h * 0.25) {
            p.line(-w, y, w, y);
        }

        p.pop();
    }

    function drawPolkaDots({ w, h }, color, rand) {
        p.push();
        p.fill(color);
        p.noStroke();

        const numDots = 4 + Math.floor(rand() * 5);

        for (let i = 0; i < numDots; i++) {
            const x = -w * 0.8 + rand() * w * 1.6;
            const y = h * 0.1 + rand() * h * 0.8;
            const diameter = w * 0.15 + rand() * w * 0.2;

            p.circle(x, y, diameter);
        }

        p.pop();
    }

    function drawDiagonalStripes({ w, h }, color) {
        p.push();
        p.stroke(color);
        p.strokeWeight(h * 0.08);

        for (let x = -w - h; x < w + h; x += w * 0.3) {
            p.line(x, 0, x + h, h);
        }

        p.pop();
    }

    function drawShirtOutline(dimensions) {
        p.push();
        p.noFill();
        p.stroke(0, 35);
        p.strokeWeight(1);
        drawShirtPath(dimensions);
        p.pop();
    }

    function drawPants(baseColor, patternColor, scale, rand) {
        p.push();
        
        // Draw base pants
        p.fill(baseColor);
        p.noStroke();
        drawPantsPath(scale);

        // Add patterns using clipping
        const patternType = Math.floor(rand() * 4);
        drawPantsPattern(scale, patternType, patternColor, rand);

        // Draw outline
        p.noFill();
        p.stroke(0, 35);
        p.strokeWeight(1);
        drawPantsPath(scale);

        p.pop();
    }

    function drawPantsPath(scale) {
        p.beginShape();
        p.vertex(-11 * scale, 112 * scale);
        p.vertex(-43 * scale, 108 * scale);
        p.vertex(-48 * scale, 3 * scale);
        p.vertex(48 * scale, 0 * scale);
        p.vertex(42 * scale, 106 * scale);
        p.vertex(10 * scale, 110 * scale);
        p.vertex(2 * scale, 30 * scale);
        p.endShape(p.CLOSE);
    }

    function drawPantsPattern(scale, patternType, color, rand) {
        const ctx = p.drawingContext;

        ctx.save();

        createPantsClipPath(scale);
        ctx.clip();

        switch (patternType) {
            case 1:
                drawPantsHorizontalStripes(scale, color);
                break;

            case 2:
                drawPantsPolkaDots(scale, color, rand);
                break;

            case 3:
                drawPantsDiagonalStripes(scale, color);
                break;
        }

        ctx.restore();
    }

    function createPantsClipPath(scale) {
        const ctx = p.drawingContext;

        ctx.beginPath();
        ctx.moveTo(-11 * scale, 112 * scale);
        ctx.lineTo(-43 * scale, 108 * scale);
        ctx.lineTo(-48 * scale, 3 * scale);
        ctx.lineTo(48 * scale, 0 * scale);
        ctx.lineTo(42 * scale, 106 * scale);
        ctx.lineTo(10 * scale, 110 * scale);
        ctx.lineTo(2 * scale, 30 * scale);
        ctx.closePath();
    }

    function drawPantsHorizontalStripes(scale, color) {
        p.push();
        p.stroke(color);
        p.strokeWeight(scale * 2);

        for (let y = -20 * scale; y < 140 * scale; y += 20 * scale) {
            p.line(-60 * scale, y, 60 * scale, y);
        }

        p.pop();
    }

    function drawPantsPolkaDots(scale, color, rand) {
        p.push();
        p.fill(color);
        p.noStroke();

        const numDots = 3 + Math.floor(rand() * 4);

        for (let i = 0; i < numDots; i++) {
            const x = -40 * scale + rand() * 80 * scale;
            const y = 10 * scale + rand() * 100 * scale;
            const diameter = scale * 8 + rand() * scale * 6;

            p.circle(x, y, diameter);
        }

        p.pop();
    }

    function drawPantsDiagonalStripes(scale, color) {
        p.push();
        p.stroke(color);
        p.strokeWeight(scale * 1.5);

        for (let x = -100 * scale; x < 100 * scale; x += 15 * scale) {
            p.line(x, -20 * scale, x + 150 * scale, 140 * scale);
        }

        p.pop();
    }

    function renderHUD(syncedMs) {
        const time = new Date(syncedMs);

        const timeStr =
            `${time.getHours().toString().padStart(2, '0')}:` +
            `${time.getMinutes().toString().padStart(2, '0')}:` +
            `${time.getSeconds().toString().padStart(2, '0')}.` +
            `${Math.floor(time.getMilliseconds() / 100)}`;

        const label = `SYNCED TIME: ${timeStr}`;

        p.push();
        p.fill('#111111');
        p.noStroke();
        p.textSize(12);
        p.textStyle(p.BOLD);
        p.text(label, p.width / 2 - p.textWidth(label) / 2, 30);
        p.pop();
    }

    p.windowResized = function () {
        const canvasSize = calcTvCanvasSize();

        p.resizeCanvas(
            canvasSize.width,
            canvasSize.height
        );
    };
};
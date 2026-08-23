import { calcTvCanvasSize } from '../tv-utils.js';
import { xmur3, mb32 } from '../random-utils.js';
import { loadAndCalculateTimeOffsetFromServerMs } from '../time-sync-utils.js';

export const clotheslineSketch = function (p) {
    let initialized = false;
    let offsetFromServerTimeMs = 0;

    // Animation & World Configuration
    const SPEED_PX_PER_SEC = 20; // Clothesline travel speed in screen pixels / second
    const ITEM_SPACING_PX = 140;   // Distance between potential item slots on the line
    const PALETTE = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'];

    p.setup = function () {
        const canvasSize = calcTvCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);

        loadAndCalculateTimeOffsetFromServerMs()
            .then((offsetMs) => {
                offsetFromServerTimeMs = offsetMs;
                initialized = true;
            })
            .catch((err) => {
                console.error(`Time sync failed: ${err}`);
                // Fallback to local clock
                initialized = true;
            });
    };

    p.draw = function () {
        if (!initialized) return;

        // 1. Calculate continuous synced timestamp (ms) directly inside draw()
        const nowMs = Date.now() + offsetFromServerTimeMs;

        // 2. Compute smooth floating-point world scroll offset (pixels)
        const worldX = (nowMs / 1000) * SPEED_PX_PER_SEC;

        // 3. Render Background & Clothesline Base
        p.background('#89b8e4'); // Sky blue

        const lineY = p.height * 0.45;
        const lineSag = 15; // Catenary sag depth

        // Draw hanging rope (catenary curve/arc)
        p.stroke('#5C4033');
        p.strokeWeight(3);
        p.noFill();
        p.beginShape();
        for (let x = 0; x <= p.width; x += 4) {
            // Add subtle sine-wave catenary sag across the screen width
            const sag = Math.sin((x / p.width) * Math.PI) * lineSag;
            p.vertex(x, lineY + sag);
        }
        p.endShape();

        // 4. Calculate visible item index range
        // Adding safety margins (-2 to +2) ensures smooth entrance and exit
        const minIndex = Math.floor((worldX - 100) / ITEM_SPACING_PX);
        const maxIndex = Math.ceil((worldX + p.width + 100) / ITEM_SPACING_PX);

        // 5. Render procedurally generated items in view
        for (let i = minIndex; i <= maxIndex; i++) {
            renderClotheslineItem(i, worldX, lineY, lineSag);
        }

        // 6. Overlay Sync Status / HUD
        renderHUD(nowMs);
    };

    function renderClotheslineItem(itemIndex, worldX, lineY, lineSag) {
        // Continuous position in world coordinates
        const itemWorldX = itemIndex * ITEM_SPACING_PX;

        // Screen position (sub-pixel float, NO Math.floor)
        const screenX = itemWorldX - worldX;

        // Seed PRNG deterministically based purely on the item's unique index
        const seed = xmur3(`clothes_item_${itemIndex}`)();
        const rand = mb32(seed);

        // Procedural generation parameters
        const hasItem = rand() > 0.2; // 80% chance to have an item on this peg
        if (!hasItem) return;

        const colorIndex = Math.floor(rand() * PALETTE.length);
        const itemRadius = 18 + rand() * 14;
        const itemColor = PALETTE[colorIndex];

        // Match Y coordinate to line sag
        const screenSag = Math.sin((screenX / p.width) * Math.PI) * lineSag;
        const itemY = lineY + (isNaN(screenSag) ? 0 : screenSag);

        p.push();
        p.translate(screenX, itemY);

        // Clothes Peg / Clip
        p.stroke('#3A2820');
        p.strokeWeight(2);
        p.line(0, -6, 0, 6);

        // Clothesline Item (Smoothly rendered ball/garment MVP)
        //p.fill(itemColor);
        //p.noStroke();
        //p.ellipse(0, itemRadius + 4, itemRadius * 1.8, itemRadius * 2);

        // Optional detail (e.g., pattern highlight)
        // p.fill(255, 255, 255, 80);
        // p.ellipse(-itemRadius * 0.3, itemRadius * 0.7, itemRadius * 0.5, itemRadius * 0.5);

       // Draw an improved t-shirt shape
        p.fill(itemColor);
        p.noStroke();
        
        const w = itemRadius * 1.5;
        const h = itemRadius * 1.8;
        
        // 1. Draw the hanger clip (a simple line sticking up from the neck)
        p.stroke(itemColor); // Or change to a specific color like p.color(200)
        p.strokeWeight(2);
        p.line(0, -h * 0.2, 0, h * 0.15); 
        
        // 2. Draw the T-shirt shape
        p.fill(itemColor);
        p.noStroke();
        
        p.beginShape();
        // Neck scoop (top center)
        p.vertex(0, h * 0.15);
        // Top-left collar
        p.vertex(-w * 0.25, 0);
        // Left shoulder edge
        p.vertex(-w * 0.5, h * 0.05);
        // Left sleeve outer edge
        p.vertex(-w * 0.8, h * 0.4);
        // Left armpit
        p.vertex(-w * 0.5, h * 0.5);
        // Left bottom hem (slightly tapered)
        p.vertex(-w * 0.45, h);
        // Right bottom hem
        p.vertex(w * 0.45, h);
        // Right armpit
        p.vertex(w * 0.5, h * 0.5);
        // Right sleeve outer edge
        p.vertex(w * 0.8, h * 0.4);
        // Right shoulder edge
        p.vertex(w * 0.5, h * 0.05);
        // Top-right collar
        p.vertex(w * 0.25, 0);
        p.endShape(p.CLOSE);

        p.pop();
    }

    function renderHUD(syncedMs) {
        const t = new Date(syncedMs);
        const timeStr = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}.${Math.floor(t.getMilliseconds() / 100)}`;

        p.fill('#111111');
        p.noStroke();
        p.textSize(12);
        p.textStyle(p.BOLD);
        p.text(`SYNCED TIME: ${timeStr}`, p.width / 2 - p.textWidth(`SYNCED TIME: ${timeStr}`) / 2, 30);
    }

    p.windowResized = () => {
        const canvasSize = calcTvCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
    };
};
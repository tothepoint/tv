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
        '#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93',
        '#FF9F1C', '#2EC4B6', '#E71D36', '#FF6B6B', '#4ECDC4',
        '#F7FFF7', '#1A535C', '#FFE66D', '#FF6B6B', '#4ECDC4',
        '#556270', '#C7F464', '#FF6B6B', '#C44D58', '#FFB400',
    ];

    const BACKGROUND_COLOR = '#89b8e4';
    const ROPE_COLOR = '#5C4033';
    const PEG_COLOR = '#3A2820';
    const HANGER_COLOR = '#E0E0E0';

    const RARITY = {
        COMMON: 50,    // Base items you see constantly
        UNCOMMON: 25,  // Regular items, but less frequent
        RARE: 10,      // Occasional items
        LEGENDARY: 2   // Very rare treats
    };

    // ==========================================
    // EXTENSION REGISTRIES
    // ==========================================

    let CLOTHING_TYPES = [
        {
            name: 'shirt',
            weight: RARITY.COMMON,
            generateMeta: (rand) => {
                const radius = 18 + rand() * 14;
                const w = radius * 1.5;
                const h = radius * 1.8;
                return {
                    vertices: [
                        [0, h * 0.15], [-w * 0.25, 0], [-w * 0.5, h * 0.05],
                        [-w * 0.8, h * 0.4], [-w * 0.5, h * 0.5], [-w * 0.45, h],
                        [w * 0.45, h], [w * 0.5, h * 0.5], [w * 0.8, h * 0.4],
                        [w * 0.5, h * 0.05], [w * 0.25, 0],
                    ],
                    bounds: { minX: -w * 0.8, maxX: w * 0.8, minY: 0, maxY: h }
                };
            }
        },
        {
            name: 'pants',
            weight: RARITY.UNCOMMON,
            generateMeta: (rand) => {
                const s = 0.8 + rand() * 0.4;
                return {
                    vertices: [
                        [-11 * s, 112 * s], [-43 * s, 108 * s], [-48 * s, 3 * s],
                        [48 * s, 0 * s], [42 * s, 106 * s], [10 * s, 110 * s],
                        [2 * s, 30 * s]
                    ],
                    bounds: { minX: -48 * s, maxX: 48 * s, minY: 0, maxY: 112 * s }
                };
            }
        },
        {
            name: 'shorts',
            weight: RARITY.LEGENDARY,
            generateMeta: (rand) => {
                return {
                    vertices: [
                        [-57, -5], [-71, 72], [-13, 80], [-4, 18],
                        [16, 79], [67, 72], [51, -10]
                    ],
                    bounds: { minX: -71, maxX: 67, minY: -5, maxY: 80 }
                };
            }
        },
        {
            name: 'sock',
            weight: RARITY.RARE,
            generateMeta: (rand) => {
                const s = 0.45 + rand() * 0.15; // Random size scaling
                return {
                    vertices: [
                        [-20 * s, -9 * s],
                        [-18 * s, 41 * s],
                        [-22 * s, 78 * s],
                        [-28 * s, 86 * s],
                        [-60 * s, 91 * s],
                        [-84 * s, 100 * s],
                        [-90 * s, 113 * s],
                        [-90 * s, 126 * s],
                        [-84 * s, 142 * s],
                        [-66 * s, 149 * s],
                        [-19 * s, 146 * s],
                        [18 * s, 143 * s],
                        [44 * s, 134 * s],
                        [53 * s, 122 * s],
                        [58 * s, 94 * s],
                        [49 * s, 59 * s],
                        [45 * s, 18 * s],
                        [44 * s, -10 * s]
                    ],
                    bounds: {
                        minX: -90 * s,
                        maxX: 58 * s,
                        minY: -10 * s,
                        maxY: 149 * s
                    }
                };
            }
        },
        {
            name: 'dress',
            weight: RARITY.UNCOMMON,
            generateMeta: (rand) => {
                const s = 0.7 + rand() * 0.3; // Scale factor for size variation
                const yShift = 40; // Shifts top straps up to y = 0
                return {
                    vertices: [
                        [-26 * s, (-37 + yShift) * s],
                        [-31 * s, (-21 + yShift) * s],
                        [-31 * s, (-7 + yShift) * s],
                        [-29 * s, (1 + yShift) * s],
                        [-39 * s, (27 + yShift) * s],
                        [-47 * s, (57 + yShift) * s],
                        [-50 * s, (77 + yShift) * s],
                        [-54 * s, (93 + yShift) * s],
                        [-41 * s, (99 + yShift) * s],
                        [-22 * s, (103 + yShift) * s],
                        [4 * s, (103 + yShift) * s],
                        [34 * s, (104 + yShift) * s],
                        [47 * s, (101 + yShift) * s],
                        [42 * s, (79 + yShift) * s],
                        [35 * s, (53 + yShift) * s],
                        [28 * s, (22 + yShift) * s],
                        [21 * s, (1 + yShift) * s],
                        [24 * s, (-10 + yShift) * s],
                        [26 * s, (-26 + yShift) * s],
                        [19 * s, (-40 + yShift) * s],
                        [6 * s, (-26 + yShift) * s],
                        [-5 * s, (-22 + yShift) * s],
                        [-16 * s, (-28 + yShift) * s],
                        [-23 * s, (-35 + yShift) * s]
                    ],
                    bounds: {
                        minX: -54 * s,
                        maxX: 47 * s,
                        minY: (-40 + yShift) * s,
                        maxY: (104 + yShift) * s
                    }
                };
            }
        },
        {
            name: 'underwear',
            weight: RARITY.RARE,
            generateMeta: (rand) => {
                const s = 0.7 + rand() * 0.3; // Scale factor for slight size variation
                const yShift = 17; // Shifts top waistband (-17) up to y = 0
                return {
                    vertices: [
                        [-66 * s, (-14 + yShift) * s],
                        [-68 * s, (12 + yShift) * s],
                        [-46 * s, (24 + yShift) * s],
                        [-28 * s, (40 + yShift) * s],
                        [-15 * s, (58 + yShift) * s],
                        [14 * s, (58 + yShift) * s],
                        [24 * s, (39 + yShift) * s],
                        [44 * s, (21 + yShift) * s],
                        [53 * s, (14 + yShift) * s],
                        [52 * s, (-17 + yShift) * s]
                    ],
                    bounds: {
                        minX: -68 * s,
                        maxX: 53 * s,
                        minY: 0,
                        maxY: (58 + yShift) * s
                    }
                };
            }
        },
        {
            name: 'skirt',
            weight: RARITY.COMMON,
            generateMeta: (rand) => {
                const s = 0.8 + rand() * 0.4; // Scale factor for length/width
                return {
                    vertices: [
                        [-22 * s, 0],         // Top left waist
                        [22 * s, 0],          // Top right waist
                        [55 * s, 70 * s],     // Bottom right flare
                        [40 * s, 73 * s],     // Hem wave
                        [0, 70 * s],          // Hem middle
                        [-40 * s, 73 * s],    // Hem wave
                        [-55 * s, 70 * s]     // Bottom left flare
                    ],
                    bounds: { minX: -55 * s, maxX: 55 * s, minY: 0, maxY: 73 * s }
                };
            }
        },
        {
            name: 'tankTop',
            weight: RARITY.UNCOMMON,
            generateMeta: (rand) => {
                const s = 0.9 + rand() * 0.2;
                return {
                    vertices: [
                        [-20 * s, 0],         // Left strap top outer
                        [-10 * s, 0],         // Left strap top inner
                        [0, 20 * s],          // Deep scoop neck
                        [10 * s, 0],          // Right strap top inner
                        [20 * s, 0],          // Right strap top outer
                        [30 * s, 35 * s],     // Right armpit
                        [28 * s, 85 * s],     // Bottom right
                        [-28 * s, 85 * s],    // Bottom left
                        [-30 * s, 35 * s]     // Left armpit
                    ],
                    bounds: { minX: -30 * s, maxX: 30 * s, minY: 0, maxY: 85 * s }
                };
            }
        },
        {
            name: 'scarf',
            weight: RARITY.RARE,
            generateMeta: (rand) => {
                const s = 0.9 + rand() * 0.3; // Random length
                return {
                    vertices: [
                        [-12 * s, 0],
                        [12 * s, 0],
                        [12 * s, 110 * s],
                        [5 * s, 105 * s],     // Tassel point
                        [0, 112 * s],         // Tassel point
                        [-5 * s, 105 * s],    // Tassel point
                        [-12 * s, 110 * s]
                    ],
                    bounds: { minX: -12 * s, maxX: 12 * s, minY: 0, maxY: 112 * s }
                };
            }
        },
        {
            name: 'towel',
            weight: RARITY.COMMON,
            generateMeta: (rand) => {
                const s = 0.8 + rand() * 0.4; // Varies between hand towel and bath towel sizes
                return {
                    vertices: [
                        [-40 * s, 0],
                        [40 * s, 0],
                        [38 * s, 100 * s],    // Slightly tapered bottom
                        [0, 104 * s],         // Natural fabric sag in the middle
                        [-38 * s, 100 * s]    // Slightly tapered bottom
                    ],
                    bounds: { minX: -40 * s, maxX: 40 * s, minY: 0, maxY: 104 * s }
                };
            }
        },
        {
            name: 'bra',
            weight: RARITY.UNCOMMON,
            generateMeta: (rand) => {
                const s = 0.8 + rand() * 0.2;

                const getCurve = (p0, p1, p2, p3, segments = 6) => {
                    let pts = [];
                    for (let i = 1; i <= segments; i++) {
                        let t = i / segments, u = 1 - t;
                        pts.push([
                            (u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]) * s,
                            (u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]) * s
                        ]);
                    }
                    return pts;
                };

                return {
                    vertices: [
                        [-26 * s, 0], // Left strap outer
                        [-22 * s, 0], // Left strap inner

                        // Left inner strap curve down to center gore
                        ...getCurve([-22, 0], [-18, 15], [-10, 22], [0, 20]),
                        // Center gore up to right inner strap
                        ...getCurve([0, 20], [10, 22], [18, 15], [22, 0]),

                        [26 * s, 0], // Right strap outer

                        // Right strap curve down to right cup outer edge
                        ...getCurve([26, 0], [28, 15], [35, 20], [38, 28]),
                        // Right cup bottom sweep to center gore
                        ...getCurve([38, 28], [35, 46], [15, 46], [0, 32]),
                        // Left cup bottom sweep from gore to outer edge
                        ...getCurve([0, 32], [-15, 46], [-35, 46], [-38, 28]),
                        // Left cup outer edge curve up to left strap
                        ...getCurve([-38, 28], [-35, 20], [-28, 15], [-26, 0])
                    ],
                    bounds: { minX: -38 * s, maxX: 38 * s, minY: 0, maxY: 42 * s }
                };
            }
        }
    ];


    // LIMIT CLOTHING_TYPES TO ONLY DRESS FOR TESTING
    // let keepOnly = 'overalls'; // Change this to test different clothing types
    // CLOTHING_TYPES = CLOTHING_TYPES.filter(item => item.name === keepOnly);

    const PATTERN_TYPES = [
        {
            name: 'solid',
            draw: () => { } // Nothing to draw for solid
        },
        {
            name: 'horizontalStripes',
            draw: (p, bounds, color) => {
                const h = bounds.maxY - bounds.minY;
                p.push();
                p.stroke(color);
                p.strokeWeight(h * 0.1);
                for (let y = bounds.minY + h * 0.15; y < bounds.maxY; y += h * 0.25) {
                    p.line(bounds.minX - 10, y, bounds.maxX + 10, y);
                }
                p.pop();
            }
        },
        {
            name: 'polkaDots',
            draw: (p, bounds, color, rand) => {
                const w = bounds.maxX - bounds.minX;
                const h = bounds.maxY - bounds.minY;
                p.push();
                p.fill(color);
                p.noStroke();
                const numDots = 4 + Math.floor(rand() * 5);
                for (let i = 0; i < numDots; i++) {
                    const x = bounds.minX + rand() * w;
                    const y = bounds.minY + rand() * h;
                    const diameter = w * 0.15 + rand() * w * 0.2;
                    p.circle(x, y, diameter);
                }
                p.pop();
            }
        },
        {
            name: 'diagonalStripes',
            draw: (p, bounds, color) => {
                const w = bounds.maxX - bounds.minX;
                const h = bounds.maxY - bounds.minY;
                p.push();
                p.stroke(color);
                p.strokeWeight(h * 0.08);
                for (let x = bounds.minX - h; x < bounds.maxX + h; x += w * 0.3) {
                    p.line(x, bounds.minY, x + h, bounds.maxY);
                }
                p.pop();
            }
        },
        {
            name: 'verticalStripes',
            draw: (p, bounds, color) => {
                const w = bounds.maxX - bounds.minX;
                p.push();
                p.stroke(color);
                p.strokeWeight(w * 0.1);
                for (let x = bounds.minX + w * 0.15; x < bounds.maxX; x += w * 0.25) {
                    p.line(x, bounds.minY - 10, x, bounds.maxY + 10);
                }
                p.pop();
            }
        },
        {
            name: 'checkered',
            draw: (p, bounds, color) => {
                const w = bounds.maxX - bounds.minX;
                const tileSize = w * 0.25;
                p.push();
                p.fill(color);
                p.noStroke();
                let row = 0;
                for (let y = bounds.minY - tileSize; y < bounds.maxY; y += tileSize) {
                    let col = 0;
                    for (let x = bounds.minX - tileSize; x < bounds.maxX; x += tileSize) {
                        if ((row + col) % 2 === 0) {
                            p.square(x, y, tileSize);
                        }
                        col++;
                    }
                    row++;
                }
                p.pop();
            }
        },
        {
            name: 'grid', // Gingham / Plaid style
            draw: (p, bounds, color) => {
                const w = bounds.maxX - bounds.minX;
                p.push();
                p.stroke(color);
                p.strokeWeight(w * 0.05);
                const step = w * 0.2;

                // Vertical lines
                for (let x = bounds.minX + step; x < bounds.maxX; x += step) {
                    p.line(x, bounds.minY - 10, x, bounds.maxY + 10);
                }
                // Horizontal lines
                for (let y = bounds.minY + step; y < bounds.maxY; y += step) {
                    p.line(bounds.minX - 10, y, bounds.maxX + 10, y);
                }
                p.pop();
            }
        },
        {
            name: 'chevron', // Zig-Zags
            draw: (p, bounds, color) => {
                const w = bounds.maxX - bounds.minX;
                const step = w * 0.25;
                p.push();
                p.stroke(color);
                p.strokeWeight(w * 0.08);
                p.noFill();
                p.strokeJoin(p.MITER);

                for (let y = bounds.minY - step; y < bounds.maxY + step; y += step * 1.5) {
                    p.beginShape();
                    let up = true;
                    for (let x = bounds.minX - step; x < bounds.maxX + step; x += step) {
                        p.vertex(x, y + (up ? step : 0));
                        up = !up;
                    }
                    p.endShape();
                }
                p.pop();
            }
        },
        {
            name: 'sprinkles', // 90s arcade carpet / confetti style
            draw: (p, bounds, color, rand) => {
                const w = bounds.maxX - bounds.minX;
                const h = bounds.maxY - bounds.minY;
                const numSprinkles = 15 + Math.floor(rand() * 20);

                p.push();
                p.stroke(color);
                p.strokeWeight(w * 0.05);
                p.strokeCap(p.ROUND);

                for (let i = 0; i < numSprinkles; i++) {
                    const cx = bounds.minX + rand() * w;
                    const cy = bounds.minY + rand() * h;
                    const angle = rand() * p.TWO_PI;
                    const len = w * 0.12;

                    p.line(
                        cx - Math.cos(angle) * len, cy - Math.sin(angle) * len,
                        cx + Math.cos(angle) * len, cy + Math.sin(angle) * len
                    );
                }
                p.pop();
            }
        },
        {
            name: 'waves', // Sine wave pattern
            draw: (p, bounds, color) => {
                const w = bounds.maxX - bounds.minX;
                const step = 4; // detail of the curve
                p.push();
                p.stroke(color);
                p.strokeWeight(w * 0.06);
                p.noFill();

                for (let y = bounds.minY; y < bounds.maxY; y += w * 0.25) {
                    p.beginShape();
                    for (let x = bounds.minX - w * 0.2; x < bounds.maxX + w * 0.2; x += step) {
                        // Use x coordinate to drive the sine wave
                        const yOffset = Math.sin((x - bounds.minX) * 0.15) * (w * 0.1);
                        p.vertex(x, y + yOffset);
                    }
                    p.endShape();
                }
                p.pop();
            }
        },
        {
            name: 'argyle', // Intersecting Diamonds
            draw: (p, bounds, color) => {
                const w = bounds.maxX - bounds.minX;
                const tileW = w * 0.4;
                const tileH = tileW * 1.5;
                p.push();
                p.fill(color);
                p.noStroke();

                // Overdraw slightly outside the bounding box so the edges clip nicely
                for (let y = bounds.minY - tileH; y < bounds.maxY; y += tileH) {
                    for (let x = bounds.minX - tileW; x < bounds.maxX; x += tileW) {
                        p.quad(
                            x + tileW / 2, y,
                            x + tileW, y + tileH / 2,
                            x + tileW / 2, y + tileH,
                            x, y + tileH / 2
                        );
                    }
                }
                p.pop();
            }
        },
        {
            name: 'cowPrint', // Organic, randomly generated blobs
            draw: (p, bounds, color, rand) => {
                const w = bounds.maxX - bounds.minX;
                const h = bounds.maxY - bounds.minY;
                const numBlobs = 3 + Math.floor(rand() * 4);

                p.push();
                p.fill(color);
                p.noStroke();

                for (let i = 0; i < numBlobs; i++) {
                    const cx = bounds.minX + rand() * w;
                    const cy = bounds.minY + rand() * h;
                    const baseRadius = w * 0.15 + rand() * w * 0.2;

                    p.beginShape();
                    // Draw a noisy, imperfect circle
                    for (let a = 0; a < p.TWO_PI; a += 0.8) {
                        // Vary the radius at each point of the circle
                        const rOffset = baseRadius * (0.6 + rand() * 0.6);
                        p.vertex(cx + Math.cos(a) * rOffset, cy + Math.sin(a) * rOffset);
                    }
                    p.endShape(p.CLOSE);
                }
                p.pop();
            }
        }
    ];

    // ==========================================
    // CORE SKETCH LOGIC
    // ==========================================

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

        const minIndex = Math.floor((worldX - ITEM_SPACING_PX) / ITEM_SPACING_PX);
        const maxIndex = Math.ceil((worldX + p.width + ITEM_SPACING_PX) / ITEM_SPACING_PX);

        for (let itemIndex = minIndex; itemIndex <= maxIndex; itemIndex++) {
            renderClotheslineItem(itemIndex, worldX, lineY);
        }

        renderHUD(nowMs);
    };

    function renderClotheslineItem(itemIndex, worldX, lineY) {
        const itemWorldX = itemIndex * ITEM_SPACING_PX;
        const screenX = itemWorldX - worldX;
        const rand = mb32(xmur3(`clothes_item_${itemIndex}`)());

        if (rand() <= 0.2) return;

        let colorIndex;
        let itemColor;
        let patternColor;

        let shouldSelectRandomColors = Math.floor(rand() * 10) < 8; // 80% chance to select random colors, 20% chance to use default colors

        if (shouldSelectRandomColors) {
            itemColor = generateRandomColor(rand);
            patternColor = generateRandomColor(rand);
        } else {
            // Select colors
            colorIndex = Math.floor(rand() * PALETTE.length);
            itemColor = PALETTE[colorIndex];
            patternColor = PALETTE[getDifferentColorIndex(rand, colorIndex)];
        }

        // Select Item and Pattern
        const itemConfig = getWeightedRandom(CLOTHING_TYPES, rand);
        const patternConfig = PATTERN_TYPES[Math.floor(rand() * PATTERN_TYPES.length)];

        const itemY = lineY + getLineSag(screenX) + CLOTHES_OFFSET_Y;

        p.push();
        p.translate(screenX, itemY);

        drawPeg();
        drawHanger({ w: 30, h: 80 });
        drawClothingItem(itemConfig, patternConfig, itemColor, patternColor, rand);

        p.pop();
    }

    // ==========================================
    // UNIFIED RENDERING PIPELINE
    // ==========================================

    function drawClothingItem(itemConfig, patternConfig, itemColor, patternColor, rand) {
        const meta = itemConfig.generateMeta(rand);

        // 1. Draw Base
        p.push();
        p.fill(itemColor);
        p.noStroke();
        drawVerticesPath(meta.vertices);
        p.pop();

        // 2. Apply Clip & Draw Pattern
        const ctx = p.drawingContext;
        ctx.save();
        createClipPath(ctx, meta.vertices);
        ctx.clip();
        patternConfig.draw(p, meta.bounds, patternColor, rand);
        ctx.restore();

        // 3. Draw Outline
        p.push();
        p.noFill();
        p.stroke(0, 35);
        p.strokeWeight(1);
        drawVerticesPath(meta.vertices);
        p.pop();
    }

    function drawVerticesPath(vertices) {
        p.beginShape();
        for (const [x, y] of vertices) {
            p.vertex(x, y);
        }
        p.endShape(p.CLOSE);
    }

    function createClipPath(ctx, vertices) {
        ctx.beginPath();
        ctx.moveTo(vertices[0][0], vertices[0][1]);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i][0], vertices[i][1]);
        }
        ctx.closePath();
    }

    // ==========================================
    // UTILS & ENVIRONMENT
    // ==========================================

    function generateRandomColor(rand) {
        const hue = Math.floor(rand() * 360); // 0-359 degrees around the color wheel
        const saturation = 50 + Math.floor(rand() * 40); // 50-90% (keeps it colorful, avoiding gray)
        const lightness = 35 + Math.floor(rand() * 45); // 35-80% (avoids pure black or pure white)

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function getWeightedRandom(items, rand) {
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let randomValue = rand() * totalWeight;
        for (const item of items) {
            randomValue -= (item.weight || 1);
            if (randomValue <= 0) return item;
        }
        return items[items.length - 1];
    }

    function getDifferentColorIndex(rand, excludedIndex) {
        let index = Math.floor(rand() * (PALETTE.length - 1));
        if (index >= excludedIndex) index++;
        return index;
    }

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
        p.pop();
    }

    function renderHUD(syncedMs) {
        // [Unchanged renderHUD logic]
        const time = new Date(syncedMs);
        const timeStr = `${time.getHours().toString().padStart(2, '0')}:` +
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
        p.resizeCanvas(canvasSize.width, canvasSize.height);
    };
};

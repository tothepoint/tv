import * as Tone from 'tone';
import { calcTvCanvasSize } from '../tv-utils.js';

let cols, rows;
let grid; // 2D array to track occupied spaces
let pixelSize = 8; // Size of each "pixel"
let stems = []; // List of active growing stems
let blooms = []; // List of blooming flowers
let bloomLevel = 6;

export const growFlowersByVoiceSketch = function (p) {
    let mapWidth = 64;
    let mapHeight;
    let tileWidth;

    let groundLevel;

    // Tone.js nodes
    let mic;
    let fft;
    let meter;
    const BINS = 1024; // Number of FFT bins

    let micStarted = false;

    const recalcMapSize = () => {
        tileWidth = p.width / mapWidth;
        mapHeight = Math.floor(p.height / tileWidth);
    };

    p.setup = function () {
        const canvasSize = calcTvCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
        p.noStroke();

        // Grid Initialization
        cols = p.floor(p.width / pixelSize);
        rows = p.floor(p.height / pixelSize);
    };

    async function startMic() {
        try {
            await Tone.start();

            mic = new Tone.UserMedia();
            // Add smoothing to reduce jumpiness from ambient noise.
            meter = new Tone.Meter({ smoothing: 0.8 });
            fft = new Tone.FFT(BINS);

            await mic.open();
            mic.connect(meter);
            mic.connect(fft);

            micStarted = true;

            p.background(0);
            p.fill(255);
            initGarden(p);
        } catch (err) {
            console.error('Mic start failed:', err);
        }
    }

    p.mousePressed = () => {
        if (!micStarted) {
            startMic();
        }
    };

    p.touchStarted = () => {
        if (!micStarted) {
            startMic();
        }

        return false; // Prevent default behavior
    };

    p.draw = function () {
        if (!micStarted) {
            p.textSize(24);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('Click anywhere to start Mic', p.width / 2, p.height / 2);
            return;
        }

        // --- Tone.js Audio Analysis ---
        // 1. Get volume level in dB (-100 to 0) and map to 0 - 1 range
        let dbLevel = meter.getValue(); // dB value (e.g. -Infinity to 0)
        // Restrict mapping range: -40dB (quiet floor) to -5dB (loud voice)
        let micLevel = p.map(dbLevel, -40, -5, 0, 1, true);

        // 2. Get FFT frequency array (returned in dB format)
        let rawSpectrum = fft.getValue(); // Float32Array of dB values

        let maxAmplitude = -Infinity;
        let dominantBin = 0;

        // Find dominant bin (highest amplitude)
        for (let i = 0; i < rawSpectrum.length; i++) {
            if (rawSpectrum[i] > maxAmplitude) {
                maxAmplitude = rawSpectrum[i];
                dominantBin = i;
            }
        }

        let branchingFactor = p.map(dominantBin, 3, 30, 0, 0.2, true);

        // Display mic level & update growth
        // Increase threshold (0.12 - 0.20 works well for speech)
        if (micLevel > 0.15) {
            // Update and draw stems
            for (let i = stems.length - 1; i >= 0; i--) {
                stems[i].grow(branchingFactor);
                stems[i].show();

                if (stems[i].finished) {
                    stems.splice(i, 1);
                }
            }

            // Update and draw blooms
            for (let i = 0; i < blooms.length; i++) {
                blooms[i].grow();
                blooms[i].show();
            }
        }

        if (stems.length === 0) {
            let startCol = p.int(p.random(0, cols));
            stems.push(new Stem(startCol, groundLevel, -1, p));
        }
    };

    p.windowResized = () => {
        const canvasSize = calcTvCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();
    };

    function initGarden(p) {
        p.background(20, 20, 30); // Dark background

        // Reset tracking arrays
        stems = [];
        blooms = [];

        // Create a fresh grid (false means empty)
        grid = new Array(cols).fill().map(() => new Array(rows).fill(false));

        groundLevel = rows - 2;

        // Draw the ground
        p.fill(50, 40, 30);
        p.rect(0, groundLevel * pixelSize, p.width, pixelSize * 2);

        // Plant initial stem
        let startCol = p.int(p.random(0, cols));
        stems.push(new Stem(startCol, groundLevel, -1, p));
    }
};

// --- The Stem Class ---
class Stem {
    constructor(x, y, dirY, p) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.dirY = dirY; // Usually -1 (up)
        //this.life = p.random(10, 40); // How long this segment grows
        this.life = p.random(2, Math.floor(p.height / pixelSize));
        this.finished = false;
        this.color = p.color(p.random(40, 80), p.random(150, 200), p.random(40, 80));
    }

    grow(branchingFactor) {
        if (this.life > 0) {
            // Mark current spot as occupied
            if (this.x >= 0 && this.x < cols && this.y >= 0 && this.y < rows) {
                grid[this.x][this.y] = true;
            }

            // Move Up
            this.y += this.dirY;

            // Randomly wiggle left or right
            let wiggle = this.p.random();
            if (wiggle < 0.1 && this.x > 0) this.x--;
            else if (wiggle > 0.9 && this.x < cols - 1) this.x++;

            // Check Branching
            if (this.p.random() < branchingFactor && this.life > 5) {
                let dirX = this.p.random() > 0.5 ? 1 : -1;
                stems.push(new Stem(this.x + dirX, this.y, -1, this.p));
            }

            this.life--;
        } else {
            this.finished = true;
            // Create a bloom at the end of the life
            blooms.push(new Bloom(this.x, this.y, this.p));
        }

        // Stop if we hit top of screen
        if (this.y < 0) this.finished = true;
    }

    show() {
        this.p.fill(this.color);
        this.p.rect(this.x * pixelSize, this.y * pixelSize, pixelSize, pixelSize);
    }
}

// --- The Bloom Class ---
class Bloom {
    constructor(x, y, p) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.maxSize = p.floor(p.random(2, bloomLevel));
        this.currentSize = 0;

        let r = p.random(150, 255);
        let g = p.random(50, 150);
        let b = p.random(150, 255);
        this.color = p.color(r, g, b);
        this.growthSpeed = 10;
        this.timer = 0;
    }

    grow() {
        if (this.currentSize < this.maxSize) {
            if (this.timer % this.growthSpeed === 0) {
                this.currentSize++;
            }
            this.timer++;
        }
    }

    show() {
        this.p.fill(this.color);
        let r = this.currentSize;

        for (let i = -r; i <= r; i++) {
            for (let j = -r; j <= r; j++) {
                if (this.p.abs(i) + this.p.abs(j) <= r) {
                    this.p.rect((this.x + i) * pixelSize, (this.y + j) * pixelSize, pixelSize, pixelSize);
                }
            }
        }

        // Draw yellow center pixel
        this.p.fill(255, 220, 50);
        this.p.rect(this.x * pixelSize, this.y * pixelSize, pixelSize, pixelSize);
    }
}
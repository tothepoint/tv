import * as Tone from 'tone';
import { calcTvCanvasSize } from '../tv-utils.js';

// Toggle label/debug display (set to false to hide labels)
const SHOW_LABELS = false;

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
            if (SHOW_LABELS) {
                p.textSize(24);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Click anywhere to start Mic', p.width / 2, p.height / 2);
            }
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

        // Compute dominant frequency from FFT bin index
        const sampleRate = (Tone.context && Tone.context.sampleRate) ? Tone.context.sampleRate : 44100;
        const nyquist = sampleRate / 2;
        const dominantFreq = dominantBin * (nyquist / rawSpectrum.length);

        // Map dominant frequency (pitch) to branching factor (higher pitch -> more branching)
        let branchingFactor = p.map(dominantFreq, 80, 2000, 0, 0.25, true);
        // micLevel (volume) is computed earlier and used below for growth speed and thresholds

        // Debug overlay: show detected frequency, note, and mic level for discovery
        if (SHOW_LABELS) {
            try {
                const displayFreq = (isFinite(dominantFreq) && dominantFreq > 0) ? dominantFreq : 0;
                let displayMidi = displayFreq > 0 ? Math.round(freqToMidi(displayFreq)) : null;
                let displayNote = displayMidi ? midiToNoteName(displayMidi) : '--';
                p.push();
                p.fill(255);
                p.textSize(12);
                p.textAlign(p.LEFT, p.TOP);
                p.text(`Freq: ${displayFreq.toFixed(1)} Hz\nNote: ${displayNote}\nLevel: ${(micLevel*100).toFixed(0)}%`, 10, 10);
                p.pop();
            } catch (e) {
                // ignore if helpers not available yet
            }
        }

        // Display mic level & update growth
        // Increase threshold (0.12 - 0.20 works well for speech)
        if (micLevel > 0.15) {
            // Update and draw stems
            for (let i = stems.length - 1; i >= 0; i--) {
                stems[i].grow(branchingFactor, dominantFreq, micLevel);
                stems[i].show();

                if (stems[i].finished) {
                    stems.splice(i, 1);
                }
            }

            // Update and draw blooms (pass current pitch & volume so blooms can sustain/grow)
            for (let i = 0; i < blooms.length; i++) {
                blooms[i].grow(dominantFreq, micLevel);
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

function hslToRgb(h, s, l) {
    // Convert HSL to RGB. h in [0,360], s and l in [0,1]. Returns [r,g,b] 0-255
    h = (h % 360 + 360) % 360; // wrap
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hh = h / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;
    if (hh >= 0 && hh < 1) { r1 = c; g1 = x; b1 = 0; }
    else if (hh >= 1 && hh < 2) { r1 = x; g1 = c; b1 = 0; }
    else if (hh >= 2 && hh < 3) { r1 = 0; g1 = c; b1 = x; }
    else if (hh >= 3 && hh < 4) { r1 = 0; g1 = x; b1 = c; }
    else if (hh >= 4 && hh < 5) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }
    const m = l - c / 2;
    return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

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

    grow(branchingFactor, dominantFreq = 440, micLevel = 0.5) {
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
            // Create a bloom at the end of the life, influenced by pitch (dominantFreq) and volume (micLevel)
            blooms.push(new Bloom(this.x, this.y, this.p, dominantFreq, micLevel));
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
// Helpers: convert frequency to MIDI note and MIDI to note name
function freqToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
}

function midiToNoteName(midi) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const m = Math.round(midi);
    const note = notes[(m % 12 + 12) % 12];
    const octave = Math.floor(m / 12) - 1;
    return note + octave;
}

class Bloom {
    constructor(x, y, p, freq = 440, level = 0.5) {
        this.p = p;
        this.x = x;
        this.y = y;

        // Derive nearest MIDI note and note name for clear discovery
        let midi = (freq && freq > 0) ? freqToMidi(freq) : 69;
        this.midi = midi;
        this.noteName = midi ? midiToNoteName(midi) : '--';
        // Show note label briefly (about 1.2 seconds)
        this.noteDisplayTimer = Math.floor((this.p.frameRate ? this.p.frameRate() : 60) * 1.2);

        // Map frequency to bloom size (petal radius)
        this.baseMaxSize = p.floor(p.map(freq, 80, 2000, 1, bloomLevel, true));
        this.maxSize = this.baseMaxSize;
        this.currentSize = 0;

        // Allow bloom to expand up to a larger cap if sound is sustained
        this.maxPossibleSize = Math.min(bloomLevel * 3, Math.max(this.baseMaxSize, Math.floor(this.baseMaxSize * 3)));
        this.sustainEnergy = 0; // accumulates while user sustains sound

        // Locking state: when fullyGrown is true the bloom is frozen and cannot grow further
        this.fullyGrown = false;
        this.pauseCounter = 0; // counts frames below threshold during initial flowering
        this.pauseFrames = Math.floor((this.p.frameRate ? this.p.frameRate() : 60) * 0.5); // 0.5s grace

        // Map note (12 semitone buckets) to distinct hues for clear discovery
        const noteIndex = Math.round(midi) % 12;
        const hueByNote = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
        const hue = hueByNote[(noteIndex + 12) % 12];
        const [r, g, b] = hslToRgb(hue, 0.75, 0.55);
        this.color = p.color(r, g, b);

        // Initial growthSpeed; will be adapted each frame based on current volume
        this.growthSpeed = Math.max(1, Math.floor(p.map(level, 0, 1, 14, 2)));
        this.timer = 0;
    }

    grow(freq = 440, level = 0.5) {
        const SUSTAIN_THRESHOLD = 0.15; // same threshold used for growth activation
        const ACC_PER_SEC = 1.2; // energy accumulated per second at level=1
        const DECAY_PER_SEC = 0.25; // energy decay per second when not sustaining
        const STEP = 1; // energy needed to increase maxSize by 1

        const fps = this.p.frameRate ? Math.max(10, this.p.frameRate()) : 60;

        // If bloom already locked as fully grown, do nothing (freeze size)
        if (this.fullyGrown) {
            if (this.noteDisplayTimer > 0) this.noteDisplayTimer--;
            return;
        }

        // Track pauses: increment pauseCounter when below threshold, reset when above
        if (level > SUSTAIN_THRESHOLD) {
            this.pauseCounter = 0;
        } else {
            this.pauseCounter++;
        }

        // If a pause longer than pauseFrames occurs during initial flowering, lock the bloom
        if (this.pauseCounter >= this.pauseFrames) {
            this.fullyGrown = true;
            if (this.noteDisplayTimer > 0) this.noteDisplayTimer--;
            return;
        }

        // Accumulate energy when sustaining, otherwise decay slowly
        if (level > SUSTAIN_THRESHOLD) {
            this.sustainEnergy += level * (ACC_PER_SEC / fps);
        } else {
            this.sustainEnergy = Math.max(0, this.sustainEnergy - (DECAY_PER_SEC / fps));
        }

        // Apply energy to gradually increase maxSize, allowing multi-stage growth
        while (this.sustainEnergy >= STEP) {
            this.sustainEnergy -= STEP;
            if (this.maxSize < this.maxPossibleSize) this.maxSize++;
            else break;
        }

        // Update growth speed dynamically with current volume (louder -> faster)
        const currentGrowthSpeed = Math.max(1, Math.floor(this.p.map(level, 0, 1, 14, 2)));

        if (this.currentSize < this.maxSize) {
            if (this.timer % currentGrowthSpeed === 0) {
                this.currentSize++;
            }
            this.timer++;
        }

        // If we've reached the maximum possible size, mark fully grown
        if (this.maxSize >= this.maxPossibleSize && this.currentSize >= this.maxSize) {
            this.fullyGrown = true;
        }

        if (this.noteDisplayTimer > 0) this.noteDisplayTimer--;
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

        // Draw note label above bloom briefly for discovery (hidden when SHOW_LABELS=false)
        if (SHOW_LABELS && this.noteDisplayTimer > 0) {
            this.p.push();
            this.p.textAlign(this.p.CENTER, this.p.BOTTOM);
            this.p.textSize(Math.max(8, Math.floor(pixelSize * 1.0)));
            this.p.fill(255);
            const tx = (this.x + 0.5) * pixelSize;
            const ty = (this.y - (this.maxSize + 0.5)) * pixelSize;
            this.p.text(this.noteName, tx, ty);
            this.p.pop();
        }
    }
}
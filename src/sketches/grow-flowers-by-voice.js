let cols, rows;
let grid; // 2D array to track occupied spaces
let pixelSize = 8; // Size of each "pixel"
let stems = []; // List of active growing stems
let blooms = []; // List of blooming flowers
let bloomLevel = 6;

let growFlowersByVoiceSketch = function (p) {
    let mapWidth = 64;
    let mapHeight;
    let tileWidth;

    let groundLevel;
    let mic;
    let fft;
    const BINS = 1024; // Default number of bins (frequency slices)

    // UI Controls
    let branchSlider, bloomSlider, restartBtn;
    let labelBranch, labelBloom;
    let micStarted = false;

    const recalcMapSize = () => {
        tileWidth = p.width / mapWidth;
        mapHeight = Math.floor(p.height / tileWidth);
    };

    p.setup = function () {
        console.log('Setup grow flowers by voice');
        const canvasSize = calcTvCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
        // p.background("#750909");
        p.noStroke();

        // UI Setup
        // p.createP(''); // Spacer
        // labelBranch = p.createSpan('Branching Factor: ');
        // branchSlider = p.createSlider(0, 0.2, 0.05, 0.001); // Min, Max, Start, Step
        // branchSlider.style('margin-right', '20px');

        // labelBloom = p.createSpan('Bloom Size: ');
        // bloomSlider = p.createSlider(2, 15, 6, 1);

        // restartBtn = p.createButton('Re-seed');
        // restartBtn.mousePressed(initGarden);

        // Grid Initialization
        cols = p.floor(p.width / pixelSize);
        rows = p.floor(p.height / pixelSize);

        // initGarden(p);

        // mic = new p5.AudioIn();
        // mic.start();
        // fft = new p5.FFT(0.8, BINS);
        // fft.setInput(mic);

        // Suspend the draw loop until mic is started
        // Add button to start mic on user gesture
        // p.createButton('Start Mic').mousePressed(startMic);
    }

    function startMic() {
        mic = new p5.AudioIn();
        mic.start(() => {
            console.log('Mic started successfully');
            fft = new p5.FFT(0.8, BINS);
            fft.setInput(mic);
            micStarted = true;
            p.background(0);
            p.fill(255);
            initGarden(p);
            p.getAudioContext().resume();
        }, (err) => {
            console.error('Mic start failed:', err);
        });
    }

    p.mousePressed = () => {
        if (!micStarted) {
            startMic();
        }
    };

    p.draw = function () {
        if (!micStarted) {
            // p.background(0);
            // p.fill(255);
            p.textSize(24);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('Click "Start Mic" to begin', p.width / 2, p.height / 2);
            return;
        }
        // p.background("#750909");

        micLevel = mic.getLevel();
        // p.text(`Mic Level: ${micLevel.toFixed(4)}`, 20, p.height / 2 + 60);
        let spectrum = fft.analyze();

        let maxAmplitude = 0;
        let dominantBin = 0;

        for (let i = 0; i < spectrum.length; i++) {
            if (spectrum[i] > maxAmplitude) {
                maxAmplitude = spectrum[i];
                dominantBin = i;
            }
        }

        // 3. Convert the dominant bin index to an actual frequency (in Hertz)
        // The map of bin index to frequency is linear.
        // The maximum frequency is typically half of the sample rate (Nyquist frequency), 
        // which p5.js calculates internally. The default sample rate is often 44100Hz.
        //let dominantFreqHz = fft.getBandFrequency(dominantBin);

        // Display the result
        p.fill(255);
        p.textSize(20);
        //text(`Dominant Frequency: ${round(dominantFreqHz)} Hz`, 20, height / 2);
        //text(`Dominant Bin: ${dominantBin}`, 20, height / 2);

        // You can also display the amplitude of that frequency
        //text(`Amplitude: ${round(maxAmplitude)}`, 20, height / 2 + 30);
        let branchingFactor = p.map(dominantBin, 3, 30, 0, 0, 0.2);
        //text(`Amplitude: ${round(maxAmplitude)}`, 20, height / 2 + 30);

        // Display mic level
        if (micLevel > 0.03) {
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
            //let startCol = floor(cols / 2) + 5;
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
        console.log(`Grid with ${rows} rows and ${cols} cols`);

        groundLevel = rows - 2;

        // Draw the ground
        p.fill(50, 40, 30);
        p.rect(0, groundLevel * pixelSize, p.width, pixelSize * 2);

        // Plant the initial seed in the middle
        //let startCol = floor(cols / 2);
        let startCol = p.int(p.random(0, cols));
        console.log('start at col: ', startCol);
        stems.push(new Stem(startCol, groundLevel, -1, p)); // -1 Y direction (up)
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
            //let branchingFactor = branchSlider.value();
            // Only branch if we have life left and roll the dice
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
        console.log('show stem at', this.x, this.y);
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
        // this.maxSize = p.floor(p.random(2, bloomSlider.value()));
        this.maxSize = p.floor(p.random(2, bloomLevel));
        this.currentSize = 0;
        // Pick a random flower color
        let r = p.random(150, 255);
        let g = p.random(50, 150);
        let b = p.random(150, 255);
        this.color = p.color(r, g, b);
        this.growthSpeed = 10; // Frames between growth steps
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
        // Draw a pixelated circle/diamond shape based on currentSize
        // We iterate relative coordinates
        let r = this.currentSize;

        // We only draw the "new" ring to save performance, or redraw whole thing
        // Since we don't clear background, we can just draw the latest layer.
        // However, to look 'full', we draw the whole shape:

        for (let i = -r; i <= r; i++) {
            for (let j = -r; j <= r; j++) {
                // Manhattan distance for a diamond/pixel look
                if (this.p.abs(i) + this.p.abs(j) <= r) {
                    this.p.rect((this.x + i) * pixelSize, (this.y + j) * pixelSize, pixelSize, pixelSize);
                }
            }
        }

        // Draw a yellow center pixel
        this.p.fill(255, 220, 50);
        this.p.rect(this.x * pixelSize, this.y * pixelSize, pixelSize, pixelSize);
    }
}
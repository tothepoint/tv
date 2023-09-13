window.addEventListener('load', function () {
    const sketches = [
        cakesSketch,
        timeSeededSketch,
        perlinLineSketch,
        perlinLine2Sketch
    ];

    let currentSketchIdx = -1;
    let currentSketchFn;
    let currentSketch;

    const nextSketch = () => {
        removeCurrentSketch();

        currentSketchIdx++;
        if (currentSketchIdx >= sketches.length) {
            runEmptyChannelSketch();
            return;
        }
        currentSketchFn = sketches[currentSketchIdx];
        currentSketch = new p5(currentSketchFn, 'tv-sketch');
    };

    const prevSketch = () => {
        removeCurrentSketch();

        currentSketchIdx--;
        if (currentSketchIdx < 0) {
            currentSketchIdx = 0;
        }
        if (currentSketchIdx >= sketches.length) {
            runEmptyChannelSketch();
            return;
        }
        currentSketchFn = sketches[currentSketchIdx];
        currentSketch = new p5(currentSketchFn, 'tv-sketch');
    };

    const removeCurrentSketch = () => {
        if (currentSketch) {
            currentSketch.remove();
        }
    };

    const runSketchByIdx = (sketchIdx) => {
        removeCurrentSketch();

        currentSketchFn = sketches[sketchIdx];
        currentSketch = new p5(currentSketchFn, 'tv-sketch');
    };

    const runEmptyChannelSketch = () => {
        removeCurrentSketch();

        currentSketchFn = emptyChannelSketch;
        currentSketch = new p5(currentSketchFn, 'tv-sketch');
    };

    document.querySelector('.tv-inner').addEventListener('click', (event => {
        nextSketch();
    }));

    nextSketch();

    document.getElementById('action-power-on-off').addEventListener('click', () => {
        if (currentSketch) {
            currentSketch.remove();
            currentSketch = undefined;
        } else if (currentSketchIdx > -1) {
            currentSketchFn = sketches[currentSketchIdx];
            currentSketch = new p5(currentSketchFn, 'tv-sketch');
        } else {
            nextSketch();
        }
    });

    const tvRemoteDigitButtonDefs = [
        { digit: 1, id: 'action-1' },
        { digit: 2, id: 'action-2' },
        { digit: 3, id: 'action-3' },
        { digit: 4, id: 'action-4' },
        { digit: 5, id: 'action-5' },
        { digit: 6, id: 'action-6' },
        { digit: 7, id: 'action-7' },
        { digit: 8, id: 'action-8' },
        { digit: 9, id: 'action-9' },
        { digit: 0, id: 'action-0' }
    ];

    for (const digitButtonDef of tvRemoteDigitButtonDefs) {
        document.getElementById(digitButtonDef.id).addEventListener('click', () => {
            const buttonSketchId = digitButtonDef.digit - 1;
            if (sketches[buttonSketchId]) {
                runSketchByIdx(buttonSketchId);
            } else {
                runEmptyChannelSketch();
            }
        });
    }

    document.getElementById('action-channel-next').addEventListener('click', () => {
        nextSketch();
    });
    document.getElementById('action-channel-previous').addEventListener('click', () => {
        prevSketch();
    });
});
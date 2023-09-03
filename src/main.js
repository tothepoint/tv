window.addEventListener('load', function () {
    const sketches = [
        perlinLineSketch,
        perlinLine2Sketch
    ];

    let currentSketchIdx = -1;
    let currentSketchFn;
    let currentSketch;

    const nextSketch = () => {
        if (currentSketch) {
            currentSketch.remove();
        }

        currentSketchIdx++;
        if (currentSketchIdx >= sketches.length) {
            currentSketchIdx = 0;
        }
        currentSketchFn = sketches[currentSketchIdx];
        currentSketch = new p5(currentSketchFn, 'tv-sketch');
    };

    document.querySelector('.tv-inner').addEventListener('click', (event => {
        nextSketch();
    }));

    nextSketch();
});
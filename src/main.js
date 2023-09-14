window.addEventListener('load', function () {
    const channelDefinitions = [
        { channelId: 1, sketchFn: cakesSketch },
        { channelId: 2, sketchFn: timeSeededSketch },
        { channelId: 3, sketchFn: perlinLineSketch },
        { channelId: 4, sketchFn: perlinLine2Sketch }
    ];

    const tv = new TV({
        screenElementId: 'tv-sketch'
    });

    document.getElementById('action-power-on-off').addEventListener('click', () => {
        tv.toggleTurnOn();
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
            const channelId = digitButtonDef.digit;
            tv.runChannel(channelId);
        });
    }

    document.getElementById('action-channel-next').addEventListener('click', () => {
        tv.nextChannel();
    });
    document.getElementById('action-channel-previous').addEventListener('click', () => {
        tv.previousChannel();
    });

    for (const channelDefinition of channelDefinitions) {
        tv.registerP5SketchChannel(channelDefinition.channelId, channelDefinition.sketchFn);
    }

    tv.turnOn();
});
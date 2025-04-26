const isThisMusicSketch = function (p) {
    let mapWidth = 64;
    let mapHeight;
    let tileWidth;
    let offsetX = 0.0;
    let timerId;
    let initialized = false;
    let offsetFromServerTimeMs = 0;
    let syncedTime;
    let initialSyncedTime;
    let noiseStep = 0.0015;

    let currY = 0;
    let playingY;
    let playingYIdx;

    const recalcMapSize = () => {
        tileWidth = p.width / mapWidth;
        mapHeight = Math.floor(p.height / tileWidth);
    };

    p.setup = function () {
        const canvasSize = calcTvCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();

        loadAndCalculateTimeOffsetFromServerMs()
            .then((offsetFromServerTimeMsResult) => {
                // Calculate client time offset to server time.
                // Always add that offset to compensate.
                const nowClient = new Date();

                offsetFromServerTimeMs = offsetFromServerTimeMsResult;

                initialized = true;
                if (timerId) {
                    clearInterval(timerId);
                }

                const syncedTimestamp = nowClient.getTime() + offsetFromServerTimeMs;
                syncedTime = new Date(syncedTimestamp);
                initialSyncedTime = new Date(syncedTimestamp);
                const TIME_TO_OFFSET_FACTOR = 0.0001;

                offsetX = (syncedTimestamp) * TIME_TO_OFFSET_FACTOR;

                // timerId = setInterval(() => {
                //     const syncedTimestamp = new Date().getTime() + offsetFromServerTimeMs;
                //     syncedTime = new Date(syncedTimestamp);
                //     offsetX = syncedTimestamp * TIME_TO_OFFSET_FACTOR;
                // }, 50);

                // let noiseOffset = offsetX;
                // const noiseValue = p.noise(noiseOffset);
                // console.log(noiseValue);

                // EXPERIMENTS:

                // runBasicLoopExperiment();
                // runBasicSynthAttackReleaseExperiment();
                // runLoopExperiment();
                // runRepeatedNotesExperiment();
                // runPolySynthScoreExperiment();
                runTimeSyncedTwinkleTwinkleExperiment(syncedTimestamp);

                // TODO: Play around with progressions, ex.: I IV V I, I ii IV V, I ii iii IV V, I ii iii IV V vi, I ii iii IV V vi vii dim, I ii iii IV V vi vii dim I.
            })
            .catch(err => {
                console.log(`Got an error fetching time: ${err}`);
            });
    };

    p.draw = function () {
        // p.background("black");
        // p.background(255, 255, 255, 0);

        const skyBlue = '#89b8e4';
        p.background(skyBlue);
        // let noiseOffset = offsetX;
        // for (let col = 0; col < mapWidth; col++) {
        //     const x = col * tileWidth;
        //     const y = Math.floor(p.noise(noiseOffset) * mapHeight) * tileWidth;
        //     currY = Math.floor(y);
        //     p.rect(x, y, tileWidth);
        //     noiseOffset += noiseStep;
        // }
        // p.text(`Hello`, 100, 100);
        if (playingY !== undefined) {
            p.textSize(48);
            // p.text(`${playingY}`, p.width - tileWidth * 16, tileWidth * 6);
            p.text(`${playingY}`, 160, 160);
            const r = playingYIdx * 100 % 255;
            const g = 0;
            const b = 0;
            // p.background(p.color(r, g, b));
        }

        offsetX += 0.003;
    }

    p.windowResized = () => {
        const canvasSize = calcTvCanvasSize();
        p.resizeCanvas(canvasSize.width, canvasSize.height);
        recalcMapSize();
    };

    p.onAfterRemove = () => {
        if (timerId) {
            clearInterval(timerId);
        }
        if (initialized) {
            Tone.Transport.stop();
            Tone.Transport.cancel(0);
            Tone.Transport.clear(0);
        }
    };

    const runBasicSynthAttackReleaseExperiment = () => {
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();
        const now = Tone.now()
        synth.triggerAttack("D4", now);
        synth.triggerAttack("F4", now + 0.5);
        synth.triggerAttack("A4", now + 1);
        synth.triggerAttack("C5", now + 1.5);
        synth.triggerAttack("E5", now + 2);
        synth.triggerRelease(["D4", "F4", "A4", "C5", "E5"], now + 4);
    };

    const runBasicLoopExperiment = () => {
        //create a synth and connect it to the main output (your speakers)
        const synth = new Tone.Synth().toDestination();

        const now = Tone.now();
        //play a middle 'C' for the duration of an 8th note
        synth.triggerAttackRelease("C4", "8n", now);
        synth.triggerAttackRelease("D4", "8n", now + 1);
        synth.triggerAttackRelease("E4", "8n", now + 2);

        // create two monophonic synths
        const synthA = new Tone.FMSynth().toDestination();
        const synthB = new Tone.AMSynth().toDestination();
        //play a note every quarter-note
        const loopA = new Tone.Loop(time => {
            synthA.triggerAttackRelease("C2", "8n", time);
        }, "4n").start(0);
        //play another note every off quarter-note, by starting it "8n"
        const loopB = new Tone.Loop(time => {
            synthB.triggerAttackRelease("C4", "8n", time);
        }, "4n").start("8n");
        // the loops start when the Transport is started
        Tone.Transport.start();
    };

    const runLoopExperiment = () => {
        var synthA = new Tone.Synth({
            oscillator: {
                type: 'sine',
                modulationType: 'sawtooth',
                modulationIndex: 3,
                harmonicity: 3.4
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0.1,
                release: 0.1
            }
        }).toMaster();

        var synthB = new Tone.Synth({
            oscillator: {
                type: 'triangle8'
            },
            envelope: {
                attack: 2,
                decay: 1,
                sustain: 0.4,
                release: 4
            }
        }).toMaster();

        const loopNotes = ['C4', 'E4', 'G4', 'B4', 'D5', 'F5', 'A5', 'C6', '#', '#', '#', '#', '#', '#'];
        const loopNotesEb = ['Eb4', 'G4', 'Bb4', 'D5', 'F5', 'Ab5', 'C6', '#', '#', '#', '#', '#', '#'];
        const loopNotesF = ['F4', 'A4', 'C5', 'Eb5', 'G5', 'Bb5', 'D6', '#', '#', '#', '#', '#', '#'];
        const loopNotesArr = [loopNotes, loopNotesEb, loopNotesF];
        let loopNotesArrIdx = Math.floor(Math.random() * loopNotesArr.length);

        let loopNoteIdx = 0;
        // const noteDuration = '8n';
        // const loopInterval = '8n';
        const noteDuration = '4n';
        const loopInterval = '4n';
        const loop = new Tone.Loop((time) => {
            // const currentNote = loopNotes[loopNoteIdx % loopNotes.length]; // Cycle through the notes array
            let randomNote = loopNotesArr[loopNotesArrIdx][Math.floor(Math.random() * loopNotes.length)];
            const currentNote = randomNote;
            if (randomNote !== '#') {
                synthA.triggerAttackRelease(currentNote, noteDuration, time);
            }
            // randomNote = loopNotes[Math.floor(Math.random() * loopNotes.length)];
            // if (randomNote !== '#') {
            //     synthB.triggerAttackRelease(randomNote, noteDuration, time);
            // }
            Tone.Draw.schedule(function () {
                //this callback is invoked from a requestAnimationFrame
                //and will be invoked close to AudioContext time
                playingYIdx = loopNoteIdx % (loopNotes.length - 1);
                playingY = randomNote;

                const seconds = Tone.Time(noteDuration).toSeconds();
                setTimeout(() => {
                    playingY = undefined;
                }, seconds * 1000 - 40);
            }, time);


            loopNoteIdx++;
        }, loopInterval).start(0);

        setInterval(() => {
            loopNotesArrIdx = Math.floor(Math.random() * loopNotesArr.length);
        }, 10000);
    };

    const runRepeatedNotesExperiment = () => {
        const synth = new Tone.Synth().toDestination();
        let now = Tone.now();

        // setInterval(() => {
        //     now = Tone.now();
        //     synth.triggerAttackRelease(currY, "32n", now);
        // }, 200);

        // setInterval(() => {
        //     now = Tone.now();
        //     synth.triggerAttackRelease(currY * 2, "32n", now);
        // }, 250);

        const notes = [
            "C3",
            "D3",
            "E3",
            "F3",
            "G3"
        ];

        Tone.Transport.scheduleRepeat((time) => {
            // // use the callback time to schedule events
            // osc.start(time).stop(time + 0.1);
            // synth.triggerAttackRelease(currY * 2, "8n", time);
            synth.triggerAttackRelease(notes[currY % (notes.length - 1)], "8n", time);
            console.log(time);
        }, "4n");
    };

    const runPolySynthScoreExperiment = () => {
        //  // SCALES.
        //  var Cmajor = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

        //  const scoreSynth = [
        //      { "time": "0:0", "duration": "4n", "note": "C4" },
        //      { "time": "1:0", "duration": "4n", "note": "E4" },

        //  ];

        //  for (let measureNo = 0; measureNo < 60; measureNo++) {
        //      scoreSynth.push({
        //          "time": `${measureNo}:0`,
        //          "duration": "4n",
        //          "note": Cmajor[Math.round(Math.random() * Cmajor.length)]
        //      });
        //  }

        const musicScore = {
            "tempo": 120,
            "tracks": [
                // {
                //     "instrument": "fmsynth",
                //     "gain": 0.1,
                //     "score": [
                //         { "time": "0:0", "duration": "4m", "note": "C4" },
                //         { "time": "0:0", "duration": "4m", "note": "E4" },
                //         { "time": "0:0", "duration": "4m", "note": "G4" }
                //     ]
                // },
                {
                    "instrument": "synth",
                    //"score": scoreSynth
                    "score": [
                        { "time": "0:0", "duration": "2n", "note": "E3" },
                        { "time": "0:0", "duration": "2n", "note": "Bb3" },
                        { "time": "1:0", "duration": "2n", "note": "E3" },
                        { "time": "1:0", "duration": "2n", "note": "Bb3" },
                        { "time": "2:0", "duration": "2n", "note": "F3" },
                        { "time": "2:0", "duration": "2n", "note": "A3" },
                        { "time": "2:0", "duration": "2n", "note": "F3" },
                        { "time": "2:0", "duration": "2n", "note": "A3" },
                        { "time": "0:0", "duration": "4n", "note": "C5" },
                        { "time": "0:1", "duration": "4n", "note": "E5" },
                    ],
                    // "score": [
                    //     { "time": "0:0", "duration": "4n", "note": "C4" },
                    //     { "time": "1:0", "duration": "4n", "note": "E4" },
                    //     { "time": "2:0", "duration": "4n", "note": "C4" },
                    //     { "time": "3:0", "duration": "4n", "note": "G3" },
                    //     { "time": "4:0", "duration": "4n", "note": "G4" },
                    //     { "time": "5:0", "duration": "4n", "note": "A4" },
                    //     { "time": "6:0", "duration": "4n", "note": "B4" },
                    //     { "time": "7:0", "duration": "4n", "note": "G3" },
                    //     { "time": "8:0", "duration": "4n", "note": "C3" },
                    //     { "time": "9:0", "duration": "4n", "note": "D3" },
                    //     { "time": "10:0", "duration": "4n", "note": "C4" },
                    //     { "time": "11:0", "duration": "4n", "note": "E4" },
                    //     { "time": "12:0", "duration": "4n", "note": "C4" },
                    //     { "time": "13:0", "duration": "4n", "note": "G3" },
                    //     { "time": "14:0", "duration": "4n", "note": "G4" },
                    //     { "time": "15:0", "duration": "4n", "note": "G5" },
                    //     { "time": "16:0", "duration": "4n", "note": "G6" },
                    //     { "time": "17:0", "duration": "4n", "note": "G7" },
                    //     { "time": "18:0", "duration": "4n", "note": "C3" },
                    //     { "time": "19:0", "duration": "4n", "note": "D3" },
                    //     { "time": "20:0", "duration": "4n", "note": "C4" },
                    //     { "time": "21:0", "duration": "4n", "note": "E4" },
                    //     { "time": "22:0", "duration": "4n", "note": "C4" },
                    //     { "time": "23:0", "duration": "4n", "note": "G3" },
                    //     { "time": "24:0", "duration": "4n", "note": "G4" },
                    //     { "time": "25:0", "duration": "4n", "note": "G5" },
                    //     { "time": "26:0", "duration": "4n", "note": "G6" },
                    //     { "time": "27:0", "duration": "4n", "note": "G7" },
                    //     { "time": "28:0", "duration": "4n", "note": "C3" },
                    //     { "time": "29:0", "duration": "4n", "note": "D3" },
                    //     { "time": "30:0", "duration": "4n", "note": "C4" },
                    //     { "time": "31:0", "duration": "4n", "note": "E4" },
                    //     { "time": "32:0", "duration": "4n", "note": "C4" },
                    //     { "time": "33:0", "duration": "4n", "note": "G3" },
                    //     { "time": "34:0", "duration": "4n", "note": "G4" },
                    //     { "time": "35:0", "duration": "4n", "note": "G5" },
                    //     { "time": "36:0", "duration": "4n", "note": "G6" },
                    //     { "time": "37:0", "duration": "4n", "note": "G7" },
                    //     { "time": "38:0", "duration": "4n", "note": "C3" },
                    //     { "time": "39:0", "duration": "4n", "note": "D3" },
                    //     { "time": "40:0", "duration": "4n", "note": "C4" },
                    //     { "time": "41:0", "duration": "4n", "note": "E4" },
                    //     { "time": "42:0", "duration": "4n", "note": "C4" },
                    //     { "time": "43:0", "duration": "4n", "note": "G3" },
                    //     { "time": "44:0", "duration": "4n", "note": "G4" },
                    //     { "time": "45:0", "duration": "4n", "note": "G5" },
                    //     { "time": "46:0", "duration": "4n", "note": "G6" },
                    //     { "time": "47:0", "duration": "4n", "note": "G7" },
                    //     { "time": "48:0", "duration": "4n", "note": "C3" },
                    //     { "time": "49:0", "duration": "4n", "note": "D3" },
                    //     { "time": "50:0", "duration": "4n", "note": "C4" },
                    //     { "time": "51:0", "duration": "4n", "note": "E4" },
                    //     { "time": "52:0", "duration": "4n", "note": "C4" },
                    //     { "time": "53:0", "duration": "4n", "note": "G3" },
                    //     { "time": "54:0", "duration": "4n", "note": "G4" },
                    //     { "time": "55:0", "duration": "4n", "note": "G5" },
                    //     { "time": "56:0", "duration": "4n", "note": "G6" },
                    //     { "time": "57:0", "duration": "4n", "note": "G7" },
                    //     { "time": "58:0", "duration": "4n", "note": "C3" },
                    //     { "time": "59:0", "duration": "4n", "note": "D3" },
                    // ]
                }
            ]
        };

        // Create instruments for each track
        const instruments = {
            //"synth": new Tone.Synth().toDestination(),
            //"fmsynth": new Tone.FMSynth().toDestination()
            "fmsynth": new Tone.PolySynth(Tone.FMSynth).toDestination()
        };

        // const env = new Tone.Envelope({
        //     attack: 0.1,
        //     decay: 0.2,
        //     sustain: 0,
        //     release: 0.8,
        // }).toDestination();
        // instruments.synth.envelope = env;
        // instruments.fmsynth.volume.value = -12;

        // Create a synth instrument with a custom ADSR envelope
        instruments.synth = new Tone.PolySynth({
            oscillator: {
                type: "sine", // You can change the oscillator type (sine, square, sawtooth, triangle, etc.)
            },
            envelope: {
                attack: 0.1, // Attack time in seconds
                decay: 0.2, // Decay time in seconds
                sustain: 0.5, // Sustain level (0 to 1)
                release: 0.8, // Release time in seconds
            }
        });

        // Tone.Transport.start();

        // Create panner.
        // Create a panner
        const panner = new Tone.Panner({
            pan: -1, // Pan position (-1 for left, 1 for right, 0 for center)
        }).toDestination(); // Connect to the speakers

        // Create reverb and delay effects
        const reverb = new Tone.Reverb({
            decay: 5, // Reverb decay time in seconds
            wet: 0.8, // Wet/dry mix (0 to 1)
        }).toDestination();

        const delay = new Tone.FeedbackDelay({
            delayTime: 0.5, // Delay time in seconds
            wet: 0.2, // Wet/dry mix (0 to 1)
        }).toDestination();

        // Connect the synth to the effects and then to the speakers
        // instruments.synth.chain(panner, reverb, delay, Tone.Destination);
        instruments.synth.chain(
            // panner,
            reverb,
            delay,
            Tone.Destination
        );

        // Create instruments, effects, and gains for each track
        const tracksData = musicScore.tracks.map((track) => {
            const instrument = instruments[track.instrument];
            const gain = new Tone.Gain(track.gain).toDestination();
            const effects = track.effects || [];

            // Connect the instrument to the gain
            instrument.connect(gain);

            // Connect effects to the gain
            effects.forEach((effect) => {
                effect.connect(gain);
            });

            return {
                instrument,
                gain
            };
        });

        // Create a Tone.Part for each track and assign the instrument and gain
        const parts = tracksData.map((trackData, trackIndex) => {
            const { instrument, gain } = trackData;
            const track = musicScore.tracks[trackIndex];

            const part = new Tone.Part((time, value) => {
                // Use the appropriate instrument for this track
                const { velocity } = value;

                // panner.pan.value = (Math.random() > 0.5 ? -1 : 1) * Math.random(); // Left

                // Trigger the instrument to play the specified note with velocity at the given time
                instrument.triggerAttackRelease(value.note, value.duration, time, velocity);
            }, track.score);

            // Connect the part to the track's gain
            //part.connect(gain);

            // Set the part's tempo
            part.start(0);
            Tone.Transport.bpm.value = 100;

            return part;
        });
    };

    const runTimeSyncedTwinkleTwinkleExperiment = (syncedTimestamp) => {
        const TIME_TO_OFFSET_FACTOR = 0.0001;
        const currSyncedTimestamp = syncedTimestamp;
        const songDurationMs = 8 * 1000;
        const songStartTimestamp = currSyncedTimestamp - (currSyncedTimestamp % songDurationMs);
        const songStartSeconds = (currSyncedTimestamp - songStartTimestamp) / 1000;

        console.log(`Time now:${new Date(currSyncedTimestamp)}, song start:${new Date(songStartTimestamp)}, song should start at it's timecode:${songStartSeconds}`);

        offsetX = songStartTimestamp * TIME_TO_OFFSET_FACTOR;
        let noiseOffset = offsetX;
        const noiseValue = p.noise(noiseOffset);
        console.log(noiseValue);

        noiseOffset += noiseStep;

        //{ "time": "0:0", "duration": "4n", "note": "C4" },

        const musicScore = {
            "tempo": 120,
            "score": [ // Twinkle Twinkle Little Star in C major.
                { "time": "0:0", "duration": "4n", "note": "C4" }, // Starts at 0 seconds
                { "time": "0:1", "duration": "4n", "note": "C4" }, // 0.5 seconds
                { "time": "0:2", "duration": "4n", "note": "G4" }, // 1 second
                { "time": "0:3", "duration": "4n", "note": "G4" }, // 1.5 seconds
                { "time": "1:0", "duration": "4n", "note": "A4" }, // 2 seconds
                { "time": "1:1", "duration": "4n", "note": "A4" }, // 2.5 seconds
                { "time": "1:2", "duration": "2n", "note": "G4" }, // 3 seconds
                { "time": "2:0", "duration": "4n", "note": "F4" }, // 4 seconds
                { "time": "2:1", "duration": "4n", "note": "F4" }, // 4.5 seconds
                { "time": "2:2", "duration": "4n", "note": "E4" }, // 5 seconds
                { "time": "2:3", "duration": "4n", "note": "E4" }, // 5.5 seconds
                { "time": "3:0", "duration": "4n", "note": "D4" }, // 6 seconds
                { "time": "3:1", "duration": "4n", "note": "D4" }, // 6.5 seconds
                { "time": "3:2", "duration": "2n", "note": "C4" } // 7 seconds, ends at 8 seconds
            ]
        };

        // One quater note at the tempo 120 BPM is 0.5 seconds as it's 120 beats per minute.

        // Create a new Tone.js Part to play the score
        const part = new Tone.Part((time, value) => {
            // Create a Tone.js Synth to play the notes
            const synth = new Tone.Synth().toDestination();

            // Trigger the synth to play the specified note at the given time
            synth.triggerAttackRelease(value.note, value.duration, time);
        }, musicScore.score);

        // Set the part's tempo
        Tone.Transport.bpm.value = musicScore.tempo;
        // part.start(0);

        // Set the starting time for the Tone.Transport
        // Shift the start time of the part to the song start time.
        // Tone.Transport.seconds = 5;
        Tone.Transport.seconds = songStartSeconds;
        part.start(0);

        Tone.Transport.start();
    };
};

isThisMusicSketch.onBeforeSketchRunPress = (event) => {
    if (event) {
        try {
            console.log(`Event: ${event}`);
            // Warmup the Tone.js from user interaction.
            Tone.start().then(() => {
                console.log('Tone.js started from user interaction.');
                // Tone.Transport.stop();
            });
        } catch (error) {
            alert('Error starting Tone.js:', error);
        }
    }
}
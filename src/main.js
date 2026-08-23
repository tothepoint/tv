import { TV } from './tv.js';
import { cakesSketch } from './sketches/cakes.js';
import { timeSeededSketch } from './sketches/time-seeded.js';
import { perlinLineSketch } from './sketches/perlin-line.js';
import { perlinLine2Sketch } from './sketches/perlin-line-2.js';
import { growFlowersByVoiceSketch } from './sketches/grow-flowers-by-voice.js';
import { clotheslineSketch } from './sketches/clothesline.js';

window.addEventListener('load', function () {
    const versionElement = document.getElementById('app-version');
    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
    versionElement.textContent = `v${appVersion}`;

    const channelDefinitions = [
        { channelId: 1, sketchFn: cakesSketch },
        { channelId: 2, sketchFn: timeSeededSketch },
        { channelId: 3, sketchFn: perlinLineSketch },
        { channelId: 4, sketchFn: perlinLine2Sketch },
        { channelId: 5, sketchFn: clotheslineSketch },
        // { channelId: 5, sketchFn: isThisMusicSketch },
        { channelId: 7, sketchFn: growFlowersByVoiceSketch }
    ];

    const tv = new TV({
        screenElementId: 'tv-sketch'
    });

    const mobileRemoteToggle = document.getElementById('mobile-remote-toggle');
    const tvRemoteControl = document.getElementById('tv-remote-control');

    const toggleMobileRemote = () => {
        if (!tvRemoteControl || !mobileRemoteToggle) return;
        const isOpen = tvRemoteControl.classList.toggle('mobile-open');
        mobileRemoteToggle.setAttribute('aria-expanded', String(isOpen));
    };

    mobileRemoteToggle?.addEventListener('click', () => {
        toggleMobileRemote();
    });

    // Close mobile remote when clicking outside on mobile (when the toggle button is visible)
    const isElementVisible = (el) => {
        if (!el) return false;
        // offsetParent is a reliable quick check for display:none; also guard with computed style checks
        if (el.offsetParent !== null) return true;
        const cs = getComputedStyle(el);
        return cs && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
    };

    const closeMobileRemoteIfOpenAndClickedOutside = (event) => {
        if (!tvRemoteControl || !mobileRemoteToggle) return;
        if (!tvRemoteControl.classList.contains('mobile-open')) return;
        // only active on mobile when the toggle is visible
        if (!isElementVisible(mobileRemoteToggle)) return;
        const target = event.target;
        if (tvRemoteControl.contains(target) || mobileRemoteToggle.contains(target)) return;
        // clicked outside the remote & toggle -> close the mobile remote
        tvRemoteControl.classList.remove('mobile-open');
        mobileRemoteToggle.setAttribute('aria-expanded', 'false');
    };

    document.addEventListener('click', closeMobileRemoteIfOpenAndClickedOutside);

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
        // { digit: 0, id: 'action-0' }
    ];

    for (const digitButtonDef of tvRemoteDigitButtonDefs) {
        document.getElementById(digitButtonDef.id).addEventListener('click', (event) => {
            const channelId = digitButtonDef.digit;
            tv.runChannel(channelId, event);
        });
    }

    // document.getElementById('action-channel-next').addEventListener('click', () => {
    //     tv.nextChannel();
    // });
    // document.getElementById('action-channel-previous').addEventListener('click', () => {
    //     tv.previousChannel();
    // });

    for (const channelDefinition of channelDefinitions) {
        tv.registerP5SketchChannel(channelDefinition.channelId, channelDefinition.sketchFn);
    }

    tv.turnOn();
});
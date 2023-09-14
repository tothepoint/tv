class TV {
    constructor(options) {
        this.screenElementId = options.screenElementId;
        this.channels = {};
        this.currentChannelId = 1;
        this.channelsTotal = 10; // Channels start at 0.
        this.lastChannelId = this.currentChannelId;
        this.turnedOn = false;
        this.currentSketch = undefined;
    }

    toggleTurnOn() {
        if (this.turnedOn) {
            this.turnOff();
        } else {
            this.turnOn();
        }
    }

    turnOn() {
        if (this.lastChannelId !== -1 && this.lastChannelId !== undefined) {
            this.runChannel(this.lastChannelId);
        } else {
            this.runChannel(1);
        }

        this.turnedOn = true;
    }

    turnOff() {
        this.lastChannelId = this.currentChannelId;
        this.removeCurrentSketch();
        this.turnedOn = false;
    }

    runChannel(channelId) {
        this.turnedOn = true;

        if (channelId < 0 || channelId > this.channelsTotal - 1) {
            // Invalid channel, do nothing.
            console.log(`Invalid channel with id:${channelId}`);
            return;
        }

        this.removeCurrentSketch();

        this.currentChannel = this.channels[channelId];
        this.currentChannelId = channelId;

        if (!this.currentChannel) {
            this.runEmptyChannelSketch();
            return;
        }

        let currentSketchFn = this.currentChannel.p5SketchFn;
        if (currentSketchFn) {
            this.currentSketch = new p5(currentSketchFn, this.screenElementId);
        }
    }

    nextChannel() {
        if (!this.turnedOn) {
            return;
        }

        let nextChannelId = this.currentChannelId + 1;

        if (nextChannelId < 0) {
            nextChannelId = 0;
        } else if (nextChannelId >= this.channelsTotal) {
            nextChannelId = 0;
        }

        this.runChannel(nextChannelId);
    }

    previousChannel() {
        if (!this.turnedOn) {
            return;
        }

        let previousChannelId = this.currentChannelId - 1;
        if (previousChannelId < 0) {
            previousChannelId = this.channelsTotal - 1;
        } else if (previousChannelId >= this.channelsTotal) {
            previousChannelId = this.channelsTotal - 1;
        }

        this.runChannel(previousChannelId);
    }

    registerP5SketchChannel(channelId, p5SketchFn) {
        if (this.channels[channelId]) {
            console.log(`Channel with this id is already register:${channelId}`);
            return;
        }

        this.channels[channelId] = {
            p5SketchFn: p5SketchFn
        };
    }

    removeCurrentSketch() {
        if (this.currentSketch) {
            this.currentSketch.remove();
            this.currentSketch = undefined;
        }
    }

    runEmptyChannelSketch() {
        this.removeCurrentSketch();
        this.currentSketch = new p5(emptyChannelSketch, 'tv-sketch');
    };
}
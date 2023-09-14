let offsetFromServerTimeMsCached;

const getClientTimeOffsetFromServer = (clientTimestamp, serverTimestamp) => {
    const offsetFromServerTimeMs = serverTimestamp - clientTimestamp;

    return offsetFromServerTimeMs;
};

const loadTimeUTC = async () => {
    let useServerTime = true;
    let response;
    if (useServerTime) {
        // Do a call to "prime" the communication.
        response = await fetch('http://worldtimeapi.org/api/timezone/UTC');

        response = await fetch('http://worldtimeapi.org/api/timezone/UTC');
    } else {
        // Fallback to the client's time instead of server's in case of an error.
        return { datetime: new Date().getTime() };
    }

    if (!response.ok) {
        timeSyncError = true;
        console.log('Time sync error, server response:', response);
        // const message = `Error: ${response.status}`;
        // throw new Error(message);

        // Fallback to the client's time instead of server's in case of an error.
        return { datetime: new Date().getTime() };
    }

    const data = await response.json();

    return data;
};

const loadAndCalculateTimeOffsetFromServerMs = (forceClearCache) => {
    const promise = new Promise((resolve, reject) => {
        // Cache the calculated time offset to reduce server calls.
        if (offsetFromServerTimeMsCached !== undefined && !forceClearCache) {
            resolve(offsetFromServerTimeMsCached);
            return;
        }

        const requestStartTime = new Date();
        loadTimeUTC()
            .then((data) => {
                const requestEndTime = new Date();
                const requestDurationMs = requestEndTime - requestStartTime;
                // Calculate client time offset to server time.
                // Always add that offset to compensate.
                const nowServer = new Date(new Date(data.datetime).getTime());
                const nowClient = new Date();

                const nowClientTimestamp = nowClient.getTime();
                const nowServerTimestamp = nowServer.getTime();
                offsetFromServerTimeMsCached = getClientTimeOffsetFromServer(nowClientTimestamp, nowServerTimestamp);

                resolve(offsetFromServerTimeMsCached);
            })
            .catch(err => {
                console.log(`Got an error fetching time: ${err}`);
            });

    });

    return promise;
};
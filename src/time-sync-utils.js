let offsetFromServerTimeMsCached;
let useServerTime = true;

const getClientTimeOffsetFromServer = (clientTimestamp, serverTimestamp) => {
    const offsetFromServerTimeMs = serverTimestamp - clientTimestamp;

    return offsetFromServerTimeMs;
};

const loadTimeUTC = async () => {
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

const loadTimeUTCPostmanAPI = async () => {
    let response;
    if (useServerTime) {
        response = await fetch('https://postman-echo.com/time/now');
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
    const datetime = new Date(data);
    const serverTimestamp = datetime.getTime();

    return { datetime: serverTimestamp };
}

const loadAndCalculateTimeOffsetFromServerMs = (forceClearCache) => {
    const promise = new Promise((resolve, reject) => {
        // Cache the calculated time offset to reduce server calls.
        if (offsetFromServerTimeMsCached !== undefined && !forceClearCache) {
            resolve(offsetFromServerTimeMsCached);
            return;
        }

        const onTimeLoaded = (data) => {
            const requestEndTime = new Date();
            // Calculate client time offset to server time.
            // Always add that offset to compensate.
            const nowServer = new Date(new Date(data.datetime).getTime());
            const nowClient = new Date();

            const nowClientTimestamp = nowClient.getTime();
            const nowServerTimestamp = nowServer.getTime();
            offsetFromServerTimeMsCached = getClientTimeOffsetFromServer(nowClientTimestamp, nowServerTimestamp);

            resolve(offsetFromServerTimeMsCached);
        };

        loadTimeUTCPostmanAPI()
            .then((data) => {
                onTimeLoaded(data);
            })
            .catch(err => {
                console.log(`Falling back to using client time. Got an error fetching server time: ${err}`);

                // Fallback to the client's time instead of server's in case of an error.
                const nowClient = new Date();
                const nowClientTimestamp = nowClient.getTime();
                onTimeLoaded({ datetime: nowClientTimestamp });
            });
    });

    return promise;
};
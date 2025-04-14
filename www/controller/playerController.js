function isDownloading(activeRequests) {
    let downloading = false
    for (let i = 0; i < activeRequests.length; i++) {
        const xhr = activeRequests[i];
        if (xhr.readyState === 1 || xhr.readyState === 3) {
            downloading = true
            break
        }
    }
    return downloading
}

function fetchBuffer(url, activeRequests) {
    const removeDoneRequest = (xhr) => {
        const remove_index = activeRequests.indexOf(xhr);
        if (remove_index !== -1) {
            activeRequests.splice(remove_index, 1);
        }
    }
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
            removeDoneRequest(xhr)
            if (xhr.status !== 200) {
                reject(new Error('Request failed with status: ' + xhr.status));
            }

            resolve(xhr.response);
        };
        xhr.onerror = function () {
            removeDoneRequest(xhr)
            reject(new Error('Network error'));
        };
        activeRequests.push(xhr);
        xhr.send();
    });
}

async function appendMediaBuffer(lastSegmentIndexBeingLoaded, mediaPath, sourceBuffer, activeRequests) {
    try {
        const buffer = await fetchBuffer(mediaPath, activeRequests);
        if (sourceBuffer.updating) {
            await new Promise(resolve => {
                let add_buffer_timer = setInterval(() => {
                    if (sourceBuffer.updating) {
                        return
                    }
                    clearInterval(add_buffer_timer)
                    resolve()
                }, 1000);
            })
        }

        appendBuffer(sourceBuffer, buffer)

        return { haveError: false, index: lastSegmentIndexBeingLoaded };
    } catch (err) {
        console.error('Failed to append Buffer: ', err);
        return { haveError: true, index: lastSegmentIndexBeingLoaded };
    }
}


async function addBuffer(playerState) {
    showLog(playerState)
    const updatePlayerState = (r) => {
        const auidoRes = r[0]
        const videoRes = r[1]
        if (auidoRes.haveError || videoRes.haveError) {
            playerState.isOffline = true
            playerState.lastSegmentIndexBeingLoaded = Math.min(auidoRes.index, videoRes.index);
            return false
        } else {
            playerState.isOffline = false
            playerState.lastLoadedSegmentIndex = Math.min(auidoRes.index, videoRes.index);
            return true
        }
    }

    let resolutionIndex = document.getElementById('resolution').selectedIndex
    if (resolutionIndex === RESOLUTION_AUTO) {
        resolutionIndex = getOptimalResolution(playerState)
    }
    if ((resolutionIndex != resolutions.length) &&
        (resolutionIndex != playerState.resolutionId || playerState.isOffline)) {
        let downloading = isDownloading(playerState.activeRequests)
        if (downloading) {
            return
        }

        const tmpResolutionId = resolutionIndex

        const initialAudioSegmentURL = buildSegmentRequestURL(true, true, tmpResolutionId, -1)
        const initialVideoSegmentURL = buildSegmentRequestURL(false, true, tmpResolutionId, -1)
        const r = await Promise.all([
            appendMediaBuffer(playerState.lastSegmentIndexBeingLoaded, initialAudioSegmentURL, playerState.audioSource, playerState.activeRequests),
            appendMediaBuffer(playerState.lastSegmentIndexBeingLoaded, initialVideoSegmentURL, playerState.videoSource, playerState.activeRequests)
        ]);
        const isSuccess = updatePlayerState(r)
        if (isSuccess) {
            playerState.resolutionId = resolutionIndex
            return true
        }

        return false
    }

    if (playerState.lastSegmentIndexBeingLoaded < Math.floor(playerState.currentTime) + limitSecond && playerState.lastSegmentIndexBeingLoaded < segmentsCount) {
        const audioSegmentURL = buildSegmentRequestURL(true, false, playerState.resolutionId, playerState.lastSegmentIndexBeingLoaded)
        const videoSegmentURL = buildSegmentRequestURL(false, false, playerState.resolutionId, playerState.lastSegmentIndexBeingLoaded)

        Promise.all([
            appendMediaBuffer(playerState.lastSegmentIndexBeingLoaded, audioSegmentURL, playerState.audioSource, playerState.activeRequests),
            appendMediaBuffer(playerState.lastSegmentIndexBeingLoaded, videoSegmentURL, playerState.videoSource, playerState.activeRequests)
        ]).then((r) => {
            updatePlayerState(r)
        })

        playerState.lastSegmentIndexBeingLoaded += 1;
    }
    return true
}

function showLog(playerState) {
    const variableState = {
        currentTime: playerState.currentTime,
        lastSegmentIndexBeingLoaded: playerState.lastSegmentIndexBeingLoaded,
        lastLoadedSegmentIndex: playerState.lastLoadedSegmentIndex,
        resolutionId: playerState.resolutionId,
        isOffline: playerState.isOffline,
        activeRequests: playerState.activeRequests.length
    };


    for(const [id, value] of Object.entries(variableState)) {
        document.getElementById(id).innerText = value
      }
}

function sourceOpen(mediaSource, video) {
    let waitingTimer = undefined
    let seekWaitingTimer = undefined

    const videoCodec = 'video/mp4; codecs="avc1.64001e"';
    const audioCodec = 'audio/mp4; codecs="mp4a.40.2"';

    let playerState = {
        currentTime: 0,
        videoSource: mediaSource.addSourceBuffer(videoCodec),
        audioSource: mediaSource.addSourceBuffer(audioCodec),
        lastSegmentIndexBeingLoaded: 0,
        lastLoadedSegmentIndex: 0,
        resolutionId: -1,
        isOffline: false,
        activeRequests: []
    };

    playerState.videoSource.mode = "segments";
    playerState.audioSource.mode = "segments";

    video.onerror = () => {
        console.log('onerror')
    }

    video.onabort = () => {
        console.log('onabort')
    }

    video.onwaiting = (event) => {
        if (Math.abs(video.duration - video.currentTime) < 1) {
            location.reload()
            return
        }

        if (waitingTimer) {
            clearInterval(waitingTimer)
            waitingTimer = undefined
        }
        waitingTimer = setInterval(() => {
            let downloading = isDownloading(playerState.activeRequests)
            if (downloading) {
                return
            }

            playerState.lastSegmentIndexBeingLoaded = Math.floor(playerState.currentTime) - 1
            addBuffer(playerState)
        }, 1000);
    };

    video.ontimeupdate = (event) => {
        playerState.currentTime = video.currentTime
        addBuffer(playerState)
    }

    video.onplaying = (event) => {
        if (!playerState.videoSource.updating && !playerState.audioSource.updating && Math.floor(playerState.currentTime) > 1) {
            playerState.videoSource.remove(0, Math.floor(playerState.currentTime) - 1)
            playerState.audioSource.remove(0, Math.floor(playerState.currentTime) - 1)
        }

        if (waitingTimer) {
            clearInterval(waitingTimer)
            waitingTimer = undefined
        }
    }

    video.onseeking = () => {
        playerState.currentTime = video.currentTime
        playerState.activeRequests.forEach(function (xhr) {
            xhr.abort();
        });
        playerState.activeRequests = []

        if (seekWaitingTimer) {
            clearTimeout(seekWaitingTimer)
            seekWaitingTimer = undefined
        }

        const currentTime = Math.floor(playerState.currentTime)
        if (currentTime > 1) {
            playerState.lastSegmentIndexBeingLoaded = currentTime - 1
        } else {
            playerState.lastSegmentIndexBeingLoaded = 0
        }

        if (video.paused) {
            seekWaitingTimer = setTimeout(() => {
                addBuffer(playerState)
            }, 500);
        }
    }

    mediaSource.removeEventListener("sourceopen", sourceOpen);

    playerState.videoSource.addEventListener("updateend", function firstAppendHandler() {
        addBuffer(playerState)
        removeEventListener("updateend", firstAppendHandler)
    });

    const timer = setInterval(() => {
        const isErr = addBuffer(playerState)
        if (!isErr) {
            clearInterval(timer)
        }
    }, 1000);

};

function play() {
    const mediaSource = new MediaSource();
    let video = document.getElementById('v');
    mediaSource.addEventListener('sourceopen', () => {
        sourceOpen(mediaSource, video)
    });

    video.src = window.URL.createObjectURL(mediaSource);
}

window.onload = () => {
    let is_auto_resolution_change = false
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('auto') === '1') {
        is_auto_resolution_change = true
    }

    let resolutionOptionsHTML = ''
    for (let i = 0; i < resolutions.length; i++) {
        const resolution = resolutions[i];
        resolutionOptionsHTML += `<option>${resolution}</option>`
    }
    resolutionOptionsHTML += `<option ${is_auto_resolution_change ? 'selected' : ''}>自動</option>`
    document.getElementById('resolution').innerHTML = resolutionOptionsHTML

    play()
}

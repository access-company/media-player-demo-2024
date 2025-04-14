const limitSecond = 20
const segmentsCount = 180
const segmentDuration = 1
const resolutions = ["426x240", "640x360", "854x480", "1280x720", "1920x1080"]

const RESOLUTION_426x240 = 0
const RESOLUTION_640x360 = 1
const RESOLUTION_854x480 = 2
const RESOLUTION_1280x720 = 3
const RESOLUTION_1920x1080 = 4
const RESOLUTION_AUTO = 5

// --- 以下の 3 関数を実装すること ---
// 詳細は、README.mdを参照

// 課題1
function buildSegmentRequestURL(isAudio, isInitialSegment, resolutionId, lastSegmentIndexBeingLoaded) {
    console.info(`buildSegmentRequestURL() is called: isAudio=${isAudio}, isInitialSegment=${isInitialSegment}, resolutionId=${resolutionId}, lastSegmentIndexBeingLoaded=${lastSegmentIndexBeingLoaded}`)
    const baseVideoPath = 'segments/video/avc1'
    const baseAudioPath = 'segments/audio/en/mp4a.40.2'
    if (isInitialSegment) {
        if (isAudio) {
            return `${baseAudioPath}/init.mp4`
        } else {
            return `${baseVideoPath}/${resolutionId}/init.mp4`
        }
    } else {
        if (isAudio) {
            return `${baseAudioPath}/seg-${lastSegmentIndexBeingLoaded}.m4s`
        } else {
            return `${baseVideoPath}/${resolutionId}/seg-${lastSegmentIndexBeingLoaded}.m4s`
        }
    }
}

// 課題2
function appendBuffer(sourceBuffer, buffer) {
    console.info("appendBuffer() is called: sourceBuffer=", sourceBuffer, "buffer=", buffer)
    sourceBuffer.appendBuffer(buffer);
    return
}

// 課題3
function getOptimalResolution(playerState) {
    console.info("getOptimalResolution() is called: playerState=", playerState)
    const margin_sec = (playerState.lastLoadedSegmentIndex + 1) - Math.floor(playerState.currentTime)
    if (margin_sec <= 8) {
        return RESOLUTION_426x240
    } else if (margin_sec <= 10) {
        return RESOLUTION_640x360
    } else if (margin_sec <= 12) {
        return RESOLUTION_854x480
    } else if (margin_sec <= 14) {
        return RESOLUTION_1280x720
    } else {
        return RESOLUTION_1920x1080
    }
}

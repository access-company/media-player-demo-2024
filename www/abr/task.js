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
    return '/path/to/segments/xxx/init.mp4' // 例として、正しくないURLを指定している。
}

// 課題2
function appendBuffer(sourceBuffer, buffer) {
    console.info("appendBuffer() is called: sourceBuffer=", sourceBuffer, "buffer=", buffer)
    // 例として、何も実装していない
    return
}

// 課題3
function getOptimalResolution(playerState) {
    console.info("getOptimalResolution() is called: playerState=", playerState)
    return RESOLUTION_426x240 // 例として、解像度426x240のIDを示す定数(本ファイル上部に記載)を返すようにしている
}

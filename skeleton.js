const videoElement = document.getElementById('webcam');
const pointer = document.getElementById('pointer');

const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5          
});

pose.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({image: videoElement});
    },
    width: 1280,
    height: 720
});

camera.start();

function onResults(results) {
    if (results.poseLandmarks) {
        const nose = results.poseLandmarks[0];
        if (nose) {
            const x = (1 - nose.x) * window.innerWidth;  // Mirroring the x-coordinate
            const y = nose.y * window.innerHeight;
            movePointer(x, y);
        }
    }
}

function movePointer(x, y) {
    pointer.style.left = `${x - pointer.offsetWidth / 2}px`;
    pointer.style.top = `${y - pointer.offsetHeight / 2}px`;
}

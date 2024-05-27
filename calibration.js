const videoElement = document.getElementById('webcam');
const pointer = document.getElementById('pointer');

const calibrationMessage = document.createElement('div');
calibrationMessage.id = 'calibration-instruction';
document.body.appendChild(calibrationMessage);
calibrationMessage.innerText = 'Stand in your perceived center and stay still.';

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

let calibratedCenter = {};

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

setTimeout(() => {
    pose.onResults = function(results) {
        if (results.poseLandmarks) {
            const nose = results.poseLandmarks[0];
            if (nose) {
                calibratedCenter.x = (1 - nose.x) * window.innerWidth; // Mirroring the x-coordinate
                calibratedCenter.y = nose.y * window.innerHeight;
                calibrationMessage.innerText = 'Calibration complete! Proceeding to the game...';

                // Store these values or pass them to the game
                localStorage.setItem('calibratedCenterX', calibratedCenter.x);
                localStorage.setItem('calibratedCenterY', calibratedCenter.y);

                setTimeout(() => {
                    window.location.href = 'mainGame.html'; // Redirect back to the main game page
                }, 3000);
            }
        }
    }
}, 7000); // Wait 7 seconds for user to get in position

camera.start();  // Ensure the camera starts capturing for calibration

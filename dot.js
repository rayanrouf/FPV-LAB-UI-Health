const videoElement = document.getElementById('webcam');
const pointer = document.getElementById('pointer');
const circle = document.getElementById('circle');
const gameContainer = document.getElementById('game-container');
let score = 0;
let difficulty = 'easy';
let gameTimeout;
let scoreInterval;

const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

document.addEventListener('DOMContentLoaded', () => {
    const webcamElement = document.getElementById('webcam');
    if (webcamElement) {
        webcamElement.style.display = 'block';  // Make sure the webcam is visible
    }
});

document.getElementById('easy').addEventListener('click', startGame);
document.getElementById('medium').addEventListener('click', startGame);
document.getElementById('hard').addEventListener('click', startGame);

document.getElementById('continue-button').addEventListener('click', () => {
    document.getElementById('end-game').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('circle').style.display = 'block';
    document.getElementById('pointer').style.display = 'block';
    score = 0;
    updateScore();
    moveToLeft = true;
    circle.style.width = difficulty === 'hard' ? "150px" : "180px"; // Reset circle size based on difficulty
    circle.style.height = difficulty === 'hard' ? "150px" : "180px";

    if (difficulty === 'hard') {
        moveCircleForHardMode();
    } else {
        moveCircleSmoothly();
    }

    gameTimeout = setTimeout(endGame, 30000); // Restart the timeout for the game
    scoreInterval = setInterval(checkPointerInsideCircle, 1000); // Restart score checking for the new round
});


function startGame(event) {
    difficulty = event.target.id;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    if (difficulty === 'hard') {
        moveCircleForHardMode();
    } else {
        moveCircleSmoothly();
    }

    if (gameTimeout) clearTimeout(gameTimeout); // Clear any existing timeout
    gameTimeout = setTimeout(endGame, 30000); // End the game after 20 seconds
    scoreInterval = setInterval(checkPointerInsideCircle, 1000); // Check every second and store interval ID
}



pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
});

pose.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({image: videoElement});
    },
    width: 1280,
    height: 720,
});

camera.start();

function onResults(results) {
    if (results.poseLandmarks) {
        // Use the nose landmark for simplicity
        const nose = results.poseLandmarks[0];
        if (!nose) return;

        // Map the nose's position to the pointer's position
        movePointer(nose.x, nose.y);
    }
}

function movePointer(x, y) {
    const screenWidth = gameContainer.offsetWidth; // Use the container width for movement calculation
    const centerY = gameContainer.offsetHeight / 2; // Center Y position within the container

    let mirroredX = 1 - x; // Mirrored X for correct movement

    const newX = mirroredX * screenWidth;
    // Keep Y position constant at the vertical center
    const newY = centerY;

    pointer.style.left = `${newX}px`;
    pointer.style.top = `${newY}px`; // Use newY here to keep it vertically centered
}


let moveToLeft = true; // Initial direction for the circle

function moveCircleSmoothly() {
    const maxLeft = gameContainer.offsetWidth - circle.offsetWidth;
    
    if (difficulty === 'easy') {
        const newPosition = moveToLeft ? 0 : maxLeft;
        circle.style.transition = 'left 10s linear';
        circle.style.left = `${newPosition}px`;
        moveToLeft = !moveToLeft; // Change direction for the next move
        setTimeout(moveCircleSmoothly, 10000); // Continue moving
    } else if (difficulty === 'medium') {
        const speed = 5000; // Constant speed for medium
        const newPosition = Math.floor(Math.random() * maxLeft);
        circle.style.transition = `left ${speed}ms linear`;
        circle.style.left = `${newPosition}px`;
        setTimeout(moveCircleSmoothly, speed); // Continue moving at constant speed
    }
}


function moveCircleForHardMode() {
    const maxLeft = gameContainer.offsetWidth - circle.offsetWidth;
    let newPosition = Math.random() * maxLeft;
    let speed = Math.random() * 2000 + 1000;  // Random speed between 0.5s and 2s

    circle.style.width = "150px";  // Smaller circle for hard mode
    circle.style.height = "150px";
    circle.style.transition = `left ${speed}ms linear`;
    circle.style.left = `${newPosition}px`;

    setTimeout(moveCircleForHardMode, speed);
}

if (difficulty === 'hard') {
    moveCircleForHardMode();
}

moveCircleSmoothly(); // Initialize the movement when the game starts


// Start with the circle on the left or right side initially
circle.style.left = moveToLeft ? '0px' : `${gameContainer.offsetWidth - circle.offsetWidth}px`;
moveCircleSmoothly(); // Start moving the circle






function updateScore() {
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = score;
}

function checkPointerInsideCircle() {
    const pointerRect = pointer.getBoundingClientRect();
    const circleRect = circle.getBoundingClientRect();
    const circleCenterX = circleRect.left + circleRect.width / 2;
    const circleCenterY = circleRect.top + circleRect.height / 2;
    const pointerCenterX = pointerRect.left + pointerRect.width / 2;
    const pointerCenterY = pointerRect.top + pointerRect.height / 2;

    const distance = Math.sqrt(Math.pow(pointerCenterX - circleCenterX, 2) + Math.pow(pointerCenterY - circleCenterY, 2));
    const radius = circleRect.width / 2;

    if (distance < radius) {
        if (distance < radius * 0.33) {
            score += 3; // Close to center
        } else if (distance < radius * 0.66) {
            score += 2; // Between center and edge
        } else {
            score += 1; // Close to edge
        }
    } else {
        score += 0; // Outside the circle
    }

    updateScore();
}


setInterval(checkPointerInsideCircle, 1000); // Check every second



// Start moving the circle smoothly as soon as the page loads
moveCircleSmoothly();

function endGame() {
    clearTimeout(gameTimeout); // Stop the game timeout
    clearInterval(scoreInterval); // Stop the score from incrementing

    document.getElementById('game-container').style.display = 'none';
    document.getElementById('final-score-value').textContent = score;
    document.getElementById('end-game').style.display = 'block';
    document.getElementById('circle').style.display = 'none'; // Hide the circle
    document.getElementById('pointer').style.display = 'none'; // Hide the pointer
}

document.getElementById('main-menu-button').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'flex';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('end-game').style.display = 'none';
    resetGame();
});

function resetGame() {
    score = 0;
    updateScore();
    moveToLeft = true; // Reset the initial direction for the circle
    // Reset other game elements as needed
}



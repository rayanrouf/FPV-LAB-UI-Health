const gameArea = document.getElementById('game-area');
const video = document.getElementById('webcam');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const fruits = ['apple', 'banana', 'orange', 'strawberry', 'watermelon'];
let basketTargetX = window.innerWidth / 2; // Initial target position for basket
let score = 0;
let targetFruit;
let isGameOver = false;
let difficulty = '';
let fruitDroppingInterval;
let correctHits = 0;
let incorrectHits = 0;
// Initializing MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

document.addEventListener('DOMContentLoaded', () => {
  const webcamElement = document.getElementById('webcam');
  if (webcamElement) {
      webcamElement.style.display = 'block';  // Make sure the webcam is visible
  }
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

function onResults(results) {
  if (results.poseLandmarks) {
      // For simplicity, consider the position of the shoulders or hips
      const shoulder = results.poseLandmarks[11]; // Left shoulder, you can also use right

      // Convert shoulder coordinates to screen position
      //const xPosition = shoulder.x * canvas.width;
      // Invert the x-coordinate for movement
        // This assumes the video is mirrored; adjust if not mirrored
      const xPosition = (1 - shoulder.x) * canvas.width;
      console.log(`Shoulder X: ${shoulder.x}, Canvas Width: ${canvas.width}, Basket X: ${xPosition}`);

      // Update basket position
      basketTargetX = xPosition;
      updateBasketPosition();
  }
}

// Access the user's webcam
async function setupWebcam() {
  try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.onloadedmetadata = () => {
          video.play();
          // Set canvas size to match the game area
          canvas.width = gameArea.offsetWidth;
          canvas.height = gameArea.offsetHeight;
          console.log(`Game Area: ${gameArea.offsetWidth} x ${gameArea.offsetHeight}`);
      };
  } catch (error) {
      console.error('Error accessing the webcam', error);
  }

  const camera = new Camera(video, {
      onFrame: async () => {
          await pose.send({image: video});
      },
      width: 1280,
      height: 720
  });
  camera.start();

  pose.onResults(onResults);
}

// Event listener for difficulty buttons
document.querySelectorAll('.difficulty-button').forEach(button => {
  button.addEventListener('click', function() {
      difficulty = this.getAttribute('data-difficulty');
      document.querySelectorAll('.difficulty-button').forEach(btn => {
          btn.classList.remove('selected');
      });
      this.classList.add('selected');
  });
});

// Event listener for the start game button
document.getElementById('start-button').addEventListener('click', () => {
  if (!difficulty) {
      alert('Please select a difficulty level first.');
  } else {
      startGame();
  }
});

// Function to smoothly move the basket towards the target
function lerp(start, end, amount) {
  return (1 - amount) * start + amount * end;
}

function updateBasketPosition() {
  const basket = document.getElementById('basket');
  const gameAreaWidth = gameArea.offsetWidth;
  const basketWidth = basket.offsetWidth;

  // Adjusting for the required multiplication
  let targetXAdjusted = basketTargetX * 5;

  // Retrieve the current left position of the basket, default to center if not set
  let currentLeft = parseFloat(basket.style.left) || gameAreaWidth / 2;

  // The 'amount' controls the smoothness. Closer to 0 = smoother. Suggest starting with 0.05 or 0.1 for noticeable smoothness.
  const smoothness = 0.09; // You may need to adjust this value based on the responsiveness you're looking for

  // Use the lerp function to calculate a smoother next position, incorporating the target position adjustment
  let nextLeft = lerp(currentLeft, targetXAdjusted, smoothness);

  // Ensure the basket stays within the bounds of the game area
  // This step might need adjustments due to the multiplication of targetX by 4
  nextLeft = Math.max(0, Math.min(nextLeft, gameAreaWidth - basketWidth));

  basket.style.left = `${nextLeft}px`;
}



  //const activeFruits = []; // Array to track active fruits

  function dropFruit() {
    // Adjust the probability of dropping the target fruit based on difficulty
    let dropTargetFruitProbability;
    switch (difficulty) {
      case 'easy':
        dropTargetFruitProbability = 0.65; // Higher chance for target fruit
        break;
      case 'medium':
        dropTargetFruitProbability = 0.6; // Balanced
        break;
      case 'hard':
        dropTargetFruitProbability = 0.5; // Even chance for all fruits
        break;
      default:
        dropTargetFruitProbability = 0.6; // Default to medium if no difficulty is selected
    }
  
    const shouldDropTargetFruit = Math.random() < dropTargetFruitProbability;
    let fruitType;
  
    if (shouldDropTargetFruit) {
      fruitType = targetFruit; // Drop the target fruit
    } else {
      // Choose a fruit that is not the target fruit
      let nonTargetFruits = fruits.filter(fruit => fruit !== targetFruit);
      fruitType = nonTargetFruits[Math.floor(Math.random() * nonTargetFruits.length)];
    }
  
    const fruit = document.createElement('div');
    fruit.className = 'fruit ' + fruitType;
    fruit.style.left = Math.random() * (gameArea.offsetWidth - 100) + 'px';
    fruit.style.top = '-50px';
  
    document.getElementById('game-area').appendChild(fruit);
  
    // Adjust the falling speed based on difficulty
    let fallSpeed;
    switch (difficulty) {
      case 'easy':
        fallSpeed = 5; // Slower fall
        break;
      case 'medium':
        fallSpeed = 6; // Medium fall
        break;
      case 'hard':
        fallSpeed = 9; // Faster fall
        break;
      default:
        fallSpeed = 6; // Default to medium
    }
  
    let fruitFallInterval = setInterval(() => {
      let currentTop = parseInt(fruit.style.top, 10);
      fruit.style.top = currentTop + fallSpeed + 'px';
  
      if (currentTop > gameArea.offsetHeight) {
        clearInterval(fruitFallInterval);
        fruit.remove();
      }
  
      if (checkCollision(fruit)) {
        clearInterval(fruitFallInterval);
        fruit.remove();
  
        if (!isGameOver) {
          if (fruitType === targetFruit) {
            score += 5;
            correctHits++; // Increment correct hits
          } else {
            score--;
            incorrectHits++; //Increment incorrect hits
          }
          updateScore();
        }
      }
    }, 100);
  }
  


  function checkCollision(fruit) {
    const basket = document.getElementById('basket');
    const fruitRect = fruit.getBoundingClientRect();
    const basketRect = basket.getBoundingClientRect();

    return !(fruitRect.right < basketRect.left ||
             fruitRect.left > basketRect.right ||
             fruitRect.bottom < basketRect.top ||
             fruitRect.top > basketRect.bottom);
  }


function updateScore() {
  const scoreElement = document.getElementById('score');
  scoreElement.textContent = score;
  }

  function startGame() {
    if (fruitDroppingInterval) {
      clearInterval(fruitDroppingInterval);
  }

    // Select a random target fruit
    const fruitIndex = Math.floor(Math.random() * fruits.length);
    targetFruit = fruits[fruitIndex];
    console.log("Catch this fruit: " + targetFruit); // For debugging, or show this on the screen

    // Update UI elements
    const targetFruitElement = document.getElementById('target-fruit');
    targetFruitElement.textContent = targetFruit;
    document.getElementById('game-title').classList.add('hidden'); // Hide the game title
    document.getElementById('target-fruit-area').classList.remove('hidden'); // Show the target fruit area
    document.querySelectorAll('.difficulty-button').forEach(btn => btn.classList.add('hidden')); // Hide difficulty buttons
    document.querySelector('footer').classList.add('hidden'); // Hide the footer
    document.querySelector('#basket').classList.remove('hidden'); // Make the basket visible

    // Determine the fruit dropping interval based on difficulty
    let dropInterval;
    switch (difficulty) {
        case 'easy':
            dropInterval = 4000; // 4 seconds
            break;
        case 'medium':
            dropInterval = 3000; // 3 seconds
            break;
        case 'hard':
            dropInterval = 1500; // 1.5 seconds
            break;
        default:
            dropInterval = 3000; // Default to medium if no difficulty is selected
    }
     // Start dropping fruits at the determined interval
     let fruitDropping = setInterval(dropFruit, dropInterval);

     // Set a 90-second timer for each game round
     setTimeout(() => {
         clearInterval(fruitDropping); // Stop dropping fruits
         isGameOver = true;
         gameOver(); // End the game after 90 seconds
     }, 90000); // 90 seconds
}


function gameOver() {
  if (fruitDroppingInterval) {
    clearInterval(fruitDroppingInterval);
  }
  // Stop all fruit from falling
  document.querySelectorAll('.fruit').forEach(fruit => fruit.remove());
  // Hide game elements
  document.getElementById('game-title').classList.remove('hidden'); // Show the game title
  document.getElementById('target-fruit-area').classList.add('hidden'); // Hide the target fruit area
  document.getElementById('game-area').style.display = 'none';
  document.getElementById('basket').style.display = 'none';

  // Update and show final score
  document.getElementById('final-score-value').textContent = score; // Update score in its dedicated span
  // Update correct and incorrect hits display
  document.getElementById('correct-hits').textContent = correctHits; // Update correct hits count
  document.getElementById('incorrect-hits').textContent = incorrectHits; // Update incorrect hits count
  // Now, show the final score, which includes the score and hits info
  document.getElementById('final-score').style.display = 'block';

  // Show the "Go Back to Start Screen" button
  const restartButton = document.getElementById('restart-button');
  restartButton.style.display = 'block';
}


function resetGame() {
  score = 0;
  correctHits = 0;
  incorrectHits = 0;
  isGameOver = false;
  updateScore();
  // Hide the game over or final score message if it's being displayed
  document.getElementById('final-score').style.display = 'none';
  // Possibly reset other game states or UI elements as needed
}

document.getElementById('back-button').addEventListener('click', () => {
  window.location.href = '../menu.html';

});


document.getElementById('restart-button').addEventListener('click', () => {
  location.reload();
});

// Call the setupWebcam function when the window loads
window.addEventListener('load', setupWebcam);
  
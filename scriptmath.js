const videoElement = document.getElementById('webcam');
const pointer = document.getElementById('pointer');
let allowOverlapCheck = true; //Introduce a flag
let score = 0; // Initial score
let rounds = 0; // Initial round
let difficulty = '';


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('restart-game').addEventListener('click', resetGame);
    // Select difficulty buttons
    document.getElementById('easy').addEventListener('click', () => startGame('easy'));
    document.getElementById('medium').addEventListener('click', () => startGame('medium'));
    document.getElementById('hard').addEventListener('click', () => startGame('hard'));
});

document.addEventListener('DOMContentLoaded', () => {
    const webcamElement = document.getElementById('webcam');
    if (webcamElement) {
        webcamElement.style.display = 'block';  // Make sure the webcam is visible
    }
});

document.getElementById('calibrate').addEventListener('click', function() {
    window.location.href = 'calibration.html'; // Redirect to calibration page
});



const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

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


function startGame(selectedDifficulty) {
    difficulty = selectedDifficulty;
    document.getElementById('landing-page').style.display = 'none'; // Hide landing page
    document.getElementById('game-container').classList.add('show'); // Show game elements

    // Initialize game settings based on difficulty
    generateQuestionAndAnswers(); // Start the game
}

function movePointer(x, y) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Amplify both x and y movements. Adjust the multiplier as needed.
    const amplify = 1.3; // Increase this to make the movements more pronounced

    // Mirroring the X coordinate and applying the amplification
    let mirroredX = 1 - x; // Assuming x is normalized [0, 1]
    const newX = mirroredX * screenWidth * amplify;

    // Apply amplification for y movement as well
    const newY = y * screenHeight * amplify;

    // Ensure the pointer stays within the screen bounds
    // Adjust newX and newY to keep the pointer within the viewport
    const adjustedX = Math.min(screenWidth - pointer.offsetWidth, Math.max(0, newX - pointer.offsetWidth / 2)); // Adjust for pointer size
    const adjustedY = Math.min(screenHeight - pointer.offsetHeight, Math.max(0, newY - pointer.offsetHeight / 2)); // Adjust for pointer size

    pointer.style.left = `${adjustedX}px`;
    pointer.style.top = `${adjustedY}px`; // Use adjusted coordinates

    // Check for overlap with any of the answer boxes
    checkOverlap(newX, newY);
}

function checkOverlap(x, y) {
    if (!allowOverlapCheck) return; // Ensure we're allowed to check for overlaps

    document.querySelectorAll('.corner-box').forEach(box => {
        const rect = box.getBoundingClientRect();
        if (x < rect.right && x + pointer.offsetWidth > rect.left &&
            y < rect.bottom && y + pointer.offsetHeight > rect.top) {
            const isCorrect = box.getAttribute('data-correct') === 'true';
            displayFeedback(isCorrect ? 'Correct Answer!' : 'Wrong Answer!', isCorrect);
            updateScore(isCorrect); // Update score accordingly
            
            // Temporarily prevent further overlap checks
            allowOverlapCheck = false;
            
            // Show instruction to move back to the center, or end game message if round 10 completed
            const roundInstruction = document.getElementById('round-instruction');
            if (rounds >= 10) {
                // If 10 rounds are complete, show "Well Played!" message
                roundInstruction.textContent = "Well Played!";
            } else {
                // Otherwise, prompt for the next round
                roundInstruction.textContent = `Move back to the center, Starting Round ${rounds + 1}!`;
            }
            roundInstruction.style.display = 'block';
            
            setTimeout(() => {
                // Wait for 2 seconds to show feedback, then generate new question or end the game
                if (rounds < 10) {
                    generateQuestionAndAnswers();
                } else {
                    endGame(); // End the game after 10 rounds
                }
                clearFeedback();
                
                // Hide the round instruction
                roundInstruction.style.display = 'none';

                // Allow overlap checks again
                allowOverlapCheck = true;
            }, 2000); // Adjust delay as needed
        }
    });
}





// Function to update the score
function updateScore(isCorrect) {
    if (rounds < 10) { // Check if the game is still within the 10 rounds
        if (isCorrect) {
            score++; // Only increment score if the answer is correct
        }
        rounds++; // Increment rounds regardless of right or wrong answer
        document.getElementById('score').innerText = score; // Correctly update score display without repeating "Score:"
        if (rounds >= 10) {
            endGame(); // End the game after 10 rounds
        }
    }
}

// Function to generate a new question and answers
function generateQuestionAndAnswers() {
    if (rounds >= 10) return; // Prevent generating new questions if 10 rounds are completed
    let question, correctAnswer;
    let answers = new Set();

    // Generate random numbers and operations based on difficulty
    if (difficulty === 'easy') {
        // Easy: Single digit addition and subtraction, no negative numbers
        const number1 = Math.floor(Math.random() * 10);
        const number2 = Math.floor(Math.random() * 10);
        if (Math.random() > 0.5) {
            correctAnswer = number1 + number2;
            question = `${number1} + ${number2} = ?`;
        } else {
            // Ensure no negative answers
            correctAnswer = Math.max(number1, number2) - Math.min(number1, number2);
            question = `${Math.max(number1, number2)} - ${Math.min(number1, number2)} = ?`;
        }
    } else if (difficulty === 'medium') {
        // Medium: Single and double digit addition and subtraction, single digit multiplication
        const operation = Math.floor(Math.random() * 3);
        const number1 = operation === 2 ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 100);
        const number2 = operation === 2 ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 100);
        switch (operation) {
            case 0:
                correctAnswer = number1 + number2;
                question = `${number1} + ${number2} = ?`;
                break;
            case 1:
                correctAnswer = Math.max(number1, number2) - Math.min(number1, number2);
                question = `${Math.max(number1, number2)} - ${Math.min(number1, number2)} = ?`;
                break;
            case 2:
                correctAnswer = number1 * number2;
                question = `${number1} X ${number2} = ?`;
                break;
        }
    } else if (difficulty === 'hard') {
        // Hard: Three single-digit numbers, including only addition and multiplication
        const operations = ['+', 'X']; // Exclude '-' to avoid negative results
        let operation1 = operations[Math.floor(Math.random() * operations.length)];
        let operation2 = operations[Math.floor(Math.random() * operations.length)];
        const number1 = Math.floor(Math.random() * 10);
        const number2 = Math.floor(Math.random() * 10);
        const number3 = Math.floor(Math.random() * 10);
    
        // Prepare the expression for eval by converting 'X' to '*'
        let evalOperation1 = operation1 === 'X' ? '*' : operation1;
        let evalOperation2 = operation2 === 'X' ? '*' : operation2;
    
        // Use the eval-compatible operations for calculation
        let expression = `${number1} ${evalOperation1} ${number2} ${evalOperation2} ${number3}`;
        correctAnswer = Math.round(eval(expression)); // Calculate using actual math operators
    
        // Keep the original operations for display purposes
        question = `${number1} ${operation1} ${number2} ${operation2} ${number3} = ?`;
    }
    

    while (answers.size < 3) {
        let wrongAnswer = Math.floor(Math.random() * 20) + 1; // Range might need adjustment based on difficulty
        if (wrongAnswer !== correctAnswer) {
            answers.add(wrongAnswer);
        }
    }
    answers.add(correctAnswer);

    // Convert Set to Array and shuffle
    let answersArray = [...answers];
    shuffleArray(answersArray);

    // Assign answers to boxes and update question display
    const boxes = document.querySelectorAll('.corner-box');
    boxes.forEach((box, index) => {
        box.innerText = answersArray[index];
        box.setAttribute('data-correct', answersArray[index] === correctAnswer ? 'true' : 'false');
    });

    // Update question display
    document.getElementById('question-display').innerText = question;
}


// Utility function to shuffle an array (Fisher-Yates shuffle algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

// Function to display feedback message
function displayFeedback(message, isCorrect) {
    const feedbackDisplay = document.getElementById('feedback-display');
    feedbackDisplay.innerText = message;
    if (isCorrect) {
        feedbackDisplay.style.color = 'green'; // Positive feedback
    } else {
        feedbackDisplay.style.color = 'red'; // Negative feedback
    }
}

// Function to clear feedback message
function clearFeedback() {
    document.getElementById('feedback-display').innerText = '';
}

// End Game Function
function endGame() {
    document.getElementById('question-display').innerText = "Thank you for playing!\nYour score is: " + score + " 🎉😄";
    document.getElementById('game-container').style.display = 'none';
    
    // Check if the restart button already exists
    let restartButton = document.getElementById('restart-game');
    if (!restartButton) {
        // If it doesn't exist, create it
        restartButton = document.createElement('button');
        restartButton.innerText = 'Restart Game';
        restartButton.id = 'restart-game';
        document.body.appendChild(restartButton);
    }

    // Ensure the restart button is visible
    restartButton.style.display = 'block';

    // Add click event listener to the restart button if not already added
    restartButton.onclick = function() {
        resetGame();
    };
}

function resetGame() {
    // Reset game state
    score = 0;
    rounds = 0;
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('game-container').classList.remove('show');
    document.getElementById('landing-page').style.display = 'flex';
    
    // Hide the restart button instead of removing it
    const restartButton = document.getElementById('restart-game');
    if (restartButton) {
        restartButton.style.display = 'none';
    }

    // Optionally, clear any feedback messages
    clearFeedback();
    // Additional reset operations as needed
}




// Adjust the interaction logic to check for game end
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.corner-box').forEach(box => {
        box.addEventListener('mouseenter', function() {
            if (rounds < 10) {
                const isCorrect = this.getAttribute('data-correct') === 'true';
                displayFeedback(isCorrect ? 'Correct Answer!' : 'Wrong Answer!', isCorrect);
                if (isCorrect) {
                    updateScore(true); // Increment score for correct answer
                    setTimeout(generateQuestionAndAnswers, 1000); // Add delay for next question
                } else {
                    // If you want to change questions even on wrong answers without decrementing the score
                    setTimeout(generateQuestionAndAnswers, 1000); // Add delay for next question
                }
            }
        });
        box.addEventListener('mouseleave', clearFeedback); // Optionally, clear feedback when not hovering
    });

    // Initial call to populate the first question and answers
    generateQuestionAndAnswers();
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.corner-box').forEach(box => {
        box.addEventListener('mouseenter', function() {
            const isCorrect = this.getAttribute('data-correct') === 'true';
            displayFeedback(isCorrect ? 'Correct Answer!' : 'Wrong Answer!', isCorrect);
            if (isCorrect) {
                updateScore(true); // Increment score for correct answer
                
                // Clear feedback immediately or after a short delay if desired
                // clearFeedback(); // Uncomment if you want to clear feedback immediately

                // Use setTimeout to delay the next question generation
                setTimeout(() => {
                    generateQuestionAndAnswers(); // Generate new question and answers after a delay
                    clearFeedback(); // Clear feedback here if not cleared immediately after scoring
                }, 2000); // Delay of 2000 milliseconds (2 seconds)
            }
        });
        box.addEventListener('mouseleave', clearFeedback); // Optionally, clear feedback when not hovering
    });

    // Initial call to populate question and answers
    generateQuestionAndAnswers();
});



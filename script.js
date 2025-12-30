const board = document.querySelector('.board');
const startButton = document.querySelector('.start-button');
const startModal = document.querySelector('.modal:not(.game-over)');
const gameOverModal = document.querySelector('.modal.game-over');
const restartButton = document.querySelector('.restart-button');
const highScoreElement = document.querySelector('#high-score');

const scoreElement = document.querySelector('#score'); 
const timeElement = document.querySelector('#time');

const blockHeight = 50;
const blockWidth = 50;

// Initialize high score
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
highScoreElement.innerText = highScore;
let score = 0;
let time = 0;
let timerInterval = null;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

let gameInterval = null;
let baseSpeed = 200; // Base speed in ms
let currentSpeed = baseSpeed;
let speedIncreaseCounter = 0;
let comboCounter = 0;
let lastFoodTime = 0;
let multiplier = 1;

let food = {
    x: Math.floor(Math.random() * rows),
    y: Math.floor(Math.random() * cols)
};

const blocks = {};
let snake = [{ x: 1, y: 3 }];
let direction = 'right';
let nextDirection = 'right';
let gameRunning = false;

/* CREATE GRID */
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add('block');
        board.appendChild(block);
        blocks[`${row},${col}`] = block;
    }
}

// Clear the board completely
function clearBoard() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            blocks[`${row},${col}`].classList.remove('fill', 'fill-head', 'food', 'special-food');
        }
    }
}

/* START TIMER */
function startTimer() {
    clearInterval(timerInterval);
    time = 0;
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    timeElement.innerText = `${minutes}-${seconds}`;
    
    timerInterval = setInterval(() => {
        time++;
        const minutes = Math.floor(time / 60).toString().padStart(2, '0');
        const seconds = (time % 60).toString().padStart(2, '0');
        timeElement.innerText = `${minutes}-${seconds}`;
        
        // Spawn special food every 10 seconds
        if (time % 10 === 0 && time > 0 && gameRunning) {
            spawnSpecialFood();
        }
        
        // Speed increases every 30 seconds
        if (time % 30 === 0 && time > 0 && gameRunning) {
            increaseSpeed();
        }
    }, 1000);
}

/* STOP TIMER */
function stopTimer() {
    clearInterval(timerInterval);
}

/* INCREASE SPEED */
function increaseSpeed() {
    if (currentSpeed > 80) { // Minimum speed
        currentSpeed -= 20;
        speedIncreaseCounter++;
        
        // Restart game interval with new speed
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = setInterval(render, currentSpeed);
        }
        
        // Visual feedback for speed increase
        document.body.style.backgroundColor = '#1a1a1a';
        setTimeout(() => {
            document.body.style.backgroundColor = '#0c0c0c';
        }, 100);
    }
}

/* SPAWN SPECIAL FOOD */
function spawnSpecialFood() {
    // Remove existing special food
    document.querySelectorAll('.special-food').forEach(f => f.classList.remove('special-food'));
    
    // Find a position not on snake
    let specialFoodPos;
    let validPosition = false;
    
    while (!validPosition) {
        specialFoodPos = {
            x: Math.floor(Math.random() * rows),
            y: Math.floor(Math.random() * cols)
        };
        
        validPosition = true;
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === specialFoodPos.x && snake[i].y === specialFoodPos.y) {
                validPosition = false;
                break;
            }
        }
        
        // Also make sure it's not on regular food
        if (specialFoodPos.x === food.x && specialFoodPos.y === food.y) {
            validPosition = false;
        }
    }
    
    // Mark the special food block
    blocks[`${specialFoodPos.x},${specialFoodPos.y}`].classList.add('special-food');
    
    // Special food disappears after 5 seconds
    setTimeout(() => {
        if (blocks[`${specialFoodPos.x},${specialFoodPos.y}`]) {
            blocks[`${specialFoodPos.x},${specialFoodPos.y}`].classList.remove('special-food');
        }
    }, 5000);
}

/* GAME OVER FUNCTION */
function endGame() {
    // Stop game loop
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    // Stop timer
    stopTimer();
    
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore.toString());
        highScoreElement.innerText = highScore;
        
        // Visual feedback for new high score
        highScoreElement.style.color = '#4CAF50';
        highScoreElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            highScoreElement.style.color = '';
            highScoreElement.style.transform = '';
        }, 1000);
    }
    
    // Show game over modal
    gameOverModal.style.display = 'flex';
}

/* RENDER FUNCTION - Game loop */
function render() {
    if (!gameRunning) return;
    
    // Update direction
    direction = nextDirection;
    
    let head = { ...snake[0] };

    if (direction === 'left') head.y--;
    else if (direction === 'right') head.y++;
    else if (direction === 'up') head.x--;
    else if (direction === 'down') head.x++;

    // Wall collision
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
        endGame();
        return;
    }

    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            endGame();
            return;
        }
    }

    // Check for food eaten
    let ateFood = false;
    let ateSpecialFood = false;
    let pointsEarned = 0;
    
    // Check regular food
    if (head.x === food.x && head.y === food.y) {
        ateFood = true;
        pointsEarned = 10 * multiplier;
        comboCounter++;
        
        // Increase multiplier for combos
        if (comboCounter >= 3) {
            multiplier = 2;
            // Visual feedback for combo
            scoreElement.style.color = '#FF9800';
            setTimeout(() => {
                scoreElement.style.color = '';
            }, 500);
        }
        
        // Generate new food position
        food = {
            x: Math.floor(Math.random() * rows),
            y: Math.floor(Math.random() * cols)
        };
        
        // Make sure food doesn't appear on snake
        let foodOnSnake = true;
        while (foodOnSnake) {
            foodOnSnake = false;
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === food.x && snake[i].y === food.y) {
                    foodOnSnake = true;
                    food = {
                        x: Math.floor(Math.random() * rows),
                        y: Math.floor(Math.random() * cols)
                    };
                    break;
                }
            }
        }
        
        lastFoodTime = time;
    }
    
    // Check special food
    const specialFoodElement = document.querySelector('.special-food');
    if (specialFoodElement) {
        const specialFoodClasses = Array.from(specialFoodElement.classList);
        const specialFoodPos = specialFoodClasses.find(cls => cls.includes(','));
        if (specialFoodPos) {
            const [x, y] = specialFoodPos.split(',').map(Number);
            if (head.x === x && head.y === y) {
                ateSpecialFood = true;
                pointsEarned = 50 * multiplier; // More points for special food
                specialFoodElement.classList.remove('special-food');
                
                // Speed boost effect
                const oldSpeed = currentSpeed;
                currentSpeed = Math.max(80, currentSpeed - 40);
                if (gameInterval) {
                    clearInterval(gameInterval);
                    gameInterval = setInterval(render, currentSpeed);
                }
                
                // Return to normal speed after 5 seconds
                setTimeout(() => {
                    if (gameRunning) {
                        currentSpeed = oldSpeed;
                        if (gameInterval) {
                            clearInterval(gameInterval);
                            gameInterval = setInterval(render, currentSpeed);
                        }
                    }
                }, 5000);
            }
        }
    }
    
    // Update score if food was eaten
    if (ateFood || ateSpecialFood) {
        score += pointsEarned;
        scoreElement.innerText = score;
        
        // Visual feedback for scoring
        scoreElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreElement.style.transform = '';
        }, 200);
    } else {
        // Reset combo if no food eaten
        comboCounter = 0;
        multiplier = 1;
    }

    // Clear the board
    clearBoard();

    if (!ateFood && !ateSpecialFood) {
        snake.pop();
    }

    snake.unshift(head);

    // Draw snake with green head
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head - green
            blocks[`${segment.x},${segment.y}`].classList.add('fill', 'fill-head');
        } else {
            // Body - white
            blocks[`${segment.x},${segment.y}`].classList.add('fill');
        }
    });

    // Draw regular food
    blocks[`${food.x},${food.y}`].classList.add('food');
}

/* START GAME FUNCTION */
function startGameFunction() {
    // Hide all modals
    startModal.style.display = 'none';
    gameOverModal.style.display = 'none';
    
    // Reset game state
    score = 0;
    scoreElement.innerText = score;
    direction = 'right';
    nextDirection = 'right';
    currentSpeed = baseSpeed;
    speedIncreaseCounter = 0;
    comboCounter = 0;
    multiplier = 1;
    
    // Start snake in center
    snake = [{ 
        x: Math.max(2, Math.floor(rows / 2)), 
        y: Math.max(2, Math.floor(cols / 2)) 
    }];
    
    // Generate initial food
    food = {
        x: Math.floor(Math.random() * rows),
        y: Math.floor(Math.random() * cols)
    };
    
    // Make sure food doesn't spawn on snake initially
    while (snake[0].x === food.x && snake[0].y === food.y) {
        food = {
            x: Math.floor(Math.random() * rows),
            y: Math.floor(Math.random() * cols)
        };
    }
    
    // Clear board
    clearBoard();
    
    // Clear any special food
    document.querySelectorAll('.special-food').forEach(f => f.classList.remove('special-food'));
    
    // Start game
    gameRunning = true;
    startTimer();
    
    // Start game loop
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(render, currentSpeed);
    
    // Draw initial state
    render();
}

/* RESTART GAME FUNCTION */
function restartGameFunction() {
    startGameFunction();
}

/* START BUTTON EVENT LISTENER */
startButton.addEventListener('click', startGameFunction);

/* RESTART BUTTON EVENT LISTENER */
restartButton.addEventListener('click', restartGameFunction);

/* KEYBOARD CONTROLS */
document.addEventListener('keydown', (event) => {
    if (!gameRunning) return;
    
    // Prevent default behavior for arrow keys to stop page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }
    
    if (event.key === 'ArrowLeft' && direction !== 'right') nextDirection = 'left';
    else if (event.key === 'ArrowRight' && direction !== 'left') nextDirection = 'right';
    else if (event.key === 'ArrowUp' && direction !== 'down') nextDirection = 'up';
    else if (event.key === 'ArrowDown' && direction !== 'up') nextDirection = 'down';
});

// Initialize the game when page loads
window.addEventListener('load', () => {
    // Show start modal, hide game over modal
    startModal.style.display = 'flex';
    gameOverModal.style.display = 'none';
    
    // Clear board initially
    clearBoard();
});
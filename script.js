// Canvas and context
const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

// Page elements
const landingPage = document.getElementById('landingPage');
const gamePage = document.getElementById('gamePage');
const gameStatus = document.getElementById('gameStatus');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');

// Game variables
let isMobile = window.innerWidth <= 768;
let isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
let canvasWidth, canvasHeight;

// Game objects
const paddle = {
    width: 10,
    height: 80,
    x: 10,
    y: 0,
    dy: 0,
    speed: 6
};

const computer = {
    width: 10,
    height: 80,
    x: 0,
    y: 0,
    dy: 0,
    speed: 4
};

const ball = {
    x: 0,
    y: 0,
    radius: 8,
    dx: 5,
    dy: 5,
    speed: 5
};

let player1Score = 0;
let player2Score = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoopId = null;

// Input tracking
const keys = {};
let mouseY = 0;
let touchY = 0;

// ===== RESPONSIVE CANVAS SETUP =====
function setupCanvas() {
    const container = canvas.parentElement;
    
    if (isMobile) {
        // Mobile: 90vw width, maintain aspect ratio
        canvasWidth = Math.min(window.innerWidth - 20, 400);
        canvasHeight = (canvasWidth / 800) * 400; // Maintain 2:1 ratio
    } else if (isTablet) {
        // Tablet: responsive but larger
        canvasWidth = Math.min(window.innerWidth - 40, 600);
        canvasHeight = (canvasWidth / 800) * 400;
    } else {
        // Desktop: standard size
        canvasWidth = 800;
        canvasHeight = 400;
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Update game object sizes based on canvas
    paddle.width = canvasWidth * 0.012;
    paddle.height = canvasHeight * 0.2;
    computer.width = canvasWidth * 0.012;
    computer.height = canvasHeight * 0.2;
    ball.radius = canvasWidth * 0.01;
    
    // Reset positions
    paddle.x = 10;
    paddle.y = canvasHeight / 2 - paddle.height / 2;
    computer.x = canvasWidth - paddle.width - 10;
    computer.y = canvasHeight / 2 - computer.height / 2;
    
    resetBall();
}

// ===== EVENT LISTENERS =====
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        if (gameRunning) {
            togglePause();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Mouse control
canvas.addEventListener('mousemove', (e) => {
    if (!isMobile) {
        const rect = canvas.getBoundingClientRect();
        mouseY = e.clientY - rect.top;
        paddle.y = Math.max(0, Math.min(canvasHeight - paddle.height, mouseY - paddle.height / 2));
    }
});

// Touch control
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isMobile) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        touchY = touch.clientY - rect.top;
        paddle.y = Math.max(0, Math.min(canvasHeight - paddle.height, touchY - paddle.height / 2));
    }
}, { passive: false });

// Mobile button controls
if (upBtn) {
    upBtn.addEventListener('touchstart', () => {
        keys['arrowup'] = true;
    });
    upBtn.addEventListener('touchend', () => {
        keys['arrowup'] = false;
    });
    upBtn.addEventListener('mousedown', () => {
        keys['arrowup'] = true;
    });
    upBtn.addEventListener('mouseup', () => {
        keys['arrowup'] = false;
    });
}

if (downBtn) {
    downBtn.addEventListener('touchstart', () => {
        keys['arrowdown'] = true;
    });
    downBtn.addEventListener('touchend', () => {
        keys['arrowdown'] = false;
    });
    downBtn.addEventListener('mousedown', () => {
        keys['arrowdown'] = true;
    });
    downBtn.addEventListener('mouseup', () => {
        keys['arrowdown'] = false;
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    if (gameRunning) {
        setupCanvas();
    }
});

// ===== GAME FUNCTIONS =====
function startGame() {
    // Update responsive state
    isMobile = window.innerWidth <= 768;
    isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    
    // Hide landing, show game
    landingPage.classList.remove('active');
    gamePage.classList.add('active');
    
    // Setup canvas
    setupCanvas();
    
    // Reset game
    player1Score = 0;
    player2Score = 0;
    updateScore();
    resetBall();
    
    gameRunning = true;
    gamePaused = false;
    
    // Start game loop
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    gameLoop();
}

function goToLanding() {
    gameRunning = false;
    gamePaused = false;
    
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    
    gamePage.classList.remove('active');
    landingPage.classList.add('active');
    
    // Clear input states
    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });
}

function togglePause() {
    gamePaused = !gamePaused;
    gameStatus.textContent = gamePaused ? 'Game PAUSED - Press SPACEBAR to resume' : 'Game Running - Press SPACEBAR to pause';
}

function updateScore() {
    document.getElementById('player1Score').textContent = player1Score;
    document.getElementById('player2Score').textContent = player2Score;
}

function resetBall() {
    ball.x = canvasWidth / 2;
    ball.y = canvasHeight / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() - 0.5) * 6;
}

// ===== UPDATE FUNCTION =====
function update() {
    if (!gameRunning || gamePaused) return;

    // Player paddle control
    if (keys['arrowup'] || keys['w']) {
        paddle.y = Math.max(0, paddle.y - paddle.speed);
    }
    if (keys['arrowdown'] || keys['s']) {
        paddle.y = Math.min(canvasHeight - paddle.height, paddle.y + paddle.speed);
    }

    // Computer AI - follows ball
    const computerCenter = computer.y + computer.height / 2;
    const deadzone = canvasHeight * 0.1;
    
    if (computerCenter < ball.y - deadzone) {
        computer.y = Math.min(canvasHeight - computer.height, computer.y + computer.speed);
    } else if (computerCenter > ball.y + deadzone) {
        computer.y = Math.max(0, computer.y - computer.speed);
    }

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvasHeight) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(canvasHeight - ball.radius, ball.y));
    }

    // Ball collision with player paddle
    if (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y > paddle.y &&
        ball.y < paddle.y + paddle.height &&
        ball.dx < 0
    ) {
        ball.dx = -ball.dx;
        ball.x = paddle.x + paddle.width + ball.radius;
        ball.dy += (ball.y - (paddle.y + paddle.height / 2)) * 0.15;
    }

    // Ball collision with computer paddle
    if (
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height &&
        ball.dx > 0
    ) {
        ball.dx = -ball.dx;
        ball.x = computer.x - ball.radius;
        ball.dy += (ball.y - (computer.y + computer.height / 2)) * 0.15;
    }

    // Score points
    if (ball.x - ball.radius < 0) {
        player2Score++;
        updateScore();
        resetBall();
    }
    if (ball.x + ball.radius > canvasWidth) {
        player1Score++;
        updateScore();
        resetBall();
    }

    // Cap ball speed
    const maxSpeed = canvasWidth * 0.015;
    ball.dx = Math.max(-maxSpeed, Math.min(maxSpeed, ball.dx));
    ball.dy = Math.max(-maxSpeed, Math.min(maxSpeed, ball.dy));
}

// ===== DRAW FUNCTION =====
function draw() {
    // Clear canvas
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw center line (dashed)
    context.strokeStyle = '#00ff00';
    context.setLineDash([5, 15]);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(canvasWidth / 2, 0);
    context.lineTo(canvasWidth / 2, canvasHeight);
    context.stroke();
    context.setLineDash([]);

    // Draw player paddle
    context.fillStyle = '#00ff00';
    context.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw computer paddle
    context.fillStyle = '#ff00ff';
    context.fillRect(computer.x, computer.y, computer.width, computer.height);

    // Draw ball with glow effect
    context.shadowColor = '#ffff00';
    context.shadowBlur = 10;
    context.fillStyle = '#ffff00';
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;

    // Draw border
    context.strokeStyle = '#00ff00';
    context.lineWidth = 2;
    context.strokeRect(0, 0, canvasWidth, canvasHeight);

    // Draw pause indicator
    if (gamePaused) {
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        context.fillStyle = '#00ff00';
        context.font = `${canvasHeight * 0.15}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('PAUSED', canvasWidth / 2, canvasHeight / 2);
    }
}

// ===== GAME LOOP =====
function gameLoop() {
    update();
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Initialize when page loads
window.addEventListener('load', () => {
    setupCanvas();
});
const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

// Game objects
const paddle = {
    width: 10,
    height: 80,
    x: 10,
    y: canvas.height / 2 - 40,
    dy: 0,
    speed: 6
};

const computer = {
    width: 10,
    height: 80,
    x: canvas.width - 20,
    y: canvas.height / 2 - 40,
    dy: 0,
    speed: 4
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    dx: 5,
    dy: 5,
    speed: 5
};

let player1Score = 0;
let player2Score = 0;
let gameRunning = true;

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        resetGame();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mouse input
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    paddle.y = Math.max(0, Math.min(canvas.height - paddle.height, mouseY - paddle.height / 2));
});

// Update game state
function update() {
    if (!gameRunning) return;

    // Player paddle control (arrow keys + mouse)
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        paddle.y = Math.max(0, paddle.y - paddle.speed);
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        paddle.y = Math.min(canvas.height - paddle.height, paddle.y + paddle.speed);
    }

    // Computer AI - follows ball
    const computerCenter = computer.y + computer.height / 2;
    if (computerCenter < ball.y - 35) {
        computer.y = Math.min(canvas.height - computer.height, computer.y + computer.speed);
    } else if (computerCenter > ball.y + 35) {
        computer.y = Math.max(0, computer.y - computer.speed);
    }

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
    }

    // Ball collision with paddles
    if (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y > paddle.y &&
        ball.y < paddle.y + paddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = paddle.x + paddle.width + ball.radius;
        // Add spin based on where ball hits paddle
        ball.dy += (ball.y - (paddle.y + paddle.height / 2)) * 0.1;
    }

    if (
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computer.x - ball.radius;
        // Add spin based on where ball hits paddle
        ball.dy += (ball.y - (computer.y + computer.height / 2)) * 0.1;
    }

    // Score points
    if (ball.x - ball.radius < 0) {
        player2Score++;
        updateScore();
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        player1Score++;
        updateScore();
        resetBall();
    }

    // Cap ball speed
    const maxSpeed = 8;
    ball.dx = Math.max(-maxSpeed, Math.min(maxSpeed, ball.dx));
    ball.dy = Math.max(-maxSpeed, Math.min(maxSpeed, ball.dy));
}

// Draw everything
function draw() {
    // Clear canvas
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    context.strokeStyle = '#00ff00';
    context.setLineDash([5, 15]);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(canvas.width / 2, 0);
    context.lineTo(canvas.width / 2, canvas.height);
    context.stroke();
    context.setLineDash([]);

    // Draw player paddle
    context.fillStyle = '#00ff00';
    context.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw computer paddle
    context.fillStyle = '#ff00ff';
    context.fillRect(computer.x, computer.y, computer.width, computer.height);

    // Draw ball
    context.fillStyle = '#ffff00';
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fill();

    // Draw border
    context.strokeStyle = '#00ff00';
    context.lineWidth = 2;
    context.strokeRect(0, 0, canvas.width, canvas.height);
}

// Update score display
function updateScore() {
    document.getElementById('player1Score').textContent = player1Score;
    document.getElementById('player2Score').textContent = player2Score;
}

// Reset ball position
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() - 0.5) * 6;
}

// Reset entire game
function resetGame() {
    player1Score = 0;
    player2Score = 0;
    updateScore();
    resetBall();
    paddle.y = canvas.height / 2 - 40;
    computer.y = canvas.height / 2 - 40;
    gameRunning = true;
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
updateScore();
gameLoop();

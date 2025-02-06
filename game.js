const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 画像の読み込み
const ballImage = new Image();
ballImage.src = 'assets/ball.png';
const backgroundImage = new Image();
backgroundImage.src = 'assets/background.png';
const enemyImage = new Image();
enemyImage.src = 'assets/enemy.png';

// ゲーム設定
const ballRadius = 10;
const paddleHeight = 10;
const paddleWidth = 75;
const brickRowCount = 15;
const brickColumnCount = 20;
const brickWidth = 40;
const brickHeight = 20;
const brickPadding = 2;
const brickOffsetTop = 30;
const brickOffsetLeft = 0;

// 難易度設定
const difficultySettings = {
    easy: {
        ballSpeed: 4,
        paddleWidth: 100,
        lives: 5,
        speedIncrease: 0.2,
        enemyCount: 0
    },
    normal: {
        ballSpeed: 5,
        paddleWidth: 75,
        lives: 3,
        speedIncrease: 0.3,
        enemyCount: 2
    },
    hard: {
        ballSpeed: 6,
        paddleWidth: 50,
        lives: 2,
        speedIncrease: 0.4,
        enemyCount: 4
    }
};

// ゲーム状態
let score = 0;
let level = 1;
let lives = 3;
let gameStarted = false;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 5;
let dy = -5;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
let currentDifficulty = 'normal';
let bricks = [];
let enemies = [];
let animationId = null;

// キーボードイベントのリスナー
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

// 難易度の取得
function getDifficulty() {
    return document.getElementById('difficulty').value;
}

// ゲーム初期化
function initGame() {
    // アニメーションをキャンセル
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    currentDifficulty = getDifficulty();
    const settings = difficultySettings[currentDifficulty];
    
    lives = settings.lives;
    dx = settings.ballSpeed;
    dy = -settings.ballSpeed;
    paddleWidth = settings.paddleWidth;
    paddleX = (canvas.width - paddleWidth) / 2;
    x = canvas.width / 2;
    y = canvas.height - 30;
    score = 0;
    level = 1;
    gameStarted = false;
    
    initBricks();
    initEnemies();
    updateUI();

    // 初期画面を描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBricks();
    drawBall();
    drawPaddle();
    drawLives();
}

// お邪魔キャラクター
class Enemy {
    constructor() {
        this.width = 30;
        this.height = 30;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = Math.random() * (canvas.height / 2);
        this.dx = (Math.random() - 0.5) * 4;
        this.dy = (Math.random() - 0.5) * 4;
    }

    move() {
        if (this.x + this.dx > canvas.width - this.width || this.x + this.dx < 0) {
            this.dx = -this.dx;
        }
        if (this.y + this.dy > canvas.height / 2 || this.y + this.dy < 0) {
            this.dy = -this.dy;
        }
        this.x += this.dx;
        this.y += this.dy;
    }

    draw() {
        if (enemyImage.complete) {
            ctx.drawImage(enemyImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    checkCollision(ballX, ballY) {
        return (ballX > this.x && 
                ballX < this.x + this.width && 
                ballY > this.y && 
                ballY < this.y + this.height);
    }
}

// ブロックの初期化
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const health = Math.floor(r / 3) + 1; // 上の行ほど壊れやすい
            bricks[c][r] = { 
                x: 0, 
                y: 0, 
                status: 1,
                health: health,
                maxHealth: health
            };
        }
    }
}

// 敵の初期化
function initEnemies() {
    enemies = [];
    const enemyCount = difficultySettings[currentDifficulty].enemyCount;
    for (let i = 0; i < enemyCount; i++) {
        enemies.push(new Enemy());
    }
}

// UI更新
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
}

// 描画関数
function drawBall() {
    if (ballImage.complete) {
        ctx.drawImage(
            ballImage,
            x - ballRadius,  
            y - ballRadius,  
            ballRadius * 2,  
            ballRadius * 2   
        );
    } else {
        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.stroke();
        ctx.closePath();
    }
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    const gradient = ctx.createLinearGradient(paddleX, canvas.height - paddleHeight, paddleX, canvas.height);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#45a049');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
}

function drawBackground() {
    if (backgroundImage.complete) {
        ctx.globalAlpha = 0.3;  
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }
}

function drawBricks() {
    const totalBricks = brickRowCount * brickColumnCount;
    let remainingBricks = 0;

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                remainingBricks++;
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                
                const healthRatio = bricks[c][r].health / bricks[c][r].maxHealth;
                const hue = healthRatio * 120;
                ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
                
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.stroke();
                ctx.closePath();
            }
        }
    }

    const visibilityRatio = 1 - (remainingBricks / totalBricks);
    if (backgroundImage.complete) {
        ctx.globalAlpha = 0.3 + (visibilityRatio * 0.7);  
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }
}

function drawLives() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`Lives: ${lives}`, canvas.width - 65, 20);
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.health--;
                    
                    if (b.health <= 0) {
                        b.status = 0;
                        score += (level * 10);
                        updateUI();
                        
                        if (checkLevelComplete()) {
                            levelUp();
                        }
                    }
                }
            }
        }
    }
}

function checkLevelComplete() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    return true;
}

function levelUp() {
    level++;
    updateUI();
    
    const settings = difficultySettings[currentDifficulty];
    const speedIncrease = settings.speedIncrease;
    
    if (dx > 0) dx += speedIncrease;
    else dx -= speedIncrease;
    
    if (dy > 0) dy += speedIncrease;
    else dy -= speedIncrease;
    
    initBricks();
    x = canvas.width / 2;
    y = canvas.height - 30;
    paddleX = (canvas.width - paddleWidth) / 2;
}

// ゲームループ
function draw() {
    if (!gameStarted) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBricks();
    drawBall();
    drawPaddle();
    drawLives();

    enemies.forEach(enemy => {
        enemy.move();
        enemy.draw();
        if (enemy.checkCollision(x, y)) {
            dy = -dy;
        }
    });

    collisionDetection();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            const hitPoint = (x - paddleX) / paddleWidth;
            const angle = hitPoint * Math.PI - Math.PI/2;
            const speed = Math.sqrt(dx * dx + dy * dy);
            dx = speed * Math.cos(angle);
            dy = -speed * Math.sin(angle);
        } else {
            lives--;
            updateUI();
            
            if (lives <= 0) {
                alert('ゲームオーバー！\nスコア: ' + score + '\nレベル: ' + level);
                initGame();
                return;
            } else {
                x = canvas.width / 2;
                y = canvas.height - 30;
                dx = difficultySettings[currentDifficulty].ballSpeed;
                dy = -difficultySettings[currentDifficulty].ballSpeed;
                paddleX = (canvas.width - paddleWidth) / 2;
            }
        }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    x += dx;
    y += dy;
    
    animationId = requestAnimationFrame(draw);
}

// ゲーム開始とリスタートの処理
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

document.getElementById('startButton').addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        draw();
    }
});

document.getElementById('restartButton').addEventListener('click', () => {
    initGame();
    gameStarted = true;
    draw();
});

// 難易度変更時の処理
document.getElementById('difficulty').addEventListener('change', () => {
    initGame();
});

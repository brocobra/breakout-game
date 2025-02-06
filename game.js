const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 画像の読み込み
const ballImage = new Image();
ballImage.src = 'assets/ball.png';

// ゲーム設定
const ballRadius = 10;
const paddleHeight = 10;
const paddleWidth = 75;
const brickRowCount = 6;
const brickColumnCount = 10;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

// 難易度設定
const difficultySettings = {
    easy: {
        ballSpeed: 3,
        paddleWidth: 100,
        lives: 5,
        speedIncrease: 0.2
    },
    normal: {
        ballSpeed: 4,
        paddleWidth: 75,
        lives: 3,
        speedIncrease: 0.3
    },
    hard: {
        ballSpeed: 5,
        paddleWidth: 50,
        lives: 2,
        speedIncrease: 0.4
    }
};

// ゲーム状態
let score = 0;
let level = 1;
let lives;
let gameStarted = false;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx;
let dy;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
let currentDifficulty;
let bricks = [];

// 難易度の取得
function getDifficulty() {
    return document.getElementById('difficulty').value;
}

// ゲーム初期化
function initGame() {
    currentDifficulty = getDifficulty();
    const settings = difficultySettings[currentDifficulty];
    
    lives = settings.lives;
    dx = settings.ballSpeed;
    dy = -settings.ballSpeed;
    paddleWidth = settings.paddleWidth;
    paddleX = (canvas.width - paddleWidth) / 2;
    
    initBricks();
    updateUI();
}

// ブロックの初期化
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const health = Math.floor(r / 2) + 1; // 上の行ほど壊れやすい
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

// UI更新
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
}

// キーボードイベントの設定
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('mousemove', mouseMoveHandler);

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

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

// 描画関数
function drawBall() {
    if (ballImage.complete) {
        // 画像を描画（中心座標を基準に描画）
        ctx.drawImage(
            ballImage,
            x - ballRadius,  // X座標（中心から左に半径分）
            y - ballRadius,  // Y座標（中心から上に半径分）
            ballRadius * 2,  // 幅（直径）
            ballRadius * 2   // 高さ（直径）
        );
    } else {
        // 画像が読み込まれていない場合は円を描画（フォールバック）
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

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                
                // 体力に応じて色を変える
                const healthRatio = bricks[c][r].health / bricks[c][r].maxHealth;
                const hue = healthRatio * 120; // 120は緑、0は赤
                ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
                
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
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
    
    // ボールの速度を増加
    const settings = difficultySettings[currentDifficulty];
    const speedIncrease = settings.speedIncrease;
    
    if (dx > 0) dx += speedIncrease;
    else dx -= speedIncrease;
    
    if (dy > 0) dy += speedIncrease;
    else dy -= speedIncrease;
    
    // 次のレベルの準備
    initBricks();
    x = canvas.width / 2;
    y = canvas.height - 30;
    paddleX = (canvas.width - paddleWidth) / 2;
}

function drawLives() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`Lives: ${lives}`, canvas.width - 65, 20);
}

function draw() {
    if (!gameStarted) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawLives();
    collisionDetection();

    // 壁との衝突判定
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            // パドルとの衝突時の跳ね返り角度を計算
            const hitPoint = (x - paddleX) / paddleWidth; // 0-1の値
            const angle = hitPoint * Math.PI - Math.PI/2; // -π/2 から π/2
            const speed = Math.sqrt(dx * dx + dy * dy);
            dx = speed * Math.cos(angle);
            dy = -speed * Math.sin(angle);
        } else {
            lives--;
            if (lives <= 0) {
                alert('ゲームオーバー！\nスコア: ' + score + '\nレベル: ' + level);
                document.location.reload();
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

    // パドルの移動
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
}

// ゲーム開始とリスタートの処理
document.getElementById('startButton').addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        initGame();
        draw();
    }
});

document.getElementById('restartButton').addEventListener('click', () => {
    document.location.reload();
});

// 難易度変更時の処理
document.getElementById('difficulty').addEventListener('change', () => {
    if (!gameStarted) {
        initGame();
    }
});

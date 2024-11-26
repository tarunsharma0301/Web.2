
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const GAME_STATE = {
    MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2
};

let currentState = GAME_STATE.MENU;

let score = 0;
let lives = 3;
let level = 1;
let gameLoop;
let lastAsteroidSpawn = 0;
let asteroidSpawnInterval = 1000;

const ship = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 5,
    color: '#00ff88'
};

const bullets = [];
const asteroids = [];
const particles = [];

const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
};

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);

function handleKeyDown(e) {
    switch(e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
            keys.left = true;
            break;
        case 'arrowright':
        case 'd':
            keys.right = true;
            break;
        case 'arrowup':
        case 'w':
            keys.up = true;
            break;
        case 'arrowdown':
        case 's':
            keys.down = true;
            break;
        case ' ':
            keys.space = true;
            if (currentState === GAME_STATE.PLAYING) {
                shoot();
            }
            break;
    }
}

function handleKeyUp(e) {
    switch(e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
            keys.left = false;
            break;
        case 'arrowright':
        case 'd':
            keys.right = false;
            break;
        case 'arrowup':
        case 'w':
            keys.up = false;
            break;
        case 'arrowdown':
        case 's':
            keys.down = false;
            break;
        case ' ':
            keys.space = false;
            break;
    }
}

function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    ship.x = canvas.width / 2;
    ship.y = canvas.height - 50;
    bullets.length = 0;
    asteroids.length = 0;
    particles.length = 0;
    currentState = GAME_STATE.PLAYING;
    asteroidSpawnInterval = 1000;
    
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    
    if (gameLoop) cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(update);
}

function update() {
    if (currentState !== GAME_STATE.PLAYING) return;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawStars();
    updateShip();
    updateBullets();
    updateAsteroids();
    updateParticles();
    
    if (Date.now() - lastAsteroidSpawn > asteroidSpawnInterval) {
        spawnAsteroid();
        lastAsteroidSpawn = Date.now();
    }
    
    checkCollisions();
    updateHUD();
    
    gameLoop = requestAnimationFrame(update);
}

function drawStars() {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            1,
            1
        );
    }
}

function updateShip() {
    if (keys.left && ship.x > 0) ship.x -= ship.speed;
    if (keys.right && ship.x < canvas.width - ship.width) ship.x += ship.speed;
    if (keys.up && ship.y > 0) ship.y -= ship.speed;
    if (keys.down && ship.y < canvas.height - ship.height) ship.y += ship.speed;
    
    ctx.save();
    ctx.translate(ship.x + ship.width/2, ship.y + ship.height/2);
    
    ctx.beginPath();
    ctx.moveTo(0, -ship.height/2);
    ctx.lineTo(ship.width/2, ship.height/2);
    ctx.lineTo(0, ship.height/3);
    ctx.lineTo(-ship.width/2, ship.height/2);
    ctx.closePath();
    
    ctx.fillStyle = ship.color;
    ctx.fill();
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = ship.color;
    
    ctx.restore();
}

function shoot() {
    bullets.push({
        x: ship.x + ship.width/2,
        y: ship.y,
        width: 4,
        height: 16,
        speed: 10,
        color: '#00ff88'
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        
        if (bullet.y < 0) {
            bullets.splice(i, 1);
            continue;
        }
        
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.fillRect(bullet.x - bullet.width/2, bullet.y, bullet.width, bullet.height);
    }
}

function spawnAsteroid() {
    const radius = Math.random() * 20 + 20;
    asteroids.push({
        x: Math.random() * canvas.width,
        y: -radius,
        radius: radius,
        speed: Math.random() * 2 + 1,
        vertices: generateAsteroidVertices(radius),
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    });
}

function generateAsteroidVertices(radius) {
    const vertices = [];
    const numVertices = 8;
    for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * Math.PI * 2;
        const variance = Math.random() * (radius * 0.4) - (radius * 0.2);
        vertices.push({
            x: Math.cos(angle) * (radius + variance),
            y: Math.sin(angle) * (radius + variance)
        });
    }
    return vertices;
}

function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.y += asteroid.speed;
        asteroid.rotation += asteroid.rotationSpeed;
        
        if (asteroid.y - asteroid.radius > canvas.height) {
            asteroids.splice(i, 1);
            continue;
        }
        
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);
        
        ctx.beginPath();
        ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
        for (let j = 1; j < asteroid.vertices.length; j++) {
            ctx.lineTo(asteroid.vertices[j].x, asteroid.vertices[j].y);
        }
        ctx.closePath();
        
        ctx.fillStyle = '#888';
        ctx.fill();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            const dx = bullet.x - asteroid.x;
            const dy = bullet.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroid.radius) {
                createExplosion(asteroid.x, asteroid.y, '#888');
                asteroids.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                if (score % 100 === 0) {
                    level++;
                    asteroidSpawnInterval = Math.max(200, asteroidSpawnInterval - 100);
                }
                break;
            }
        }
    }
    
    
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        const dx = ship.x + ship.width/2 - asteroid.x;
        const dy = ship.y + ship.height/2 - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < asteroid.radius + ship.width/2) {
            createExplosion(ship.x + ship.width/2, ship.y + ship.height/2, ship.color);
            asteroids.splice(i, 1);
            handleDeath();
            break;
        }
    }
}

function handleDeath() {
    lives--;
    if (lives <= 0) {
        gameOver();
    } else {
        ship.x = canvas.width / 2;
        ship.y = canvas.height - 50;
    }
}

function gameOver() {
    currentState = GAME_STATE.GAME_OVER;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').style.display = 'block';
}

function updateHUD() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('levelValue').textContent = level;
    document.getElementById('livesContainer').textContent = '❤️'.repeat(lives);
}


document.getElementById('menuScreen').style.display = 'block';

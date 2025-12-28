const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const box = 20; // tile size
let score = 0;
let snake = [{x: 9 * box, y: 10 * box}];
let food = { x: Math.floor(Math.random() * 20) * box, y: Math.floor(Math.random() * 20) * box };
let d = "RIGHT";

// Prevent snake from reversing 180 degrees
document.addEventListener("keydown", (e) => {
    if(e.key == "ArrowLeft" && d != "RIGHT") d = "LEFT";
    else if(e.key == "ArrowUp" && d != "DOWN") d = "UP";
    else if(e.key == "ArrowRight" && d != "LEFT") d = "RIGHT";
    else if(e.key == "ArrowDown" && d != "UP") d = "DOWN";
});

function draw() {
    // Draw Checkered Background
    for(let i=0; i<20; i++) {
        for(let j=0; j<20; j++) {
            ctx.fillStyle = (i + j) % 2 == 0 ? "#A2D149" : "#AAD751";
            ctx.fillRect(i*box, j*box, box, box);
        }
    }

    // Draw Snake & Food
    snake.forEach((s, i) => {
        ctx.fillStyle = i == 0 ? "#4E7CF6" : "#5283F3"; // Head vs Body
        ctx.fillRect(s.x, s.y, box, box);
    });
    ctx.fillStyle = "#E7471D"; // Red Apple
    ctx.fillRect(food.x, food.y, box, box);

    // Logic: Move Head
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;
    if(d == "LEFT") snakeX -= box;
    if(d == "UP") snakeY -= box;
    if(d == "RIGHT") snakeX += box;
    if(d == "DOWN") snakeY += box;

    // Logic: Eating Food
    if(snakeX == food.x && snakeY == food.y) {
        score++;
        document.getElementById("score").innerHTML = score;
        food = { x: Math.floor(Math.random() * 20) * box, y: Math.floor(Math.random() * 20) * box };
    } else {
        snake.pop(); // Remove tail if no food eaten
    }

    // Collision Detection
    let newHead = {x: snakeX, y: snakeY};
    if(snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
        clearInterval(game);
        alert("Game Over!");
        location.reload();
    }
    snake.unshift(newHead);
}

function collision(head, array) {
    for(let i = 0; i < array.length; i++) {
        if(head.x == array[i].x && head.y == array[i].y) return true;
    }
    return false;
}

let game = setInterval(draw, 100);

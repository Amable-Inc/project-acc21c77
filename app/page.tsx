'use client';

import { useEffect, useRef, useState } from 'react';

export default function AtariBreakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game variables
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const PADDLE_WIDTH = 100;
    const PADDLE_HEIGHT = 15;
    const BALL_RADIUS = 8;
    const BRICK_ROWS = 6;
    const BRICK_COLS = 10;
    const BRICK_WIDTH = 75;
    const BRICK_HEIGHT = 20;
    const BRICK_PADDING = 5;
    const BRICK_OFFSET_TOP = 60;
    const BRICK_OFFSET_LEFT = 12.5;

    // Game state
    let paddle = {
      x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: CANVAS_HEIGHT - 40,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 8
    };

    let ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: 4,
      dy: -4,
      radius: BALL_RADIUS
    };

    let bricks: { x: number; y: number; status: number; color: string }[][] = [];
    const brickColors = ['#FF6B6B', '#FF8C42', '#FFD93D', '#6BCF7F', '#4D96FF', '#9B59B6'];

    // Initialize bricks
    for (let row = 0; row < BRICK_ROWS; row++) {
      bricks[row] = [];
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks[row][col] = {
          x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
          status: 1,
          color: brickColors[row]
        };
      }
    }

    // Input handling
    let rightPressed = false;
    let leftPressed = false;
    let mouseX = 0;

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
      if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true;
      if (e.key === ' ' && !gameStarted) setGameStarted(true);
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
      if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);

    // Drawing functions
    const drawBall = () => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.closePath();
    };

    const drawPaddle = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    };

    const drawBricks = () => {
      for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
          const brick = bricks[row][col];
          if (brick.status === 1) {
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
          }
        }
      }
    };

    const collisionDetection = () => {
      for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
          const brick = bricks[row][col];
          if (brick.status === 1) {
            if (
              ball.x + ball.radius > brick.x &&
              ball.x - ball.radius < brick.x + BRICK_WIDTH &&
              ball.y + ball.radius > brick.y &&
              ball.y - ball.radius < brick.y + BRICK_HEIGHT
            ) {
              ball.dy = -ball.dy;
              brick.status = 0;
              setScore(prev => prev + 10);

              // Check if all bricks are destroyed
              const allDestroyed = bricks.every(row => row.every(brick => brick.status === 0));
              if (allDestroyed) {
                setGameWon(true);
              }
            }
          }
        }
      }
    };

    const update = () => {
      if (!gameStarted || gameOver || gameWon) return;

      // Move paddle with keyboard
      if (rightPressed && paddle.x < CANVAS_WIDTH - paddle.width) {
        paddle.x += paddle.speed;
      }
      if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
      }

      // Move paddle with mouse
      if (mouseX) {
        paddle.x = mouseX - paddle.width / 2;
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > CANVAS_WIDTH) paddle.x = CANVAS_WIDTH - paddle.width;
      }

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Ball collision with walls
      if (ball.x + ball.radius > CANVAS_WIDTH || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
      }
      if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
      }

      // Ball collision with paddle
      if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        // Add spin based on where ball hits paddle
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = (hitPos - 0.5) * 8;
        ball.dy = -Math.abs(ball.dy);
      }

      // Ball falls below paddle
      if (ball.y + ball.radius > CANVAS_HEIGHT) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
          } else {
            // Reset ball position
            ball.x = CANVAS_WIDTH / 2;
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 4;
            ball.dy = -4;
          }
          return newLives;
        });
      }

      collisionDetection();
    };

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw game elements
      drawBricks();
      drawPaddle();
      drawBall();

      update();
      requestAnimationFrame(draw);
    };

    draw();

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
      canvas.removeEventListener('mousemove', mouseMoveHandler);
    };
  }, [gameStarted, gameOver, gameWon]);

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setGameStarted(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <h1 className="text-6xl font-bold text-white mb-2 font-mono tracking-wider" style={{ textShadow: '0 0 10px #00FF00' }}>
          BREAKOUT
        </h1>
        <p className="text-green-400 text-sm font-mono">CLASSIC ATARI STYLE</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl">
        <div className="flex justify-between mb-4 text-white font-mono text-xl">
          <div className="flex items-center gap-4">
            <span className="text-yellow-400">SCORE: {score}</span>
            <span className="text-red-400">LIVES: {'❤️'.repeat(lives)}</span>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-4 border-green-500 rounded shadow-lg"
            style={{ boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)' }}
          />

          {!gameStarted && !gameOver && !gameWon && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded">
              <div className="text-center">
                <p className="text-white text-2xl font-mono mb-4">
                  Press SPACE or move mouse to start
                </p>
                <p className="text-green-400 font-mono">
                  Use ARROW KEYS or MOUSE to move paddle
                </p>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 rounded">
              <div className="text-center">
                <p className="text-red-500 text-5xl font-bold font-mono mb-4">GAME OVER</p>
                <p className="text-white text-2xl font-mono mb-6">Final Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded font-mono text-xl transition-all"
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}

          {gameWon && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 rounded">
              <div className="text-center">
                <p className="text-green-500 text-5xl font-bold font-mono mb-4">YOU WIN!</p>
                <p className="text-white text-2xl font-mono mb-6">Final Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded font-mono text-xl transition-all"
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-gray-400 text-sm font-mono text-center">
        <p>🎮 Classic Atari Breakout • Destroy all bricks to win!</p>
      </div>
    </div>
  );
}

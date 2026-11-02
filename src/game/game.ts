import { GRID_SIZE, BlockColor } from './constants';
import { ActivePiece, FairPieceBag } from './pieces';
import { GameGrid } from './grid';
import { EffectsManager } from './particles';
import { sound } from './audio';
import { hapticLight, hapticSuccess } from './haptics';
import confetti from 'canvas-confetti';

/**
 * Universal rounded rectangle path helper that works on 100% of Android WebViews
 * without relying on experimental CanvasRenderingContext2D.prototype.roundRect.
 */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[]
) {
  let tl = 0, tr = 0, br = 0, bl = 0;
  if (Array.isArray(r)) {
    tl = r[0] || 0;
    tr = r[1] !== undefined ? r[1] : tl;
    br = r[2] !== undefined ? r[2] : tl;
    bl = r[3] !== undefined ? r[3] : tr;
  } else if (typeof r === 'number') {
    tl = tr = br = bl = r;
  }

  const maxR = Math.min(w, h) / 2;
  tl = Math.max(0, Math.min(tl, maxR));
  tr = Math.max(0, Math.min(tr, maxR));
  br = Math.max(0, Math.min(br, maxR));
  bl = Math.max(0, Math.min(bl, maxR));

  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private effects: EffectsManager;
  private grid: GameGrid;
  private bag: FairPieceBag;

  // Game State
  public score: number = 0;
  public highScore: number = 0;
  public comboStreak: number = 0;
  public isGameOver: boolean = false;
  public isOverdrive: boolean = false;

  // Tray Pieces
  public tray: (ActivePiece | null)[] = [null, null, null];

  // Dragging State
  private draggedIndex: number | null = null;
  private dragPos: { x: number; y: number } = { x: 0, y: 0 };
  private touchOffset: { x: number; y: number } = { x: 0, y: -75 }; // Finger offset so block is visible

  // Layout Dimensions (recomputed on resize)
  private cellSize: number = 40;
  private gridOriginX: number = 0;
  private gridOriginY: number = 0;
  private traySlots: { x: number; y: number; width: number; height: number }[] = [];

  private isRunning: boolean = true;
  private onStateChangeCallback?: () => void;

  constructor(canvas: HTMLCanvasElement, onStateChange?: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.onStateChangeCallback = onStateChange;

    this.effects = new EffectsManager();
    this.grid = new GameGrid(this.effects);
    this.bag = new FairPieceBag();

    this.highScore = parseInt(localStorage.getItem('nbz_highscore') || '0', 10);

    this.initEvents();
    this.resize();
    this.startNewGame();

    // Call resize on next tick to handle mobile WebView flex calculations
    setTimeout(() => this.resize(), 50);
    setTimeout(() => this.resize(), 200);

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  public setOverdriveMode(enabled: boolean) {
    this.isOverdrive = enabled;
    this.startNewGame();
  }

  public startNewGame() {
    this.score = 0;
    this.comboStreak = 0;
    this.isGameOver = false;
    this.grid.reset();
    this.tray = this.bag.generateTray(this.grid.getRawColorMatrix(), this.isOverdrive);
    this.notifyState();
  }

  private notifyState() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback();
    }
  }

  public resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const parent = this.canvas.parentElement;
    let width = parent?.clientWidth || 0;
    let height = parent?.clientHeight || 0;

    if (width <= 0) width = window.innerWidth || 360;
    if (height <= 0) height = window.innerHeight || 640;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Universal transform reset across all Android WebViews
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Compute grid dimensions to fit snugly in viewport
    const maxGridWidth = Math.min(width - 24, 420);
    this.cellSize = Math.floor(maxGridWidth / GRID_SIZE);
    const totalGridPx = this.cellSize * GRID_SIZE;

    this.gridOriginX = Math.floor((width - totalGridPx) / 2);
    // Position grid comfortably below header
    this.gridOriginY = Math.max(16, Math.floor((height - totalGridPx) * 0.28));

    // Position Tray below grid
    const trayY = this.gridOriginY + totalGridPx + 24;
    const slotWidth = Math.floor((width - 32) / 3);
    const availableTrayHeight = height - trayY - 16;
    const slotHeight = Math.max(80, Math.min(130, availableTrayHeight));

    this.traySlots = [
      { x: 16 + slotWidth * 0, y: trayY, width: slotWidth - 4, height: slotHeight },
      { x: 16 + slotWidth * 1, y: trayY, width: slotWidth - 4, height: slotHeight },
      { x: 16 + slotWidth * 2, y: trayY, width: slotWidth - 4, height: slotHeight }
    ];
  }

  private initEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));

    // Mouse / Touch Bindings
    const getPoint = (e: MouseEvent | TouchEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      if ('touches' in e && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      } else if ('clientX' in e) {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
      return null;
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (this.isGameOver) return;
      const pt = getPoint(e);
      if (!pt) return;

      // Check which tray slot was clicked
      for (let i = 0; i < 3; i++) {
        const piece = this.tray[i];
        if (!piece) continue;
        const slot = this.traySlots[i];
        if (
          pt.x >= slot.x &&
          pt.x <= slot.x + slot.width &&
          pt.y >= slot.y &&
          pt.y <= slot.y + slot.height
        ) {
          this.draggedIndex = i;
          this.dragPos = { x: pt.x, y: pt.y };
          sound.playPickup();
          hapticLight();
          e.preventDefault();
          break;
        }
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (this.draggedIndex === null) return;
      const pt = getPoint(e);
      if (!pt) return;
      this.dragPos = { x: pt.x, y: pt.y };
      e.preventDefault();
    };

    const handleEnd = () => {
      if (this.draggedIndex === null) return;
      this.attemptDrop();
      this.draggedIndex = null;
    };

    this.canvas.addEventListener('mousedown', handleStart);
    this.canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    this.canvas.addEventListener('touchstart', handleStart, { passive: false });
    this.canvas.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);
  }

  private getDropTarget(piece: ActivePiece): { row: number; col: number } | null {
    const renderX = this.dragPos.x + this.touchOffset.x;
    const renderY = this.dragPos.y + this.touchOffset.y;

    const matrix = piece.shape.matrix;

    const col = Math.round((renderX - this.gridOriginX) / this.cellSize);
    const row = Math.round((renderY - this.gridOriginY) / this.cellSize);

    if (this.grid.canPlaceAt(matrix, row, col)) {
      return { row, col };
    }
    return null;
  }

  private attemptDrop() {
    if (this.draggedIndex === null) return;
    const piece = this.tray[this.draggedIndex];
    if (!piece) return;

    const target = this.getDropTarget(piece);
    if (target) {
      const result = this.grid.placePiece(
        piece,
        target.row,
        target.col,
        this.comboStreak,
        this.cellSize,
        this.gridOriginX,
        this.gridOriginY
      );

      this.score += result.pointsEarned;
      if (result.linesCleared > 0) {
        this.comboStreak++;
      } else {
        this.comboStreak = 0;
      }

      // High Score update
      if (this.score > this.highScore) {
        const beatPrevious = this.highScore > 0 && this.score - result.pointsEarned <= this.highScore;
        this.highScore = this.score;
        localStorage.setItem('nbz_highscore', String(this.highScore));
        if (beatPrevious) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          hapticSuccess();
        }
      }

      // Consume piece from tray
      this.tray[this.draggedIndex] = null;

      // Refill tray if all 3 are placed
      if (this.tray.every(p => p === null)) {
        this.tray = this.bag.generateTray(this.grid.getRawColorMatrix(), this.isOverdrive);
      }

      this.checkGameOver();
      this.notifyState();
    }
  }

  private checkGameOver() {
    const remaining = this.tray.filter((p): p is ActivePiece => p !== null);
    if (remaining.length === 0) return;

    const matrixGrid = this.grid.getRawColorMatrix();
    const canMove = remaining.some(p => this.bag.canFitAnywhere(p.shape.matrix, matrixGrid));

    if (!canMove) {
      this.isGameOver = true;
      sound.playGameOver();
      this.effects.triggerScreenShake(12);
      this.notifyState();
    }
  }

  private loop() {
    if (!this.isRunning) return;
    try {
      this.update();
      this.render();
    } catch (err) {
      console.error('Render error:', err);
    }
    requestAnimationFrame(this.loop);
  }

  private update() {
    this.effects.update();
  }

  private render() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    // Apply Screen Shake
    const shake = this.effects.getScreenOffset();

    this.ctx.save();
    this.ctx.translate(shake.x, shake.y);

    // OLED Dark Gradient Background
    const bgGrad = this.ctx.createRadialGradient(
      width / 2, this.gridOriginY + (GRID_SIZE * this.cellSize) / 2, 50,
      width / 2, height / 2, width
    );
    bgGrad.addColorStop(0, '#0a0a14');
    bgGrad.addColorStop(1, '#040407');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(-20, -20, width + 40, height + 40);

    // Draw Grid Backplate
    this.renderGrid();

    // Draw Ghost Preview if dragging
    if (this.draggedIndex !== null) {
      const piece = this.tray[this.draggedIndex];
      if (piece) {
        const target = this.getDropTarget(piece);
        if (target) {
          this.renderGhostPiece(piece, target.row, target.col);
        }
      }
    }

    // Draw Tray Slots & Pieces
    this.renderTray();

    // Draw Active Dragged Piece on Top
    if (this.draggedIndex !== null) {
      const piece = this.tray[this.draggedIndex];
      if (piece) {
        const renderX = this.dragPos.x + this.touchOffset.x;
        const renderY = this.dragPos.y + this.touchOffset.y;
        this.renderPieceAt(piece, renderX, renderY, this.cellSize, 1.05);
      }
    }

    // Render Particle Effects & Popups
    this.effects.render(this.ctx);

    this.ctx.restore();
  }

  private renderGrid() {
    const totalPx = GRID_SIZE * this.cellSize;

    // Outer Glow / Border for the 8x8 Board
    this.ctx.save();
    this.ctx.fillStyle = '#080811';
    this.ctx.strokeStyle = '#1a1a2e';
    this.ctx.lineWidth = 2;
    drawRoundRect(this.ctx, this.gridOriginX - 6, this.gridOriginY - 6, totalPx + 12, totalPx + 12, 14);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();

    // Render Individual Cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid.cells[r][c];
        const cellX = this.gridOriginX + c * this.cellSize;
        const cellY = this.gridOriginY + r * this.cellSize;

        if (cell.color) {
          this.renderBlock(cellX, cellY, this.cellSize, cell.color, false, cell.bombMoves);
        } else {
          // Empty slot placeholder
          this.ctx.save();
          this.ctx.fillStyle = '#10101f';
          drawRoundRect(this.ctx, cellX + 2, cellY + 2, this.cellSize - 4, this.cellSize - 4, 6);
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }
  }

  private renderGhostPiece(piece: ActivePiece, startRow: number, startCol: number) {
    const matrix = piece.shape.matrix;
    this.ctx.save();
    this.ctx.globalAlpha = 0.45;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          const x = this.gridOriginX + (startCol + c) * this.cellSize;
          const y = this.gridOriginY + (startRow + r) * this.cellSize;
          this.renderBlock(x, y, this.cellSize, piece.color, true);
        }
      }
    }
    this.ctx.restore();
  }

  private renderTray() {
    const matrixGrid = this.grid.getRawColorMatrix();

    for (let i = 0; i < 3; i++) {
      const slot = this.traySlots[i];
      if (!slot) continue;
      const piece = this.tray[i];

      // Draw subtle slot card
      this.ctx.save();
      this.ctx.fillStyle = '#0b0b14';
      this.ctx.strokeStyle = '#161626';
      this.ctx.lineWidth = 1.5;
      drawRoundRect(this.ctx, slot.x, slot.y, slot.width, slot.height, 12);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      if (piece && this.draggedIndex !== i) {
        const canFit = this.bag.canFitAnywhere(piece.shape.matrix, matrixGrid);
        const matrix = piece.shape.matrix;
        const pRows = matrix.length;
        const pCols = matrix[0].length;

        // Scale piece slightly down to fit comfortably in slot
        const miniCell = Math.min(this.cellSize * 0.65, (slot.width - 24) / pCols, (slot.height - 24) / pRows);
        const pieceW = pCols * miniCell;
        const pieceH = pRows * miniCell;
        const px = slot.x + (slot.width - pieceW) / 2;
        const py = slot.y + (slot.height - pieceH) / 2;

        this.ctx.save();
        if (!canFit) {
          this.ctx.globalAlpha = 0.35;
        }
        this.renderPieceAt(piece, px, py, miniCell, 1);
        this.ctx.restore();
      }
    }
  }

  private renderPieceAt(piece: ActivePiece, x: number, y: number, cellSize: number, scale: number = 1) {
    const matrix = piece.shape.matrix;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          const bx = c * cellSize;
          const by = r * cellSize;
          this.renderBlock(bx, by, cellSize, piece.color, false, piece.movesLeft);
        }
      }
    }
    this.ctx.restore();
  }

  private renderBlock(
    x: number,
    y: number,
    size: number,
    color: BlockColor,
    isGhost: boolean = false,
    bombMoves?: number
  ) {
    const pad = 2;
    const innerSize = size - pad * 2;
    const radius = Math.max(4, size * 0.18);

    this.ctx.save();

    // Outer Glow
    if (!isGhost) {
      this.ctx.shadowColor = color.glow;
      this.ctx.shadowBlur = 10;
    }

    // Main Gradient Fill
    const grad = this.ctx.createLinearGradient(x + pad, y + pad, x + pad, y + pad + innerSize);
    grad.addColorStop(0, color.border);
    grad.addColorStop(1, color.primary);

    this.ctx.fillStyle = grad;
    drawRoundRect(this.ctx, x + pad, y + pad, innerSize, innerSize, radius);
    this.ctx.fill();

    // Inner Specular Highlight (Glass Reflection)
    if (!isGhost) {
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = color.highlight;
      this.ctx.globalAlpha = 0.45;
      drawRoundRect(this.ctx, x + pad + 2, y + pad + 2, innerSize - 4, innerSize * 0.35, [radius, radius, 1, 1]);
      this.ctx.fill();
    }

    // Bomb Countdown Number in Overdrive Mode
    if (bombMoves !== undefined && !isGhost) {
      this.ctx.globalAlpha = 1;
      this.ctx.font = `bold ${Math.round(size * 0.45)}px sans-serif`;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(String(bombMoves), x + size / 2, y + size / 2);
    }

    this.ctx.restore();
  }

  public destroy() {
    this.isRunning = false;
  }
}

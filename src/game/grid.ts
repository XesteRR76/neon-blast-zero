import { GRID_SIZE, BlockColor } from './constants';
import { ActivePiece } from './pieces';
import { EffectsManager } from './particles';
import { sound } from './audio';
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess } from './haptics';

export interface GridCell {
  color: BlockColor | null;
  animScale?: number;
  isClearing?: boolean;
  bombMoves?: number;
}

export interface ClearResult {
  linesCleared: number;
  clearedRows: number[];
  clearedCols: number[];
  pointsEarned: number;
  isBombExploded?: boolean;
}

export class GameGrid {
  public cells: GridCell[][];
  private effects: EffectsManager;

  constructor(effects: EffectsManager) {
    this.effects = effects;
    this.cells = this.createEmptyGrid();
  }

  public createEmptyGrid(): GridCell[][] {
    const grid: GridCell[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: GridCell[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push({ color: null });
      }
      grid.push(row);
    }
    return grid;
  }

  public reset() {
    this.cells = this.createEmptyGrid();
  }

  public getRawColorMatrix(): (BlockColor | null)[][] {
    return this.cells.map(row => row.map(cell => cell.color));
  }

  /**
   * Can a piece shape matrix fit at grid coordinate (targetRow, targetCol)?
   */
  public canPlaceAt(matrix: number[][], targetRow: number, targetCol: number): boolean {
    const pRows = matrix.length;
    const pCols = matrix[0].length;

    if (targetRow < 0 || targetCol < 0 || targetRow + pRows > GRID_SIZE || targetCol + pCols > GRID_SIZE) {
      return false;
    }

    for (let r = 0; r < pRows; r++) {
      for (let c = 0; c < pCols; c++) {
        if (matrix[r][c] === 1) {
          if (this.cells[targetRow + r][targetCol + c].color !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Places a piece at grid coordinate (targetRow, targetCol)
   */
  public placePiece(
    piece: ActivePiece,
    targetRow: number,
    targetCol: number,
    comboStreak: number,
    cellPxSize: number,
    gridOriginX: number,
    gridOriginY: number
  ): ClearResult {
    const matrix = piece.shape.matrix;
    let blockCount = 0;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          this.cells[targetRow + r][targetCol + c] = {
            color: piece.color,
            bombMoves: piece.isBomb ? piece.movesLeft : undefined
          };
          blockCount++;
        }
      }
    }

    // Check full rows and columns
    const fullRows: number[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      if (this.cells[r].every(cell => cell.color !== null)) {
        fullRows.push(r);
      }
    }

    const fullCols: number[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let full = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (this.cells[r][c].color === null) {
          full = false;
          break;
        }
      }
      if (full) {
        fullCols.push(c);
      }
    }

    const linesCleared = fullRows.length + fullCols.length;
    let points = blockCount * 10;

    if (linesCleared > 0) {
      // Combo formula: base points * lines * combo multiplier
      const lineMultiplier = linesCleared === 1 ? 100 : linesCleared === 2 ? 300 : linesCleared === 3 ? 600 : 1000;
      const comboMultiplier = Math.max(1, comboStreak);
      points += lineMultiplier * comboMultiplier;

      // Spawn particles and clear cells
      const clearedSet = new Set<string>();

      fullRows.forEach(r => {
        for (let c = 0; c < GRID_SIZE; c++) {
          clearedSet.add(`${r},${c}`);
        }
      });

      fullCols.forEach(c => {
        for (let r = 0; r < GRID_SIZE; r++) {
          clearedSet.add(`${r},${c}`);
        }
      });

      clearedSet.forEach(coord => {
        const [r, c] = coord.split(',').map(Number);
        const cell = this.cells[r][c];
        if (cell.color) {
          const posX = gridOriginX + c * cellPxSize;
          const posY = gridOriginY + r * cellPxSize;
          this.effects.spawnBlockClearParticles(posX, posY, cellPxSize, cell.color, 7);
        }
        this.cells[r][c] = { color: null };
      });

      // Sound & Screen Shake
      this.effects.triggerScreenShake(linesCleared * 3 + Math.min(comboStreak * 1.5, 10));
      sound.playClear(comboStreak, linesCleared);

      if (linesCleared >= 3 || comboStreak >= 4) {
        hapticHeavy();
      } else if (linesCleared >= 2) {
        hapticMedium();
      } else {
        hapticLight();
      }

      // Visual floating text
      const midX = gridOriginX + (GRID_SIZE * cellPxSize) / 2;
      const midY = gridOriginY + (GRID_SIZE * cellPxSize) / 2;
      if (comboStreak > 1) {
        this.effects.spawnFloatingText(`COMBO x${comboStreak}!`, midX, midY - 20, '#ff007f');
      }
      if (linesCleared >= 3) {
        this.effects.spawnFloatingText(`MEGA BLAST! +${points}`, midX, midY + 25, '#00f3ff');
        hapticSuccess();
      } else {
        this.effects.spawnFloatingText(`+${points}`, midX, midY + 25, '#10b981');
      }
    } else {
      sound.playPlace();
      hapticLight();
    }

    return {
      linesCleared,
      clearedRows: fullRows,
      clearedCols: fullCols,
      pointsEarned: points
    };
  }
}

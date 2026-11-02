import { SHAPES, NEON_COLORS, PieceShape, BlockColor, GRID_SIZE } from './constants';

export interface ActivePiece {
  id: string;
  shape: PieceShape;
  color: BlockColor;
  isBomb?: boolean;
  movesLeft?: number; // For overdrive bomb mechanic
}

export class FairPieceBag {
  private totalWeight: number;

  constructor() {
    this.totalWeight = SHAPES.reduce((sum, s) => sum + s.weight, 0);
  }

  /**
   * Randomly selects a shape weighted by frequency
   */
  public getRandomShape(): PieceShape {
    let rand = Math.random() * this.totalWeight;
    for (const shape of SHAPES) {
      if (rand < shape.weight) {
        return shape;
      }
      rand -= shape.weight;
    }
    return SHAPES[0];
  }

  public getRandomColor(): BlockColor {
    return NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
  }

  /**
   * Generates a 3-piece tray.
   * Ensures that at least one of the 3 pieces can fit on the current board!
   */
  public generateTray(grid: (BlockColor | null)[][], isOverdrive: boolean = false): ActivePiece[] {
    const tray: ActivePiece[] = [];

    for (let i = 0; i < 3; i++) {
      let shape = this.getRandomShape();
      const color = this.getRandomColor();

      // Overdrive: 10% chance of a Bomb block that must be cleared within 8 moves
      const isBomb = isOverdrive && Math.random() < 0.12;

      tray.push({
        id: `piece_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        shape,
        color,
        isBomb,
        movesLeft: isBomb ? 8 : undefined
      });
    }

    // Check if at least one piece can be placed
    const anyFit = tray.some(p => this.canFitAnywhere(p.shape.matrix, grid));
    if (!anyFit) {
      // Replace the first piece with a 1x1 dot or 1x2 bar to guarantee solvability
      const saviorShape = Math.random() > 0.5 
        ? SHAPES.find(s => s.id === 'dot')! 
        : SHAPES.find(s => s.id === 'i2_h')!;
      tray[0] = {
        id: `piece_${Date.now()}_savior`,
        shape: saviorShape,
        color: this.getRandomColor()
      };
    }

    return tray;
  }

  /**
   * Checks if matrix can fit anywhere in 8x8 grid
   */
  public canFitAnywhere(matrix: number[][], grid: (BlockColor | null)[][]): boolean {
    const pRows = matrix.length;
    const pCols = matrix[0].length;

    for (let r = 0; r <= GRID_SIZE - pRows; r++) {
      for (let c = 0; c <= GRID_SIZE - pCols; c++) {
        let fits = true;
        for (let pr = 0; pr < pRows; pr++) {
          for (let pc = 0; pc < pCols; pc++) {
            if (matrix[pr][pc] === 1 && grid[r + pr][c + pc] !== null) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }
        if (fits) return true;
      }
    }
    return false;
  }
}

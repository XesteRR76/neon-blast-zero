// 8x8 Grid Configuration and Aesthetic Palette
export const GRID_SIZE = 8;

export interface BlockColor {
  name: string;
  primary: string;
  glow: string;
  border: string;
  highlight: string;
}

export const NEON_COLORS: BlockColor[] = [
  {
    name: 'cyan',
    primary: '#00f3ff',
    glow: 'rgba(0, 243, 255, 0.4)',
    border: '#55f7ff',
    highlight: '#d5ffff'
  },
  {
    name: 'magenta',
    primary: '#ff007f',
    glow: 'rgba(255, 0, 127, 0.4)',
    border: '#ff4da6',
    highlight: '#ffd6eb'
  },
  {
    name: 'lime',
    primary: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    border: '#34d399',
    highlight: '#a7f3d0'
  },
  {
    name: 'amber',
    primary: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    border: '#fbbf24',
    highlight: '#fef3c7'
  },
  {
    name: 'purple',
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
    border: '#c084fc',
    highlight: '#f3e8ff'
  },
  {
    name: 'electric',
    primary: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.4)',
    border: '#60a5fa',
    highlight: '#dbeafe'
  }
];

export interface PieceShape {
  id: string;
  name: string;
  matrix: number[][]; // 2D array where 1 = filled
  weight: number;     // Weight for random generator
}

export const SHAPES: PieceShape[] = [
  // 1x1 Dot
  { id: 'dot', name: '1x1', matrix: [[1]], weight: 6 },
  
  // 1x2 and 2x1
  { id: 'i2_h', name: '1x2', matrix: [[1, 1]], weight: 8 },
  { id: 'i2_v', name: '2x1', matrix: [[1], [1]], weight: 8 },

  // 1x3 and 3x1
  { id: 'i3_h', name: '1x3', matrix: [[1, 1, 1]], weight: 7 },
  { id: 'i3_v', name: '3x1', matrix: [[1], [1], [1]], weight: 7 },

  // 1x4 and 4x1
  { id: 'i4_h', name: '1x4', matrix: [[1, 1, 1, 1]], weight: 5 },
  { id: 'i4_v', name: '4x1', matrix: [[1], [1], [1], [1]], weight: 5 },

  // 1x5 and 5x1
  { id: 'i5_h', name: '1x5', matrix: [[1, 1, 1, 1, 1]], weight: 3 },
  { id: 'i5_v', name: '5x1', matrix: [[1], [1], [1], [1], [1]], weight: 3 },

  // 2x2 Square
  { id: 'o2', name: '2x2', matrix: [[1, 1], [1, 1]], weight: 7 },

  // 3x3 Square (rare)
  { id: 'o3', name: '3x3', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], weight: 2 },

  // L-shapes (2x2 corner)
  { id: 'corner_tl', name: 'Corner TL', matrix: [[1, 1], [1, 0]], weight: 6 },
  { id: 'corner_tr', name: 'Corner TR', matrix: [[1, 1], [0, 1]], weight: 6 },
  { id: 'corner_bl', name: 'Corner BL', matrix: [[1, 0], [1, 1]], weight: 6 },
  { id: 'corner_br', name: 'Corner BR', matrix: [[0, 1], [1, 1]], weight: 6 },

  // Big L-shapes (3x3 corner)
  { id: 'big_l_tl', name: 'Big L TL', matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], weight: 4 },
  { id: 'big_l_tr', name: 'Big L TR', matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], weight: 4 },
  { id: 'big_l_bl', name: 'Big L BL', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], weight: 4 },
  { id: 'big_l_br', name: 'Big L BR', matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], weight: 4 },

  // T-shapes
  { id: 't_down', name: 'T Down', matrix: [[1, 1, 1], [0, 1, 0]], weight: 4 },
  { id: 't_up', name: 'T Up', matrix: [[0, 1, 0], [1, 1, 1]], weight: 4 },
  { id: 't_left', name: 'T Left', matrix: [[1, 0], [1, 1], [1, 0]], weight: 4 },
  { id: 't_right', name: 'T Right', matrix: [[0, 1], [1, 1], [0, 1]], weight: 4 },

  // S and Z shapes
  { id: 's_h', name: 'S Horiz', matrix: [[0, 1, 1], [1, 1, 0]], weight: 4 },
  { id: 'z_h', name: 'Z Horiz', matrix: [[1, 1, 0], [0, 1, 1]], weight: 4 }
];

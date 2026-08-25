import type { NodeStyleT, EdgeStyleT, Shape } from './types';

export const PRESET_QUESTIONS = ['具体的には？', 'なぜ？', '逆から見ると？'];

export const COLOR_PRESETS = [
  '#000000',
  '#ffffff',
  '#e03131',
  '#f08c00',
  '#2f9e44',
  '#1971c2',
  '#7048e8',
  '#495057',
  '#f8f9fa',
];

export const FONT_SIZE_PRESETS: { label: string; value: number }[] = [
  { label: '小', value: 12 },
  { label: '中', value: 16 },
  { label: '大', value: 22 },
  { label: '特大', value: 30 },
];

export const SHAPE_OPTIONS: { label: string; value: Shape }[] = [
  { label: '四角形', value: 'rectangle' },
  { label: '角丸四角形', value: 'rounded' },
  { label: '円・楕円', value: 'ellipse' },
  { label: 'ひし形', value: 'diamond' },
  { label: '枠なし', value: 'none' },
];

export const DEFAULT_NODE_STYLE: NodeStyleT = {
  fontSize: 16,
  bold: false,
  textColor: '#1a1a1a',
  shape: 'rounded',
  borderColor: '#495057',
  borderWidth: 2,
  fillColor: '#ffffff',
  width: 160,
  height: 80,
  autoResize: true,
};

export const DEFAULT_EDGE_STYLE: EdgeStyleT = {
  color: '#666666',
  thickness: 2,
  direction: 'one-way',
};

export function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type Shape = 'rectangle' | 'rounded' | 'ellipse' | 'diamond' | 'none';
export type EdgeDirection = 'one-way' | 'two-way';
export type QuestionType = 'preset' | 'custom';

export interface NodeStyleT {
  fontSize: number;
  bold: boolean;
  textColor: string;
  shape: Shape;
  borderColor: string;
  borderWidth: number;
  fillColor: string;
  width: number;
  height: number;
  autoResize: boolean;
}

export interface MapNodeData {
  text: string;
  style: NodeStyleT;
  [key: string]: unknown;
}

export interface EdgeStyleT {
  color: string;
  thickness: number;
  direction: EdgeDirection;
}

export interface EdgeQuestion {
  type: QuestionType;
  value: string;
}

export interface MapEdgeData {
  style: EdgeStyleT;
  question: EdgeQuestion | null;
  [key: string]: unknown;
}

export interface ProjectRecord {
  id: string;
  title: string;
  syncCode: string;
  createdAt: number;
  updatedAt: number;
  customQuestions: string[];
}

export interface NodeRecord {
  id: string;
  projectId: string;
  x: number;
  y: number;
  text: string;
  style: NodeStyleT;
  updatedAt: number;
}

export interface EdgeRecord {
  id: string;
  projectId: string;
  source: string;
  target: string;
  style: EdgeStyleT;
  question: EdgeQuestion | null;
  updatedAt: number;
}

import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react';

const PADDING = 60;

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

async function captureMap(nodes: Node[], filename: string, format: 'png' | 'svg') {
  const viewportEl = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (!viewportEl || nodes.length === 0) return;

  const bounds = getNodesBounds(nodes);
  const width = bounds.width + PADDING * 2;
  const height = bounds.height + PADDING * 2;
  const { x, y, zoom } = getViewportForBounds(bounds, width, height, 0.2, 2, PADDING);

  const options = {
    backgroundColor: '#ffffff',
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
  };

  const dataUrl = format === 'png' ? await toPng(viewportEl, options) : await toSvg(viewportEl, options);
  download(dataUrl, filename);
}

export function exportPng(nodes: Node[], title: string) {
  return captureMap(nodes, `${title || 'mindmap'}.png`, 'png');
}

export function exportSvg(nodes: Node[], title: string) {
  return captureMap(nodes, `${title || 'mindmap'}.svg`, 'svg');
}

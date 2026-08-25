import { useState } from 'react';
import { useMapStore } from '../store/mapStore';
import { COLOR_PRESETS, FONT_SIZE_PRESETS, SHAPE_OPTIONS, PRESET_QUESTIONS } from '../constants';
import type { EdgeDirection, Shape } from '../types';

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <div className="color-field">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <div className="color-presets">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              className="color-swatch"
              style={{ background: c, outline: c === value ? '2px solid var(--accent)' : undefined }}
              onClick={() => onChange(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NodePanel({ nodeId }: { nodeId: string }) {
  const node = useMapStore((s) => s.nodes.find((n) => n.id === nodeId));
  const updateNodeStyle = useMapStore((s) => s.updateNodeStyle);
  const deleteNode = useMapStore((s) => s.deleteNode);
  if (!node) return null;
  const { style } = node.data;

  return (
    <div className="panel">
      <h3>ノードのスタイル</h3>

      <div className="field-row">
        <label>フォントサイズ</label>
        <div className="button-group">
          {FONT_SIZE_PRESETS.map((p) => (
            <button
              key={p.label}
              className={style.fontSize === p.value ? 'active' : ''}
              onClick={() => updateNodeStyle(nodeId, { fontSize: p.value })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          className="small-number"
          value={style.fontSize}
          onChange={(e) => updateNodeStyle(nodeId, { fontSize: Number(e.target.value) || 1 })}
        />
        <span className="unit">px</span>
      </div>

      <div className="field-row">
        <label>
          <input
            type="checkbox"
            checked={style.bold}
            onChange={(e) => updateNodeStyle(nodeId, { bold: e.target.checked })}
          />
          太字
        </label>
      </div>

      <ColorField label="文字色" value={style.textColor} onChange={(v) => updateNodeStyle(nodeId, { textColor: v })} />

      <div className="field-row">
        <label>枠の形状</label>
        <select value={style.shape} onChange={(e) => updateNodeStyle(nodeId, { shape: e.target.value as Shape })}>
          {SHAPE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {style.shape !== 'none' && (
        <>
          <ColorField
            label="枠線の色"
            value={style.borderColor}
            onChange={(v) => updateNodeStyle(nodeId, { borderColor: v })}
          />
          <div className="field-row">
            <label>枠線の太さ</label>
            <input
              type="number"
              className="small-number"
              min={0}
              value={style.borderWidth}
              onChange={(e) => updateNodeStyle(nodeId, { borderWidth: Number(e.target.value) || 0 })}
            />
            <span className="unit">px</span>
          </div>
          <ColorField
            label="塗りつぶし色"
            value={style.fillColor}
            onChange={(v) => updateNodeStyle(nodeId, { fillColor: v })}
          />
        </>
      )}

      <div className="field-row">
        <label>
          <input
            type="checkbox"
            checked={style.autoResize}
            onChange={(e) => updateNodeStyle(nodeId, { autoResize: e.target.checked })}
          />
          テキスト量に応じて自動リサイズ
        </label>
      </div>
      {!style.autoResize && (
        <div className="field-row">
          <label>サイズ</label>
          <input
            type="number"
            className="small-number"
            value={style.width}
            onChange={(e) => updateNodeStyle(nodeId, { width: Number(e.target.value) || 1 })}
          />
          <span className="unit">×</span>
          <input
            type="number"
            className="small-number"
            value={style.height}
            onChange={(e) => updateNodeStyle(nodeId, { height: Number(e.target.value) || 1 })}
          />
        </div>
      )}

      <button className="danger" onClick={() => deleteNode(nodeId)}>
        このノードを削除
      </button>
    </div>
  );
}

function EdgePanel({ edgeId }: { edgeId: string }) {
  const edge = useMapStore((s) => s.edges.find((e) => e.id === edgeId));
  const updateEdgeStyle = useMapStore((s) => s.updateEdgeStyle);
  const updateEdgeQuestion = useMapStore((s) => s.updateEdgeQuestion);
  const deleteEdge = useMapStore((s) => s.deleteEdge);
  const project = useMapStore((s) => s.project);
  if (!edge || !edge.data) return null;
  const { style, question } = edge.data;
  const allQuestions = [...PRESET_QUESTIONS, ...(project?.customQuestions ?? [])];

  return (
    <div className="panel">
      <h3>矢印のスタイル</h3>
      <ColorField label="色" value={style.color} onChange={(v) => updateEdgeStyle(edgeId, { color: v })} />
      <div className="field-row">
        <label>太さ</label>
        <input
          type="number"
          className="small-number"
          min={1}
          value={style.thickness}
          onChange={(e) => updateEdgeStyle(edgeId, { thickness: Number(e.target.value) || 1 })}
        />
        <span className="unit">px</span>
      </div>
      <div className="field-row">
        <label>向き</label>
        <div className="button-group">
          {(['one-way', 'two-way'] as EdgeDirection[]).map((d) => (
            <button
              key={d}
              className={style.direction === d ? 'active' : ''}
              onClick={() => updateEdgeStyle(edgeId, { direction: d })}
            >
              {d === 'one-way' ? '片方向' : '双方向'}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <label>問い</label>
        <select
          value={question?.value ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              updateEdgeQuestion(edgeId, null);
            } else {
              const type = PRESET_QUESTIONS.includes(value) ? 'preset' : 'custom';
              updateEdgeQuestion(edgeId, { type, value });
            }
          }}
        >
          <option value="">（未設定）</option>
          {allQuestions.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>

      <button className="danger" onClick={() => deleteEdge(edgeId)}>
        この矢印を削除
      </button>
    </div>
  );
}

function QuestionLibrary() {
  const project = useMapStore((s) => s.project);
  const addCustomQuestion = useMapStore((s) => s.addCustomQuestion);
  const [text, setText] = useState('');

  return (
    <div className="panel">
      <h3>問いライブラリ</h3>
      <ul className="library-list">
        {PRESET_QUESTIONS.map((q) => (
          <li key={q}>
            <span className="badge">標準</span> {q}
          </li>
        ))}
        {(project?.customQuestions ?? []).map((q) => (
          <li key={q}>
            <span className="badge custom">追加</span> {q}
          </li>
        ))}
      </ul>
      <div className="question-add-row">
        <input
          value={text}
          placeholder="新しい問いを登録"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && text.trim()) {
              await addCustomQuestion(text.trim());
              setText('');
            }
          }}
        />
        <button
          onClick={async () => {
            if (!text.trim()) return;
            await addCustomQuestion(text.trim());
            setText('');
          }}
        >
          追加
        </button>
      </div>
      <p className="hint">矢印をクリックすると、ここに登録した問いを設定できます。</p>
    </div>
  );
}

export default function Sidebar() {
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const selectedEdgeId = useMapStore((s) => s.selectedEdgeId);
  const addNode = useMapStore((s) => s.addNode);

  return (
    <aside className="sidebar">
      <button
        className="primary add-node-btn"
        onClick={() => addNode({ x: 200 + Math.random() * 100, y: 150 + Math.random() * 100 })}
      >
        ＋ ノードを追加
      </button>

      <QuestionLibrary />

      {selectedNodeId && <NodePanel nodeId={selectedNodeId} />}
      {selectedEdgeId && <EdgePanel edgeId={selectedEdgeId} />}
      {!selectedNodeId && !selectedEdgeId && (
        <div className="panel hint-panel">ノードや矢印を選択するとスタイルを編集できます。</div>
      )}
    </aside>
  );
}

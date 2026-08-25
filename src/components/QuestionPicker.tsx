import { useState } from 'react';
import { useMapStore } from '../store/mapStore';
import { PRESET_QUESTIONS } from '../constants';

interface Props {
  edgeId: string;
  onClose: () => void;
}

export default function QuestionPicker({ edgeId, onClose }: Props) {
  const project = useMapStore((s) => s.project);
  const updateEdgeQuestion = useMapStore((s) => s.updateEdgeQuestion);
  const addCustomQuestion = useMapStore((s) => s.addCustomQuestion);
  const [newQuestion, setNewQuestion] = useState('');

  const customQuestions = project?.customQuestions ?? [];

  const choose = (value: string, type: 'preset' | 'custom') => {
    updateEdgeQuestion(edgeId, { type, value });
    onClose();
  };

  const clear = () => {
    updateEdgeQuestion(edgeId, null);
    onClose();
  };

  const handleAdd = async () => {
    const text = newQuestion.trim();
    if (!text) return;
    await addCustomQuestion(text);
    updateEdgeQuestion(edgeId, { type: 'custom', value: text });
    setNewQuestion('');
    onClose();
  };

  return (
    <div className="popover-card" onClick={(e) => e.stopPropagation()}>
      <div className="popover-title">問いを選択</div>
      <div className="question-list">
        {PRESET_QUESTIONS.map((q) => (
          <button key={q} className="question-item" onClick={() => choose(q, 'preset')}>
            {q}
          </button>
        ))}
        {customQuestions.map((q) => (
          <button key={q} className="question-item" onClick={() => choose(q, 'custom')}>
            {q}
          </button>
        ))}
      </div>
      <div className="question-add-row">
        <input
          value={newQuestion}
          placeholder="オリジナルの問いを追加"
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <button onClick={handleAdd}>追加</button>
      </div>
      <button className="question-clear" onClick={clear}>
        問いを未設定にする
      </button>
    </div>
  );
}

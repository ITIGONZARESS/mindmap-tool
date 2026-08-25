import { useState } from 'react';
import ProjectListScreen from './components/ProjectListScreen';
import MapEditorScreen from './components/MapEditorScreen';

function App() {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  if (openProjectId) {
    return <MapEditorScreen projectId={openProjectId} onBack={() => setOpenProjectId(null)} />;
  }

  return <ProjectListScreen onOpen={setOpenProjectId} />;
}

export default App;

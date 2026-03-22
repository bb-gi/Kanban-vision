import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AppProvider>
      <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Dashboard />
      </div>
    </AppProvider>
  );
}

export default App;

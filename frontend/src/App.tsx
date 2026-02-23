import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { JiraLayout } from './components/JiraLayout';
import { Board } from './pages/Board';
import { Summary } from './pages/Summary';
import { Backlog } from './pages/Backlog';
import { Code } from './pages/Code';
import { Timeline } from './pages/Timeline';
import { Pages } from './pages/Pages';
import { Forms } from './pages/Forms';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JiraLayout />}>
          <Route index element={<Navigate to="/board" replace />} />
          <Route path="board" element={<Board />} />
          <Route path="summary" element={<Summary />} />
          <Route path="backlog" element={<Backlog />} />
          <Route path="code" element={<Code />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="pages" element={<Pages />} />
          <Route path="forms" element={<Forms />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

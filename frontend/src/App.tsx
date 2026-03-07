import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { JiraLayout } from './components/JiraLayout';
import { Board } from './pages/Board';
import { Summary } from './pages/Summary';
import { Backlog } from './pages/Backlog';
import { Code } from './pages/Code';
import { Timeline } from './pages/Timeline';
import { Pages } from './pages/Pages';
import { Forms } from './pages/Forms';
import { TicketDetail } from './pages/TicketDetail';
import { SpaceOverview } from './pages/SpaceOverview';
import { SpacesList } from './pages/SpacesList';
import { UserProvider } from './context/UserContext';
import { SpaceProvider } from './context/SpaceContext';
import { TicketProvider } from './context/TicketContext';
import './App.css';

function App() {
  return (
    <UserProvider>
    <SpaceProvider>
    <TicketProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JiraLayout />}>
          <Route index element={<Navigate to="/spaces" replace />} />
          <Route path="spaces" element={<SpacesList />} />
          <Route path="space" element={<SpaceOverview />} />
          <Route path="board" element={<Board />} />
          <Route path="summary" element={<Summary />} />
          <Route path="backlog" element={<Backlog />} />
          <Route path="code" element={<Code />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="pages" element={<Pages />} />
          <Route path="forms" element={<Forms />} />
          <Route path="ticket/:ticketId" element={<TicketDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </TicketProvider>
    </SpaceProvider>
    </UserProvider>
  );
}

export default App;

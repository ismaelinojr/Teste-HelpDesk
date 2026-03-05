import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TicketDetail from './pages/TicketDetail';
import Admin from './pages/Admin';
import NewTicket from './pages/NewTicket';
import Relatorios from './pages/Relatorios';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chamado/:id" element={<TicketDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/novo" element={<NewTicket />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;

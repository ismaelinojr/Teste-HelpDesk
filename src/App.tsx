import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TicketDetail from './pages/TicketDetail';
import Admin from './pages/Admin';
import NewTicket from './pages/NewTicket';
import Relatorios from './pages/Relatorios';
import Login from './pages/Login';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useApp();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#11111b] text-[#cdd6f4]">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="chamado/:id" element={<TicketDetail />} />
              <Route path="admin" element={<Admin />} />
              <Route path="novo" element={<NewTicket />} />
              <Route path="relatorios" element={<Relatorios />} />
            </Route>
          </Routes>
        </AppProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;

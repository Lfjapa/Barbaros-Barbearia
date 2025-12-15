import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import NewSale from './pages/barber/NewSale';
import History from './pages/barber/History';
import Dashboard from './pages/admin/Dashboard';
import Services from './pages/admin/Services';
import Barbers from './pages/admin/Barbers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Barber Routes */}
        <Route path="/app" element={<NewSale />} />
        <Route path="/app/history" element={<History />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/services" element={<Services />} />
        <Route path="/admin/barbers" element={<Barbers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

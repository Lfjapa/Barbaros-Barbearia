import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import NewSale from './pages/barber/NewSale';
import History from './pages/barber/History';
import Dashboard from './pages/admin/Dashboard';
import Services from './pages/admin/Services';
import Barbers from './pages/admin/Barbers';
import Settings from './pages/admin/Settings';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Barber Routes */}
        <Route path="/app/*" element={
          <PrivateRoute allowedRoles={['barber']}>
            <Routes>
              <Route path="/" element={<NewSale />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </PrivateRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/services" element={<Services />} />
              <Route path="/barbers" element={<Barbers />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

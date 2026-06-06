import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Inventario from './pages/Inventario';
import RegistrarVenta from './pages/RegistrarVenta';
import Ticket from './pages/Ticket';
import Reportes from './pages/Reportes';
import HistorialVentas from './pages/HistorialVentas';
import Dashboard from './pages/Dashboard';
import AgregarUsuario from './pages/AgregarUsuario';
import VentaCarrito from './pages/VentaCarrito';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
<Route path="/usuarios/nuevo" element={<AgregarUsuario />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/venta/:id" element={<RegistrarVenta />} />
        <Route path="/ticket/:id" element={<Ticket />} />
        <Route path="/venta-carrito" element={<VentaCarrito />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/ventas" element={<HistorialVentas />} />np
        <Route path="*" element={<Navigate to="/login" />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
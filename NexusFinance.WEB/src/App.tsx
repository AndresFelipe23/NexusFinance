import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import Home from "./Pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Cuentas from "./Pages/Cuentas";
import Presupuestos from "./Pages/Presupuestos";
import MetasFinancieras from '././Pages/MetasFinancieras'
import Categorias from "./Pages/Categorias";
import Transferencias from "./Pages/Transferencias";
import Transacciones from "./Pages/Transacciones";
import TransaccionesRecurrentes from "./Pages/TransaccionesRecurrentesMejorada";
import PlanesVacaciones from "./Pages/PlanesVacaciones";
import CategoriasGastosViaje from "./Pages/CategoriasGastosViaje";
import PresupuestoViaje from "./Pages/PresupuestoViaje";
import ActividadesViaje from "./Pages/ActividadesViaje";
import ChecklistViaje from "./Pages/ChecklistViaje";
import GastosViaje from "./Pages/GastosViaje";
import DocumentosViaje from "./Pages/DocumentosViaje";
import Reportes from "./Pages/Reportes";
import Settings from "./Pages/Settings";
import { ModalProvider } from "./contexts/ModalContext";

export default function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<ProtectedRoute>
            <Home />
          </ProtectedRoute>} />
          <Route path="/cuentas" element={<ProtectedRoute><Cuentas /></ProtectedRoute>} />
          <Route path="/presupuestos" element={<ProtectedRoute><Presupuestos /></ProtectedRoute>} />
          <Route path="/transferencias" element={<ProtectedRoute><Transferencias /></ProtectedRoute>} />
          <Route path="/transacciones" element={<ProtectedRoute><Transacciones /></ProtectedRoute>} />
          <Route path="/transacciones-recurrentes" element={<ProtectedRoute><TransaccionesRecurrentes /></ProtectedRoute>} />
          <Route path="/metas" element={<ProtectedRoute><MetasFinancieras /></ProtectedRoute>} />
          <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
          <Route path="/planes-vacaciones" element={<ProtectedRoute><PlanesVacaciones /></ProtectedRoute>} />
          <Route path="/planes-vacaciones/:planId" element={<ProtectedRoute><PlanesVacaciones /></ProtectedRoute>} />
          <Route path="/categorias-gastos-viaje" element={<ProtectedRoute><CategoriasGastosViaje /></ProtectedRoute>} />
          <Route path="/presupuesto-viaje" element={<ProtectedRoute><PresupuestoViaje /></ProtectedRoute>} />
          <Route path="/actividades-viaje" element={<ProtectedRoute><ActividadesViaje /></ProtectedRoute>} />
          <Route path="/checklist-viaje" element={<ProtectedRoute><ChecklistViaje /></ProtectedRoute>} />
          <Route path="/checklist-viaje/:planId" element={<ProtectedRoute><ChecklistViaje /></ProtectedRoute>} />
          <Route path="/gastos-viaje" element={<ProtectedRoute><GastosViaje /></ProtectedRoute>} />
          <Route path="/documentos-viaje" element={<ProtectedRoute><DocumentosViaje /></ProtectedRoute>} />
          <Route path="/documentos-viaje/:planId" element={<ProtectedRoute><DocumentosViaje /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ModalProvider>  
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import SellerPanel from './pages/SellerPanel';
import BuyerDashboard from './pages/BuyerDashboard';
import History from './pages/History';
import ProductsCatalog from './pages/ProductsCatalog';
import FilialPanel from './pages/FilialPanel';
import SupplierQuotePage from './pages/SupplierQuotePage';
import TeamManagementPage from './pages/TeamManagementPage';
import EconomyPage from './pages/EconomyPage';
import NotificationsPage from './pages/NotificationsPage';

function PrivateRoute({ children, allowedRoles, roleRequired }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return children;
}

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login />
        } />

        {/* Public Supplier Quotation Route */}
        <Route path="/cotacao-fornecedor" element={<SupplierQuotePage />} />
        
        {/* Root Redirect based on role and store */}
        <Route path="/" element={
          !user ? <Navigate to="/login" /> :
          user.role === 'admin_filial' ? <Navigate to="/filial-ki-madeiras" /> :
          user.role === 'vendedor' ? (
            user.loja === 'Ki Madeiras' ? <Navigate to="/filial-ki-madeiras" /> : <Navigate to="/vendedor" />
          ) : 
          <Navigate to="/comprador" />
        } />

        <Route path="/vendedor" element={
          <PrivateRoute allowedRoles={['vendedor']}>
            <SellerPanel />
          </PrivateRoute>
        } />

        <Route path="/filial-ki-madeiras" element={
          <PrivateRoute allowedRoles={['vendedor', 'admin_filial']}>
            <FilialPanel />
          </PrivateRoute>
        } />

        <Route path="/comprador" element={
          <PrivateRoute allowedRoles={['comprador', 'cotador']}>
            <BuyerDashboard />
          </PrivateRoute>
        } />

        <Route path="/equipe" element={
          <PrivateRoute allowedRoles={['comprador', 'cotador']}>
            <TeamManagementPage />
          </PrivateRoute>
        } />

        <Route path="/economia" element={
          <PrivateRoute allowedRoles={['comprador']}>
            <EconomyPage />
          </PrivateRoute>
        } />

        <Route path="/historico" element={
          <PrivateRoute>
            <History />
          </PrivateRoute>
        } />

        <Route path="/produtos" element={
          <PrivateRoute>
            <ProductsCatalog />
          </PrivateRoute>
        } />

        <Route path="/notificacoes" element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

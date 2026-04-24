import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import SellerPanel from './pages/SellerPanel';
import BuyerDashboard from './pages/BuyerDashboard';
import History from './pages/History';
import ProductsCatalog from './pages/ProductsCatalog';

function PrivateRoute({ children, roleRequired }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" />; // Redirect to their own dashboard
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
        
        {/* Root Redirect based on role */}
        <Route path="/" element={
          !user ? <Navigate to="/login" /> :
          user.role === 'vendedor' ? <Navigate to="/vendedor" /> : 
          <Navigate to="/comprador" />
        } />

        <Route path="/vendedor" element={
          <PrivateRoute roleRequired="vendedor">
            <SellerPanel />
          </PrivateRoute>
        } />

        <Route path="/comprador" element={
          <PrivateRoute roleRequired="comprador">
            <BuyerDashboard />
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

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

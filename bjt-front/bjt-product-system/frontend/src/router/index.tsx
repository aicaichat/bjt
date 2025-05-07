import { Route, Routes } from 'react-router-dom';
import ProductDetail from '../pages/ProductDetail';
import PO from '../pages/PO';

export default function Router() {
  return (
    <Routes>
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/po" element={<PO />} />
    </Routes>
  );
} 
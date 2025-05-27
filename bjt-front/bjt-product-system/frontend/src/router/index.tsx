import { Route, Routes } from 'react-router-dom';
import ProductDetail from '../pages/ProductDetail';
import PO from '../pages/PO';

// This router is causing conflicts with the main App router,
// commenting it out as routes are now defined in App.tsx
export default function Router() {
  return (
    <Routes>
      {/* Routes moved to App.tsx */}
      {/* <Route path="/product/:id" element={<ProductDetail />} /> */}
      {/* <Route path="/po" element={<PO />} /> */}
    </Routes>
  );
} 
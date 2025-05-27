import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import AdminLoginPage from './pages/login/AdminLoginPage';
import AdminDashboardPage from './pages/dashboard/AdminDashboardPage';
import ProductLinesPage from './pages/product-lines/ProductLinesPage';
import ProductLineEditPage from './pages/product-lines/ProductLineEditPage';
import MachinesPage from './pages/machines/MachinesPage';
import MachineEditPage from './pages/machines/MachineEditPage';
import PartsPage from './pages/parts/PartsPage';
import PartEditPage from './pages/parts/PartEditPage';
import RelationsPage from './pages/relations/RelationsPage';
import RelationEditPage from './pages/relations/RelationEditPage';
import AccessoriesPage from './pages/accessories/AccessoriesPage';
import AccessoryEditPage from './pages/accessories/AccessoryEditPage';
import AccessoryModelEditPage from './pages/accessories/AccessoryModelEditPage';
import ConsumablesPage from './pages/consumables/ConsumablesPage';
import ConsumableEditPage from './pages/consumables/ConsumableEditPage';
import ConsumableModelEditPage from './pages/consumables/ConsumableModelEditPage';
import ConsumablesDictionaryPage from './pages/consumables/ConsumablesDictionaryPage';
import DictionaryItemEditPage from './pages/consumables/DictionaryItemEditPage';
import SparePartsPage from './pages/spare-parts/SparePartsPage';
import SparePartEditPage from './pages/spare-parts/SparePartEditPage';
import SparePartModelEditPage from './pages/spare-parts/SparePartModelEditPage';
import UsersPage from './pages/users/UsersPage';
import UserEditPage from './pages/users/UserEditPage';
import SettingsPage from './pages/settings/SettingsPage';
import DebugPage from './pages/DebugPage';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/debug" element={<DebugPage />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="product-lines">
          <Route index element={<ProductLinesPage />} />
          <Route path="create" element={<ProductLineEditPage />} />
          <Route path="edit/:id" element={<ProductLineEditPage />} />
        </Route>
        <Route path="machines">
          <Route index element={<MachinesPage />} />
          <Route path="create" element={<MachineEditPage mode="create" />} />
          <Route path="edit/:id" element={<MachineEditPage mode="edit" />} />
        </Route>
        <Route path="parts">
          <Route index element={<PartsPage />} />
          <Route path="create" element={<PartEditPage />} />
          <Route path="edit/:id" element={<PartEditPage />} />
        </Route>
        <Route path="relations">
          <Route index element={<RelationsPage />} />
          <Route path="add" element={<RelationEditPage />} />
        </Route>
        <Route path="accessories">
          <Route index element={<AccessoriesPage />} />
          <Route path="create" element={<AccessoryEditPage />} />
          <Route path="edit/:id" element={<AccessoryEditPage />} />
          <Route path="models/create" element={<AccessoryModelEditPage />} />
          <Route path="models/edit/:id" element={<AccessoryModelEditPage />} />
        </Route>
        <Route path="consumables">
          <Route index element={<ConsumablesPage />} />
          <Route path="create" element={<ConsumableEditPage />} />
          <Route path="edit/:id" element={<ConsumableEditPage />} />
          <Route path="models/create" element={<ConsumableModelEditPage />} />
          <Route path="models/edit/:id" element={<ConsumableModelEditPage />} />
          <Route path="dictionary">
            <Route index element={<ConsumablesDictionaryPage />} />
            <Route path="shape/create" element={<DictionaryItemEditPage type="shape" mode="create" />} />
            <Route path="shape/edit/:id" element={<DictionaryItemEditPage type="shape" mode="edit" />} />
            <Route path="material/create" element={<DictionaryItemEditPage type="material" mode="create" />} />
            <Route path="material/edit/:id" element={<DictionaryItemEditPage type="material" mode="edit" />} />
            <Route path="specification/create" element={<DictionaryItemEditPage type="specification" mode="create" />} />
            <Route path="specification/edit/:id" element={<DictionaryItemEditPage type="specification" mode="edit" />} />
          </Route>
        </Route>
        <Route path="spare-parts">
          <Route index element={<SparePartsPage />} />
          <Route path="create" element={<SparePartEditPage mode="create" />} />
          <Route path="edit/:id" element={<SparePartEditPage mode="edit" />} />
          <Route path="models/create" element={<SparePartModelEditPage mode="create" />} />
          <Route path="models/edit/:id" element={<SparePartModelEditPage mode="edit" />} />
        </Route>
        <Route path="users">
          <Route index element={<UsersPage />} />
          <Route path="create" element={<UserEditPage />} />
          <Route path="edit/:id" element={<UserEditPage />} />
        </Route>
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes; 
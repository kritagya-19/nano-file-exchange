import { Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ShareDownload } from "./pages/ShareDownload";
import { AcceptInvite } from "./pages/AcceptInvite";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { MyFiles } from "./pages/dashboard/MyFiles";
import { Groups } from "./pages/dashboard/Groups";
import { GroupDetail } from "./pages/dashboard/GroupDetail";
import { Shared } from "./pages/dashboard/Shared";
import { ProfilePage } from "./pages/dashboard/ProfilePage";
import { SettingsPage } from "./pages/dashboard/SettingsPage";
import { DashboardHome } from "./pages/dashboard/DashboardHome";
import { StarredPage } from "./pages/dashboard/StarredPage";
import { TrashPage } from "./pages/dashboard/TrashPage";
import { HelpPage } from "./pages/dashboard/HelpPage";
import { PricingPage } from "./pages/dashboard/PricingPage";
import { CheckoutPage } from "./pages/dashboard/CheckoutPage";
import { PaymentSuccessPage } from "./pages/dashboard/PaymentSuccessPage";

// Admin pages
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminFiles } from "./pages/admin/AdminFiles";
import { AdminGroups } from "./pages/admin/AdminGroups";
import { AdminPlans } from "./pages/admin/AdminPlans";
import { AdminStorage } from "./pages/admin/AdminStorage";
import { AdminRevenue } from "./pages/admin/AdminRevenue";
import { AdminActivity } from "./pages/admin/AdminActivity";
import { AdminReports } from "./pages/admin/AdminReports";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/share/:token" element={<ShareDownload />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="files" element={<MyFiles />} />
        <Route path="groups" element={<Groups />}>
          <Route path=":groupId" element={<GroupDetail />} />
        </Route>
        <Route path="shared" element={<Shared />} />
        <Route path="starred" element={<StarredPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="checkout/:planId" element={<CheckoutPage />} />
        <Route path="payment-success" element={<PaymentSuccessPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="files" element={<AdminFiles />} />
        <Route path="groups" element={<AdminGroups />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="storage" element={<AdminStorage />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

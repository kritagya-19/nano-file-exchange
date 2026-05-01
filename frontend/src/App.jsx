import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

// ── Auth guards & layouts (always loaded — small, critical-path components) ──
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { AdminLayout } from "./components/admin/AdminLayout";

// ── Landing & auth pages (loaded eagerly — first thing users see) ──
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

// ── Lazy-loaded pages (only downloaded when the user navigates to them) ──
// This reduces the initial JS bundle by ~60-70% — users only download what they visit.

// Public pages
const ShareDownload = lazy(() => import("./pages/ShareDownload").then(m => ({ default: m.ShareDownload })));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite").then(m => ({ default: m.AcceptInvite })));

// Dashboard pages
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome").then(m => ({ default: m.DashboardHome })));
const MyFiles = lazy(() => import("./pages/dashboard/MyFiles").then(m => ({ default: m.MyFiles })));
const Groups = lazy(() => import("./pages/dashboard/Groups").then(m => ({ default: m.Groups })));
const GroupDetail = lazy(() => import("./pages/dashboard/GroupDetail").then(m => ({ default: m.GroupDetail })));
const Shared = lazy(() => import("./pages/dashboard/Shared").then(m => ({ default: m.Shared })));
const StarredPage = lazy(() => import("./pages/dashboard/StarredPage").then(m => ({ default: m.StarredPage })));
const TrashPage = lazy(() => import("./pages/dashboard/TrashPage").then(m => ({ default: m.TrashPage })));
const HelpPage = lazy(() => import("./pages/dashboard/HelpPage").then(m => ({ default: m.HelpPage })));
const ProfilePage = lazy(() => import("./pages/dashboard/ProfilePage").then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage").then(m => ({ default: m.SettingsPage })));
const PricingPage = lazy(() => import("./pages/dashboard/PricingPage").then(m => ({ default: m.PricingPage })));
const CheckoutPage = lazy(() => import("./pages/dashboard/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const PaymentSuccessPage = lazy(() => import("./pages/dashboard/PaymentSuccessPage").then(m => ({ default: m.PaymentSuccessPage })));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin").then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers").then(m => ({ default: m.AdminUsers })));
const AdminFiles = lazy(() => import("./pages/admin/AdminFiles").then(m => ({ default: m.AdminFiles })));
const AdminGroups = lazy(() => import("./pages/admin/AdminGroups").then(m => ({ default: m.AdminGroups })));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans").then(m => ({ default: m.AdminPlans })));
const AdminStorage = lazy(() => import("./pages/admin/AdminStorage").then(m => ({ default: m.AdminStorage })));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue").then(m => ({ default: m.AdminRevenue })));
const AdminActivity = lazy(() => import("./pages/admin/AdminActivity").then(m => ({ default: m.AdminActivity })));
const AdminReports = lazy(() => import("./pages/admin/AdminReports").then(m => ({ default: m.AdminReports })));

// ── Loading fallback shown while a lazy chunk is downloading ──
function PageLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "60vh",
      width: "100%",
    }}>
      <div style={{
        width: "36px",
        height: "36px",
        border: "3px solid rgba(99, 102, 241, 0.2)",
        borderTopColor: "#6366f1",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}

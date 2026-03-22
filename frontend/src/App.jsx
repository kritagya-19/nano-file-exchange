import { Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { RequireAuth } from "./components/RequireAuth";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { MyFiles } from "./pages/dashboard/MyFiles";
import { Groups } from "./pages/dashboard/Groups";
import { Shared } from "./pages/dashboard/Shared";
import { ProfilePage } from "./pages/dashboard/ProfilePage";
import { SettingsPage } from "./pages/dashboard/SettingsPage";
import { DashboardHome } from "./pages/dashboard/DashboardHome";
import { StarredPage } from "./pages/dashboard/StarredPage";
import { TrashPage } from "./pages/dashboard/TrashPage";
import { HelpPage } from "./pages/dashboard/HelpPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
        <Route path="groups" element={<Groups />} />
        <Route path="shared" element={<Shared />} />
        <Route path="starred" element={<StarredPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

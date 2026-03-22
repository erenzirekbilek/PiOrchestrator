import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Dashboard from "./pages/Dashboard";
import Sequences from "./pages/Sequences";
import Device from "./pages/Device";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function PrivateLayout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RequireAuth() {
  const isLoggedIn = !!localStorage.getItem("token");
  const location = useLocation();
  if (!isLoggedIn) {
    const login = location.pathname.startsWith("/admin") ? "/admin/login" : "/login";
    return <Navigate to={login} replace />;
  }
  return <Outlet />;
}

function RequireGuest({ children }) {
  if (localStorage.getItem("token")) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RequireGuest>
            <Login mode="user" />
          </RequireGuest>
        }
      />
      <Route
        path="/admin/login"
        element={
          <RequireGuest>
            <Login mode="admin" />
          </RequireGuest>
        }
      />
      <Route
        path="/signup"
        element={
          <RequireGuest>
            <Signup mode="user" />
          </RequireGuest>
        }
      />
      <Route
        path="/admin/signup"
        element={
          <RequireGuest>
            <Signup mode="admin" />
          </RequireGuest>
        }
      />
      <Route element={<RequireAuth />}>
        <Route element={<PrivateLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="sequences" element={<Sequences />} />
          <Route path="device" element={<Device />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

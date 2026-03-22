import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Languages, LogOut } from "lucide-react";

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Topbar() {
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();
  const user = readStoredUser();

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    const path = window.location.pathname || "/";
    navigate(path.startsWith("/admin") ? "/admin/login" : "/login");
  };

  const label = user?.username || "—";
  const role = user?.is_staff ? "admin" : "user";

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end px-6 gap-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {label}
          <span className="text-gray-400 dark:text-gray-500"> · {role}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={logout}
        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
      >
        <LogOut size={16} />
        Çıkış
      </button>
      <button type="button" onClick={() => {}} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <Languages size={18} />
      </button>
      <button type="button" onClick={toggleDark} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}

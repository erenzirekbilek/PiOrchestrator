import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { formatApiError } from "../api/formatApiError";

export default function Login({ mode = "user" }) {
  const isAdmin = mode === "admin";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signupPath = isAdmin ? "/admin/signup" : "/signup";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await client.post("/auth/login/", {
        username,
        password,
      });
      localStorage.setItem("token", data.access_token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pi Scheduler</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {isAdmin ? "Yönetici girişi" : "Kullanıcı girişi"}
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adı"
            autoComplete="username"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            autoComplete="current-password"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Hesabınız yok mu?{" "}
          <Link to={signupPath} className="text-blue-600 hover:underline">
            Kayıt olun
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          {isAdmin ? (
            <Link to="/login" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Kullanıcı girişi
            </Link>
          ) : (
            <Link to="/admin/login" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Yönetici girişi
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}

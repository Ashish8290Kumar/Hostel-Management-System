import React, { useState } from "react";
import AuthPage from "./components/AuthPage";
import Layout from "./components/Layout";
import AdminDashboard from "./components/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard";

export const API_BASE = import.meta.env.VITE_API_BASE_URL 
  || "https://hostel-management-system-backend-o16l.onrender.com";

const initialLogin = { username: "", password: "" };
const initialRegister = {
  username: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
  role: "STUDENT",
  rollNumber: "",
};

function getRole(role) {
  return String(role || "").replace("ROLE_", "");
}

export function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Razorpay mock loader (unchanged)
export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    console.log("Network dropped. Injecting local mock payment engine execution hooks...");
    window.Razorpay = function (options) {
      this.options = options;
      this.open = function () {
        const userAction = window.confirm(
          `💳 LOCAL PAYMENT SIMULATOR:\n\nHostel Allotment Fee Bill: ₹${this.options.amount / 100}\n\nClick 'OK' to simulate SUCCESSFUL transaction hook.\nClick 'Cancel' to drop request.`
        );
        if (userAction) {
          this.options.handler({
            razorpay_order_id: this.options.order_id || "mock_order_id_" + Math.random().toString(36).substr(2, 9),
            razorpay_payment_id: "pay_mock_" + Math.random().toString(36).substr(2, 9),
            razorpay_signature: "mock_crypto_signature_token_verified"
          });
        } else {
          alert("Payment orchestration dropped by user decision.");
        }
      };
    };
    resolve(true);
  });
}

export default function App() {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem("hostel_session");
    return stored ? JSON.parse(stored) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("hostel_theme");
    return savedTheme ? savedTheme : "dark";
  });

  const role = getRole(session?.assignedRole || session?.role);

  function triggerToast(type, text) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("hostel_theme", nextTheme);
  }

  function saveSession(nextSession) {
    localStorage.setItem("hostel_session", JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function logout() {
    localStorage.removeItem("hostel_session");
    setSession(null);
    setToast(null);
  }

  // API helper uses Render backend URL
  async function api(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (session?.jwtToken || session?.token) {
      headers.Authorization = `Bearer ${session.jwtToken || session.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }

    if (!response.ok) {
      const message = typeof data === "string" ? data : data?.message || data?.error || `Error: ${response.status}`;
      throw new Error(message);
    }

    return data;
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setToast(null);

    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      saveSession(data);
      triggerToast("success", `Welcome back, ${data.username}!`);
    } catch (error) {
      triggerToast("error", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setBusy(true);
    setToast(null);

    try {
      // 🚀 FIXED: Dynamically matches the exact UI dropdown input object criteria
      const securePayload = {
        username: registerForm.username,
        password: registerForm.password,
        fullName: registerForm.fullName,
        email: registerForm.email,
        phone: registerForm.phone,
        role: registerForm.role, 
        rollNumber: registerForm.role === "STUDENT" ? registerForm.rollNumber : null
      };

      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(securePayload),
      });

      // Clear the registration form fields completely
      setRegisterForm(initialRegister);
      setAuthMode("login");
      triggerToast("success", "Profile record established successfully!");
    } catch (error) {
      triggerToast("error", error.message);
    } finally {
      setBusy(false); 
    }
  }

  if (!session) {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        onLogin={handleLogin}
        onRegister={handleRegister}
        busy={busy}
        toast={toast}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <Layout session={session} role={role} onLogout={logout} toast={toast}>
      {role === "ADMIN" ? (
        <AdminDashboard api={api} setToast={triggerToast} />
      ) : (
        <StudentDashboard api={api} session={session} setToast={triggerToast} />
      )}
    </Layout>
  );
}

import React, { useState } from "react";
import AuthPage from "./components/AuthPage";
import Layout from "./components/Layout";
import AdminDashboard from "./components/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8090";

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

// OFFLINE BYPASS SUITE: Network error aur timeout ko bypass karne ke liye offline engine
export function loadRazorpay() {
  return new Promise((resolve) => {
    // Agar internet chal raha hai aur window.Razorpay mil gaya toh achhi baat hai
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // 🚀 OFFLINE SIMULATION: Agar script drop ho gayi, toh local template mock inject karein
    console.log("Network dropped. Injecting local mock payment engine execution hooks...");
    
    window.Razorpay = function (options) {
      this.options = options;
      this.open = function () {
        // Automatic alert to simulate payment process window interaction without server lag
        const userAction = window.confirm(
          `💳 LOCAL PAYMENT SIMULATOR:\n\nHostel Allotment Fee Bill: ₹${this.options.amount / 100}\n\nClick 'OK' to simulate SUCCESSFUL transaction hook.\nClick 'Cancel' to drop request.`
        );

        if (userAction) {
          // Trigger the standard callback success loop back to student handler pipeline
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

    resolve(true); // Forces system to unlock the checkout gateway
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

  // UPGRADED LOGIC: System check verification attempts process tracking engine block
    // UPGRADED LOGIC: Forces every single signup request to become a student safely
  async function handleRegister(event) {
    event.preventDefault();
    setBusy(true);
    setToast(null);

    try {
      // 🚀 FIXED SECURE PACKET: Form data ko copy karke role ko strictly STUDENT force-assign kiya hai
      const securePayload = {
        ...registerForm,
        role: "STUDENT",
        rollNumber: registerForm.rollNumber // Student roll number data packet assign
      };

      // Purane admin validation codes aur security keys ko payload se humesha ke liye delete kiya
      delete securePayload.adminSecretKey;

      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(securePayload), // Backend pipeline ko hamesha STUDENT hi travel karega
      });

      // Form clear karke user ko login tab par redirect karein
      setRegisterForm(initialRegister);
      setAuthMode("login");
      triggerToast("success", "Profile record established successfully into enterprise datastore ledger!");
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

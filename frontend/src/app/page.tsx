"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { login, register } from "@/lib/auth";
import { getToken } from "@/lib/token";
import heroImage from "@/assets/I1.jpg";

export default function AuthPage() {
  useEffect(() => {
    const token = getToken();
    if (token) {
      window.location.href = "/dashboard";
    }
  }, []);

  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const registerPasswordRef = useRef<HTMLInputElement | null>(null);
  const registerConfirmRef = useRef<HTMLInputElement | null>(null);

  function EyeIcon({ open }: { open: boolean }) {
    return open ? (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2.1 12.1C4.3 7.6 8 5 12 5c4 0 7.7 2.6 9.9 7.1.1.3.1.6 0 .8C19.7 17.4 16 20 12 20c-4 0-7.7-2.6-9.9-7.1a.9.9 0 0 1 0-.8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ) : (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10.7 10.7a3 3 0 0 0 4.2 4.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6.2 6.3C4.3 7.5 2.9 9.4 2.1 11.9a.9.9 0 0 0 0 .2c2.2 4.5 5.9 7.1 9.9 7.1 1.4 0 2.8-.3 4.1-.9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9.9 5.2c.7-.1 1.4-.2 2.1-.2 4 0 7.7 2.6 9.9 7.1.1.3.1.6 0 .8-.7 1.4-1.6 2.7-2.7 3.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  function getInputValue(form: HTMLFormElement, inputName: string) {
    const el = form.elements.namedItem(inputName);
    return el instanceof HTMLInputElement ? el.value : "";
  }

  function syncRegisterPasswordValidity() {
    const passwordEl = registerPasswordRef.current;
    const confirmEl = registerConfirmRef.current;
    if (!passwordEl || !confirmEl) return;

    // Confirm password matching (native bubble via setCustomValidity)
    if (confirmEl.value && passwordEl.value !== confirmEl.value) {
      confirmEl.setCustomValidity("Konfirmasi password tidak sama.");
    } else {
      confirmEl.setCustomValidity("");
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const form = e.target as HTMLFormElement;
    const email = getInputValue(form, "email");
    const password = getInputValue(form, "password");

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const form = e.target as HTMLFormElement;
    const name = getInputValue(form, "name");
    const email = getInputValue(form, "email");
    const password = getInputValue(form, "password");
    const confirmPassword = getInputValue(form, "confirmPassword");

    // Trigger native validation messages for password/confirm.
    syncRegisterPasswordValidity();
    if (!form.reportValidity()) return;

    try {
      await register(name, email, password);
      setSuccess("Registrasi berhasil! Silakan login.");
      setTab("login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  return (
    <div className="split-container">
      <div className="split-left">
        <div className="auth-wrapper">
          <div className="logo-section">
            <h1>
              PlantDoc
            </h1>
            <p className="subtitle">Identifikasi penyakit tanaman dengan mudah!</p>
          </div>

          <div className="tabs">
            <button
              type="button"
              className={`tab ${tab === "login" ? "active" : ""}`}
              onClick={() => {
                setTab("login");
                setError("");
                setSuccess("");
              }}
              aria-pressed={tab === "login"}
            >
              Login
            </button>
            <button
              type="button"
              className={`tab ${tab === "register" ? "active" : ""}`}
              onClick={() => {
                setTab("register");
                setError("");
                setSuccess("");
              }}
              aria-pressed={tab === "register"}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleLogin} className={`form ${tab === "login" ? "active" : ""}`}>
            <input name="email" type="email" placeholder="Email" required autoComplete="email" />
            <div className="password-field">
              <input
                name="password"
                type={showLoginPassword ? "text" : "password"}
                placeholder="Password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showLoginPassword ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setShowLoginPassword((v) => !v)}
              >
                <EyeIcon open={showLoginPassword} />
              </button>
            </div>
            <button type="submit">Login</button>
            <p className="error" role="alert">{tab === "login" ? error : ""}</p>
          </form>

          <form onSubmit={handleRegister} className={`form ${tab === "register" ? "active" : ""}`}>
            <input name="name" placeholder="Nama" required autoComplete="name" />
            <input name="email" type="email" placeholder="Email" required autoComplete="email" />
            <div className="password-field">
              <input
                name="password"
                type={showRegisterPassword ? "text" : "password"}
                placeholder="Password"
                required
                autoComplete="new-password"
                minLength={8}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$"
                title="Password minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan simbol."
                ref={registerPasswordRef}
                onInput={() => syncRegisterPasswordValidity()}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showRegisterPassword ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setShowRegisterPassword((v) => !v)}
              >
                <EyeIcon open={showRegisterPassword} />
              </button>
            </div>

            <div className="password-field">
              <input
                name="confirmPassword"
                type={showRegisterConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                required
                autoComplete="new-password"
                ref={registerConfirmRef}
                onInput={() => syncRegisterPasswordValidity()}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showRegisterConfirmPassword ? "Sembunyikan confirm password" : "Tampilkan confirm password"}
                onClick={() => setShowRegisterConfirmPassword((v) => !v)}
              >
                <EyeIcon open={showRegisterConfirmPassword} />
              </button>
            </div>

            <div className="password-hint">
              Password minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.
            </div>
            <button type="submit">Register</button>
            <p className="error" role="alert">{tab === "register" ? error : ""}</p>
            <p className="success" role="status">{tab === "register" ? success : ""}</p>
          </form>
        </div>
      </div>

      <div className="split-right">
        <Image
          src={heroImage}
          alt="Plant Disease"
          className="hero-image"
          priority
          fill
          sizes="(max-width: 968px) 0px, 50vw"
        />
        <div className="hero-overlay">
          <div className="hero-content" />
        </div>
      </div>
    </div>
  );
}

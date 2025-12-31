"use client";

import { useMemo, useState } from "react";
import { getUserFromToken, removeToken } from "@/lib/token";

export default function Navbar() {
  const userName = useMemo(() => {
    const user = getUserFromToken();
    return user && typeof user.name === "string" && user.name.trim() ? user.name : "User";
  }, []);

  const [confirmLogout, setConfirmLogout] = useState(false);

  function WarningIcon() {
    return (
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 3.5 22 20.5H2L12 3.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 9v5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 17.2h.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  function logout() {
    removeToken();
    window.location.href = "/";
  }

  return (
    <>
      <nav className="navbar">
        <div className="profile-section">
          <div className="profile-avatar">🌱</div>
          <span id="user-name">{userName}</span>
        </div>
        <div>
          <a href="/dashboard" className="nav-link">Beranda</a>
          <a href="/history" className="nav-link">Cek Riwayat</a>
          <div className="logout-wrapper">
            <button
              id="logout-btn"
              onClick={() => setConfirmLogout(true)}
              aria-haspopup="dialog"
              aria-expanded={confirmLogout}
            >
              Keluar
            </button>
          </div>
        </div>
      </nav>

      {confirmLogout ? (
        <div className="modal-backdrop" role="presentation">
          <div className="logout-modal" role="dialog" aria-modal="true" aria-label="Konfirmasi logout">
            <div className="logout-modal__icon" aria-hidden="true">
              <WarningIcon />
            </div>
            <div className="logout-modal__title">Keluar dari akun?</div>
            <div className="logout-modal__text">Kamu akan keluar dan perlu login lagi.</div>
            <div className="logout-modal__actions">
              <button type="button" className="logout-modal__cancel" onClick={() => setConfirmLogout(false)}>
                Batal
              </button>
              <button
                type="button"
                className="logout-modal__ok"
                onClick={() => {
                  setConfirmLogout(false);
                  logout();
                }}
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

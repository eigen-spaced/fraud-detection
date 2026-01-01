"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeContext"

export default function DashboardHeader() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header
      className="border-b"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <svg
                className="w-6 h-6"
                style={{ color: "var(--primary)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Fraud Detection System
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Real-time Transaction Analysis
              </p>
            </div>
          </div>

          {/* Status and Controls */}
          <div className="flex items-center gap-4">
            {/* API Status */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "var(--success-bg)" }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "var(--success)" }}
              ></div>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--success)" }}
              >
                API Connected
              </span>
            </div>

            {/* Model Version */}
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="font-medium">Model:</span> v1.0.0
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
              style={{ background: "var(--border)" }}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon
                  className="w-5 h-5"
                  style={{ color: "var(--text-secondary)" }}
                />
              ) : (
                <Sun
                  className="w-5 h-5"
                  style={{ color: "var(--text-secondary)" }}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

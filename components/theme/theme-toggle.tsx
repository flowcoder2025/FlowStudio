"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useRef, useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { value: "light", label: "라이트", icon: Sun },
    { value: "dark", label: "다크", icon: Moon },
    { value: "system", label: "시스템", icon: Monitor },
  ] as const;

  // SSR placeholder
  if (!mounted) {
    return (
      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-9 h-9" />
    );
  }

  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors touch-target active:scale-95"
        aria-label="테마 변경"
      >
        <CurrentIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 animate-fade-in">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors touch-target active:scale-95
                ${
                  theme === value
                    ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemeToggleSimple() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR placeholder
  if (!mounted) {
    return (
      <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-10 h-10" />
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors touch-target active:scale-95"
      aria-label="테마 변경"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-5 h-5 text-zinc-300" />
      ) : (
        <Moon className="w-5 h-5 text-zinc-600" />
      )}
    </button>
  );
}

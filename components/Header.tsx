'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Wand2, Layout, FilePenLine, LogIn, Megaphone, SlidersHorizontal, Layers, Gift, Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { AppMode } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';
import { ProfileDropdown } from './ProfileDropdown';
import { CreditBalance } from './CreditBalance';
import { LocaleSwitcher } from './LocaleSwitcher';

interface HeaderProps {
  currentMode: AppMode;
}

export const Header: React.FC<HeaderProps> = ({ currentMode }) => {
  const { navigateToMode, navigateTo } = useNavigation();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');

  const colorMap: Record<string, { light: string; dark: string }> = {
    indigo: { light: '#4f46e5', dark: '#6366f1' },
    emerald: { light: '#059669', dark: '#10b981' },
    cyan: { light: '#0891b2', dark: '#06b6d4' },
    blue: { light: '#2563eb', dark: '#3b82f6' },
    violet: { light: '#7c3aed', dark: '#8b5cf6' },
    rose: { light: '#e11d48', dark: '#f43f5e' },
    amber: { light: '#d97706', dark: '#f59e0b' },
  };

  const navigationItems = [
    { mode: AppMode.CREATE, icon: Sparkles, labelKey: 'create', color: 'indigo' },
    { mode: AppMode.EDIT, icon: Wand2, labelKey: 'edit', color: 'emerald' },
    { mode: AppMode.COMPOSITE, icon: Layers, labelKey: 'composite', color: 'cyan' },
    { mode: AppMode.DETAIL_PAGE, icon: Layout, labelKey: 'detailPage', color: 'blue' },
    { mode: AppMode.DETAIL_EDIT, icon: FilePenLine, labelKey: 'detailEdit', color: 'violet' },
    { mode: AppMode.POSTER, icon: Megaphone, labelKey: 'poster', color: 'rose' },
    { mode: AppMode.COLOR_CORRECTION, icon: SlidersHorizontal, labelKey: 'colorCorrection', color: 'amber' },
  ];

  const handleMobileNavClick = (mode: AppMode) => {
    navigateToMode(mode);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
          aria-label={t('openMenu')}
        >
          <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200" />
        </button>

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer min-h-[44px] flex-shrink-0"
          onClick={() => navigateToMode(AppMode.HOME)}
        >
          <Image
            src="/FlowStudio_icon-removebg.png"
            alt="FlowStudio"
            width={40}
            height={40}
            className="rounded-lg"
            style={{ height: "auto" }}
          />
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg leading-tight text-slate-800 dark:text-slate-100">FlowStudio</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t('aiImageGeneration')}</p>
          </div>
        </div>

        {/* Desktop Navigation (hidden on mobile) */}
        <nav className="hidden lg:flex gap-0.5 flex-1 justify-center">
          {navigationItems.map(({ mode, icon: Icon, labelKey, color }) => {
            const isActive = currentMode === mode;
            return (
              <button
                key={mode}
                onClick={() => navigateToMode(mode)}
                className={`px-3 py-2 min-h-[40px] rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                style={isActive ? {
                  backgroundColor: colorMap[color].light,
                } : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t(labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <LocaleSwitcher />
          
          {/* Authentication UI */}
          {status === 'loading' ? (
            <div className="px-2 py-1 text-xs text-slate-400 dark:text-slate-500">...</div>
          ) : session ? (
            // Logged in state - Credit Balance + Referral CTA + Profile Dropdown
            <div className="flex items-center gap-2">
              <CreditBalance />
              {/* Referral CTA Button */}
              <button
                onClick={() => navigateTo('/profile/referral')}
                className="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
                title={t('getCredits')}
              >
                <Gift className="w-4 h-4" />
                <span className="hidden lg:inline">{t('getCredits')}</span>
              </button>
              <ProfileDropdown />
            </div>
          ) : (
            <button
              onClick={() => navigateTo('/login')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-full bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">{tCommon('login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Navigation Menu Overlay */}
    {isMobileMenuOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 dark:bg-black/70"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-xl animate-in slide-in-from-left duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Image
                src="/FlowStudio_icon-removebg.png"
                alt="FlowStudio"
                width={32}
                height={32}
                className="rounded-lg"
                style={{ height: "auto" }}
              />
              <span className="font-bold text-slate-800 dark:text-slate-100">FlowStudio</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 min-w-[40px] min-h-[40px] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
              aria-label={t('closeMenu')}
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3">
            <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t('features')}
            </p>
            {navigationItems.map(({ mode, icon: Icon, labelKey, color }) => {
              const isActive = currentMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => handleMobileNavClick(mode)}
                  className={`w-full flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-lg text-left transition-all mb-1 ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  style={isActive ? {
                    backgroundColor: colorMap[color].light,
                  } : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(labelKey)}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                navigateTo('/gallery');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">{t('gallery')}</span>
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

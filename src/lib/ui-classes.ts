/** Shared Tailwind classes with dark-mode + smooth transitions */

export const transitionTheme = "transition-colors duration-300 ease-in-out";

export const pageBg = `min-h-screen bg-slate-100 dark:bg-slate-900 ${transitionTheme}`;

export const headerClass = `sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur ${transitionTheme}`;

export const cardClass = `rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm ${transitionTheme}`;

export const cardHeaderBorder = `border-b border-slate-200 dark:border-slate-700 ${transitionTheme}`;

export const inputClass = `w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${transitionTheme}`;

export const labelClass = `mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300 ${transitionTheme}`;

export const headingLg = `text-lg font-bold text-slate-900 dark:text-slate-100 ${transitionTheme}`;

export const headingBase = `text-base font-bold text-slate-900 dark:text-slate-100 ${transitionTheme}`;

export const textMuted = `text-sm text-slate-500 dark:text-slate-400 ${transitionTheme}`;

export const textSubtle = `text-xs text-slate-500 dark:text-slate-400 ${transitionTheme}`;

export const badgeClass = `rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300 ${transitionTheme}`;

export const panelMuted = `rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 p-4 ${transitionTheme}`;

export const modalOverlay = `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/70 p-4 ${transitionTheme}`;

export const modalPanel = `rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl ${transitionTheme}`;

export const btnSecondary = `rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${transitionTheme}`;

export const tabInactive = `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 ${transitionTheme}`;

export const tableHead = `border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${transitionTheme}`;

export const tableRowHover = `hover:bg-slate-50/80 dark:hover:bg-slate-700/50 ${transitionTheme}`;

export const tableDivide = `divide-y divide-slate-100 dark:divide-slate-700 ${transitionTheme}`;

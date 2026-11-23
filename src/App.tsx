import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Download,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import {
  FRONTEND_GATE_CONDITIONS,
  MASTER_PLAN_SUMMARY,
  STAGE_LABELS,
  UNIFIED_STEPS,
  getAllTaskIds,
} from './data/roadmapData';
import { CodeViewer } from './components/CodeViewer';
import { Sidebar } from './components/Sidebar';
import { generateStandaloneHtml } from './utils/exportStandaloneHtml';

type FilterMode = 'all' | 'remaining' | 'done';
type StartTrack = 'teach' | 'practice';

const STORAGE_KEY = 'dominating-graph-unified-v3';

interface PersistedState {
  completed: Record<string, boolean>;
  notes: Record<string, string>;
  track: StartTrack;
  isDark: boolean;
}

function readInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        completed: parsed.completed ?? {},
        notes: parsed.notes ?? {},
        track: parsed.track === 'teach' ? 'teach' : 'practice',
        isDark: Boolean(parsed.isDark),
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return {
    completed: {},
    notes: {},
    track: 'practice',
    isDark: false,
  };
}

export default function App() {
  const [initial] = useState<PersistedState>(() => readInitialState());
  const [completed, setCompleted] = useState<Record<string, boolean>>(initial.completed);
  const [notes, setNotes] = useState<Record<string, string>>(initial.notes);
  const [track, setTrack] = useState<StartTrack>(initial.track);
  const [isDark, setIsDark] = useState<boolean>(initial.isDark);

  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSteps, setCollapsedSteps] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [downloadedHtml, setDownloadedHtml] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    try {
      const payload: PersistedState = { completed, notes, track, isDark };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write errors
    }
  }, [completed, notes, track, isDark]);

  const allTaskIds = useMemo(() => getAllTaskIds(), []);
  const completedCount = useMemo(
    () => allTaskIds.filter((id) => Boolean(completed[id])).length,
    [allTaskIds, completed]
  );
  const progressPercent =
    allTaskIds.length > 0 ? Math.round((completedCount / allTaskIds.length) * 100) : 0;

  const gateDoneCount = useMemo(
    () => FRONTEND_GATE_CONDITIONS.filter((g) => Boolean(completed[g.id])).length,
    [completed]
  );
  const gateReady = gateDoneCount === FRONTEND_GATE_CONDITIONS.length;

  const toggleTask = (taskId: string) => {
    setCompleted((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleWholeStep = (stepTaskIds: string[]) => {
    const allDone = stepTaskIds.every((id) => Boolean(completed[id]));
    setCompleted((prev) => {
      const next = { ...prev };
      stepTaskIds.forEach((id) => {
        next[id] = !allDone;
      });
      return next;
    });
  };

  const updateNote = (stepId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [stepId]: value }));
  };

  const resetProgress = () => {
    setCompleted({});
    setNotes({});
  };

  const scrollToElement = (elementId: string) => {
    setCollapsedSteps((prev) => ({ ...prev, [elementId]: false }));
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const allStepsCollapsed = useMemo(
    () => UNIFIED_STEPS.every((s) => Boolean(collapsedSteps[s.id])),
    [collapsedSteps]
  );

  const handleToggleAllSteps = () => {
    const targetCollapsed = !allStepsCollapsed;
    const next: Record<string, boolean> = {};
    UNIFIED_STEPS.forEach((s) => {
      next[s.id] = targetCollapsed;
    });
    setCollapsedSteps(next);
  };

  const filteredSteps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return UNIFIED_STEPS.filter((step) => {
      const allDone = step.tasks.every((t) => Boolean(completed[t.id]));
      if (filter === 'done' && !allDone) return false;
      if (filter === 'remaining' && allDone) return false;
      if (!q) return true;
      const searchable = [
        step.title,
        step.repo,
        step.targetPath,
        STAGE_LABELS[step.stage],
        step.summary,
        step.tip ?? '',
        ...step.tasks.map((t) => t.text),
        ...(step.files ?? []).map((f) => f.filename),
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [completed, filter, searchQuery]);

  const handleDownloadStandaloneHtml = () => {
    const html = generateStandaloneHtml(completed, notes, track, isDark);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dominating-graph-roadmap.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedHtml(true);
    window.setTimeout(() => setDownloadedHtml(false), 2200);
  };

  const handleCopyStandaloneHtml = async () => {
    const html = generateStandaloneHtml(completed, notes, track, isDark);
    try {
      await navigator.clipboard.writeText(html);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = html;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedHtml(true);
    window.setTimeout(() => setCopiedHtml(false), 2200);
  };

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#FAF9F6] dark:bg-[#0B0B0D] text-zinc-900 dark:text-zinc-100 pb-[env(safe-area-inset-bottom)]">
      {/* 3-Zone Editorial Top Bar (safe-area aware, zero mobile overflow) */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#111114]/95 backdrop-blur-md border-b border-[#E7E5E0] dark:border-zinc-800/90 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1440px] mx-auto h-14 px-3.5 sm:px-6 flex items-center justify-between gap-3 md:gap-8">
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:flex-none">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="باز کردن فهرست مراحل"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 -mr-1.5 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <a
              href="#top"
              className="text-[13.5px] sm:text-[15px] font-extrabold tracking-tight text-zinc-950 dark:text-zinc-100 truncate"
            >
              نقشه اجرای Dominating Graph
            </a>
          </div>

          {/* Zone 2: Concise Single-Line Section Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a
              href="#milestone-backend"
              className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              بک‌اند و Mock
            </a>
            <a
              href="#frontend-entry-gate"
              className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              ورود فرانت‌اند
            </a>
            <a
              href="#milestone-ai-tuning"
              className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              مدل واقعی
            </a>
            <a
              href="#milestone-release"
              className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              انتشار لینوکس
            </a>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {downloadedHtml ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-400 dark:text-teal-700" />
                  <span>ذخیره شد</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود HTML</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div id="top" className="max-w-[1440px] mx-auto flex items-start w-full">
        <Sidebar
          completedIds={completed}
          totalTasks={allTaskIds.length}
          completedCount={completedCount}
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onResetProgress={resetProgress}
          onNavigateToId={scrollToElement}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 min-w-0 w-full px-3.5 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-11 max-w-5xl">
          {/* Editorial Header */}
          <section className="pb-6 sm:pb-7 mb-6 sm:mb-7 border-b border-[#E7E5E0] dark:border-zinc-800/90">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] sm:text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
              <span>۱۲ مرحله پیوسته</span>
              <span aria-hidden="true">/</span>
              <span>بک‌اند FastAPI</span>
              <span aria-hidden="true">·</span>
              <span>اتصال فرانت‌اند در نقطه Mock</span>
              <span aria-hidden="true">·</span>
              <span>استقرار لینوکس</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 mb-3 leading-snug [text-wrap:balance]">
              مسیر اجرای واحد پروژه Dominating Graph
            </h1>

            <p className="text-[13.5px] sm:text-[15px] leading-7 sm:leading-8 text-zinc-600 dark:text-zinc-400 max-w-3xl [overflow-wrap:anywhere]">
              {MASTER_PLAN_SUMMARY}
            </p>

            {/* Quiet Linear Progress Strip */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
              <div className="w-full sm:flex-1 sm:max-w-md h-2 sm:h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-teal-700 dark:bg-teal-400 transition-[width] duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {progressPercent}%
                </span>
                <span className="hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span>
                  {completedCount} از {allTaskIds.length} کار انجام‌شده
                </span>
              </div>
            </div>
          </section>

          {/* Portrait-Safe Workspace Controls Toolbar */}
          <div className="mb-7 sm:mb-9 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
            {/* Segmented Filter: full-width 3-column grid on mobile portrait, compact inline on desktop */}
            <div className="grid grid-cols-3 md:inline-flex items-center gap-1 p-1 rounded-md bg-[#F3F2EE] dark:bg-zinc-900 border border-[#E7E5E0] dark:border-zinc-800 w-full md:w-auto">
              {(
                [
                  { id: 'all', label: 'همه (۱۲)' },
                  { id: 'remaining', label: 'باقی‌مانده' },
                  { id: 'done', label: 'انجام‌شده' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 sm:px-3 py-2 md:py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer text-center ${
                    filter === tab.id
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search + Action Buttons: stacked cleanly on mobile portrait, inline on md+ */}
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در نام فایل‌ها، مراحل یا دستورها..."
                  className="w-full pr-9 pl-3 py-2.5 sm:py-2 rounded-md border border-[#E7E5E0] dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-700/30 dark:focus:ring-teal-400/30"
                />
              </div>

              <div className="grid grid-cols-3 sm:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDark((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-md border border-[#E7E5E0] dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="تغییر حالت شب و روز"
                >
                  {isDark ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{isDark ? 'حالت روز' : 'حالت شب'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyStandaloneHtml}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-md border border-[#E7E5E0] dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedHtml ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="text-teal-700 dark:text-teal-400">کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Code2 className="w-3.5 h-3.5 shrink-0" />
                      <span>کپی HTML</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleToggleAllSteps}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-md border border-[#E7E5E0] dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                  <span>{allStepsCollapsed ? 'باز کردن' : 'جمع کردن'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Unified Single Continuous Timeline (Steps 01 -> 12 with Inline Frontend Entry Gate) */}
          {filteredSteps.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-lg border border-[#E7E5E0] dark:border-zinc-800 bg-white dark:bg-[#111114] text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                مرحله‌ای با این فیلتر یا عبارت جستجو پیدا نشد.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 rounded-md bg-zinc-950 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                نمایش همه مراحل
              </button>
            </div>
          ) : (
            <div className="w-full min-w-0">
              {filteredSteps.map((step, idx) => {
                const doneInStep = step.tasks.filter((t) => Boolean(completed[t.id])).length;
                const stepComplete = doneInStep === step.tasks.length;
                const isCollapsed = Boolean(collapsedSteps[step.id]);
                const isLast = idx === filteredSteps.length - 1;

                return (
                  <React.Fragment key={step.id}>
                    {/* Explicit 3-Condition Frontend Entry Gate right between Step 09 (Mock) and Step 10 (Frontend Entry) */}
                    {step.showFrontendGateBefore && (
                      <section
                        id="frontend-entry-gate"
                        className={`mt-9 mb-5 p-4 sm:p-5 rounded-lg border transition-colors scroll-mt-20 min-w-0 ${
                          gateReady
                            ? 'bg-teal-700/6 dark:bg-teal-400/10 border-teal-700/40 dark:border-teal-400/40'
                            : 'bg-white dark:bg-[#111114] border-teal-700/30 dark:border-teal-500/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 mb-4">
                          <div className="min-w-0">
                            <div className="flex items-start gap-2 text-xs font-bold text-teal-800 dark:text-teal-400 mb-1.5 leading-5">
                              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>
                                نقطه ورود فرانت‌اند — ۳ شرطی که دقیقاً قبل از گام ۱۰ باید تیک خورده باشند
                              </span>
                            </div>
                            <p className="text-xs sm:text-[13px] leading-6 text-zinc-600 dark:text-zinc-400 max-w-3xl [overflow-wrap:anywhere]">
                              بهترین زمان هماهنگ کردن فرانت‌اند دقیقاً بعد از قفل شدن قرارداد JSON و تست موفق بک‌اند در حالت Mock است؛ نیازی نیست صبر کنی پرامپت کامل شود یا سرور لینوکسی تهیه کنی.
                            </p>
                          </div>
                          <span className="text-xs font-mono font-semibold text-teal-800 dark:text-teal-400 tabular-nums shrink-0">
                            {gateReady
                              ? 'آماده اتصال فرانت‌اند (۳/۳)'
                              : `${gateDoneCount} از ۳ شرط`}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {FRONTEND_GATE_CONDITIONS.map((condition) => {
                            const checked = Boolean(completed[condition.id]);
                            return (
                              <label
                                key={condition.id}
                                className={`flex items-start gap-3 p-3 rounded-md border transition-colors cursor-pointer min-h-[44px] ${
                                  checked
                                    ? 'bg-teal-700/8 dark:bg-teal-400/12 border-teal-700/30 dark:border-teal-400/35'
                                    : 'bg-[#FAF9F6] dark:bg-[#0D0D10] border-[#E7E5E0] dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTask(condition.id)}
                                  className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 accent-teal-700 dark:accent-teal-400 shrink-0 cursor-pointer"
                                />
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={`text-[13.5px] sm:text-sm font-bold mb-0.5 ${
                                      checked
                                        ? 'line-through text-zinc-400 dark:text-zinc-500'
                                        : 'text-zinc-900 dark:text-zinc-100'
                                    }`}
                                  >
                                    شرط {condition.number}: {condition.title}
                                  </div>
                                  <p className="text-xs sm:text-[13px] leading-6 text-zinc-600 dark:text-zinc-400 [overflow-wrap:anywhere]">
                                    {condition.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Structural Milestone Divider inside the Single Timeline */}
                    {step.milestoneBefore && (
                      <div
                        id={step.milestoneBefore.id}
                        className={`${
                          idx === 0 ? 'mt-0' : 'mt-9 sm:mt-11'
                        } mb-4 sm:mb-5 pb-3 border-b border-[#E7E5E0] dark:border-zinc-800 scroll-mt-20`}
                      >
                        <div className="text-xs font-bold text-teal-800 dark:text-teal-400 mb-1 leading-5">
                          {step.milestoneBefore.label}
                        </div>
                        <p className="text-xs sm:text-[13px] leading-6 text-zinc-600 dark:text-zinc-400 max-w-3xl [overflow-wrap:anywhere]">
                          {step.milestoneBefore.detail}
                        </p>
                      </div>
                    )}

                    {/* Timeline Step Row */}
                    <article
                      id={step.id}
                      className="flex gap-0 sm:gap-5 mb-4 sm:mb-5 scroll-mt-20 w-full min-w-0"
                    >
                      {/* Vertical Runbook Index Rail (Desktop / Tablet) */}
                      <div className="hidden sm:flex flex-col items-center shrink-0 pt-1">
                        <div
                          className={`w-9 h-9 rounded-md border font-mono text-xs font-semibold tabular-nums flex items-center justify-center transition-colors ${
                            stepComplete
                              ? 'border-teal-700/50 dark:border-teal-400/50 bg-teal-700/10 dark:bg-teal-400/10 text-teal-800 dark:text-teal-300'
                              : 'border-[#E7E5E0] dark:border-zinc-800 bg-white dark:bg-[#111114] text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {stepComplete ? <Check className="w-4 h-4" /> : step.number}
                        </div>
                        {!isLast && (
                          <div className="w-px flex-1 bg-[#E7E5E0] dark:bg-zinc-800/90 mt-2" />
                        )}
                      </div>

                      {/* Step Content Surface */}
                      <div
                        className={`flex-1 min-w-0 w-full rounded-lg bg-white dark:bg-[#111114] border transition-colors ${
                          stepComplete
                            ? 'border-teal-700/35 dark:border-teal-500/35'
                            : 'border-[#E7E5E0] dark:border-zinc-800/90'
                        }`}
                      >
                        {/* Header: stacked cleanly on mobile portrait, split row on sm+ */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] sm:text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                              <span
                                className={`sm:hidden font-mono font-bold tabular-nums ${
                                  stepComplete
                                    ? 'text-teal-700 dark:text-teal-400'
                                    : 'text-zinc-900 dark:text-zinc-100'
                                }`}
                              >
                                {step.number}
                              </span>
                              <span className="font-medium text-teal-800 dark:text-teal-400">
                                {STAGE_LABELS[step.stage]}
                              </span>
                              <span aria-hidden="true">/</span>
                              <span className="font-mono text-[11px] break-all sm:break-normal" dir="ltr">
                                {step.repo}
                              </span>
                            </div>

                            <h2 className="text-[15.5px] sm:text-[17px] font-bold leading-snug text-zinc-950 dark:text-zinc-100">
                              {step.title}
                            </h2>

                            <div
                              className="mt-1 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 [overflow-wrap:anywhere]"
                              dir="ltr"
                            >
                              {step.targetPath}
                            </div>
                          </div>

                          {/* Step Controls: clean full-width action row on mobile portrait */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#F0EFEA] dark:border-zinc-800/80 shrink-0">
                            <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                              {doneInStep}/{step.tasks.length} انجام‌شده
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleWholeStep(step.tasks.map((t) => t.id))}
                                className={`px-3 py-2 sm:py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  stepComplete
                                    ? 'border-teal-700/30 dark:border-teal-500/40 text-teal-800 dark:text-teal-300 bg-teal-700/5 dark:bg-teal-400/10'
                                    : 'border-[#E7E5E0] dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                }`}
                              >
                                {stepComplete ? 'تکمیل شده' : 'تکمیل گام'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCollapsedSteps((prev) => ({
                                    ...prev,
                                    [step.id]: !prev[step.id],
                                  }))
                                }
                                aria-label={isCollapsed ? 'باز کردن مرحله' : 'بستن مرحله'}
                                className="inline-flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-md border border-[#E7E5E0] dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                {isCollapsed ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronUp className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Body */}
                        {!isCollapsed && (
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4 border-t border-[#F0EFEA] dark:border-zinc-800/80 space-y-4 min-w-0">
                            <p className="text-[13.5px] sm:text-sm leading-7 text-zinc-600 dark:text-zinc-300 [overflow-wrap:anywhere]">
                              {step.summary}
                            </p>

                            {step.tip && (
                              <div className="px-3.5 sm:px-4 py-3 rounded-md bg-[#F6F5F0] dark:bg-[#17171B] border border-[#E7E5E0] dark:border-zinc-800 text-xs sm:text-[13px] leading-6 text-zinc-700 dark:text-zinc-300 [overflow-wrap:anywhere]">
                                <span className="font-semibold text-zinc-950 dark:text-zinc-100">
                                  نکته اجرایی:{' '}
                                </span>
                                {step.tip}
                              </div>
                            )}

                            {/* Frontend Entry Focus Choice */}
                            {step.hasTrackChoice && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                  نقطه شروع پیاده‌سازی در ریپوی فرانت‌اند را مشخص کن:
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => setTrack('teach')}
                                    className={`text-right p-3.5 rounded-md border transition-colors cursor-pointer ${
                                      track === 'teach'
                                        ? 'border-teal-700 dark:border-teal-400 bg-teal-700/5 dark:bg-teal-400/10'
                                        : 'border-[#E7E5E0] dark:border-zinc-800 bg-[#FAF9F6] dark:bg-[#0D0D10] hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">
                                        بخش آموزش (Teach)
                                      </span>
                                      {track === 'teach' && (
                                        <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-400">
                                          انتخاب‌شده
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                                      شروع اتصال روی سؤالات داخل جریان آموزش برای بازخورد سقراطی.
                                    </p>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setTrack('practice')}
                                    className={`text-right p-3.5 rounded-md border transition-colors cursor-pointer ${
                                      track === 'practice'
                                        ? 'border-teal-700 dark:border-teal-400 bg-teal-700/5 dark:bg-teal-400/10'
                                        : 'border-[#E7E5E0] dark:border-zinc-800 bg-[#FAF9F6] dark:bg-[#0D0D10] hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">
                                        بخش تمرین (Practice)
                                      </span>
                                      {track === 'practice' && (
                                        <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-400">
                                          انتخاب‌شده
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                                      شروع مستقیم روی سؤالات self-assessed-text و تیک زدن خودکار چک‌باکس‌ها.
                                    </p>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Subtasks Checklist */}
                            <div className="space-y-2">
                              {step.tasks.map((task) => {
                                const checked = Boolean(completed[task.id]);
                                return (
                                  <label
                                    key={task.id}
                                    className={`flex items-start gap-3 p-3 rounded-md border transition-colors cursor-pointer min-h-[44px] ${
                                      checked
                                        ? 'bg-teal-700/6 dark:bg-teal-400/10 border-teal-700/25 dark:border-teal-500/30'
                                        : 'bg-[#FAF9F6] dark:bg-[#0D0D10] border-[#E7E5E0] dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleTask(task.id)}
                                      className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 accent-teal-700 dark:accent-teal-400 shrink-0 cursor-pointer"
                                    />
                                    <span
                                      className={`text-[13.5px] sm:text-sm leading-6 min-w-0 flex-1 [overflow-wrap:anywhere] ${
                                        checked
                                          ? 'line-through text-zinc-400 dark:text-zinc-500'
                                          : 'text-zinc-800 dark:text-zinc-200'
                                      }`}
                                    >
                                      {task.text}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>

                            {/* Code Files */}
                            {step.files && step.files.length > 0 && (
                              <CodeViewer files={step.files} />
                            )}

                            {/* Personal Step Note */}
                            <div>
                              <input
                                type="text"
                                aria-label={`یادداشت مرحله ${step.number}`}
                                value={notes[step.id] ?? ''}
                                onChange={(e) => updateNote(step.id, e.target.value)}
                                placeholder="یادداشت شخصی این مرحله (ذخیره خودکار در مرورگر)..."
                                className="w-full px-3 py-2.5 sm:py-2 rounded-md border border-[#E7E5E0] dark:border-zinc-800 bg-[#FAF9F6] dark:bg-[#0D0D10] text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-700/30 dark:focus:ring-teal-400/30"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Quiet Footer */}
          <footer className="mt-10 sm:mt-12 pt-6 border-t border-[#E7E5E0] dark:border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>وضعیت تیک‌ها، یادداشت‌ها و حالت شب/روز به‌صورت خودکار ذخیره می‌شوند.</span>
            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="text-right sm:text-left font-semibold text-zinc-900 dark:text-zinc-200 hover:text-teal-700 dark:hover:text-teal-400 transition-colors cursor-pointer"
            >
              دریافت نسخه تک‌فایل HTML (dominating-graph-roadmap.html)
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}

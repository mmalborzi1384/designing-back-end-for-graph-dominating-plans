import React, { useEffect, useState } from 'react';
import { Check, Folder, FileText, Moon, RotateCcw, Sun, X } from 'lucide-react';
import {
  FRONTEND_GATE_CONDITIONS,
  PROJECT_TREE,
  TreeNode,
  UNIFIED_STEPS,
} from '../data/roadmapData';

interface SidebarProps {
  completedIds: Record<string, boolean>;
  totalTasks: number;
  completedCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onResetProgress: () => void;
  onNavigateToId: (elementId: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const TreeItem: React.FC<{
  node: TreeNode;
  depth: number;
  onJump: (stepId: string) => void;
}> = ({ node, depth, onJump }) => {
  return (
    <div>
      <button
        type="button"
        onClick={() => node.stepId && onJump(node.stepId)}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        className="w-full flex items-center justify-between gap-2 py-1.5 pr-2 rounded text-left text-[11.5px] font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5 min-w-0 truncate">
          {node.type === 'folder' ? (
            <Folder className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
          ) : (
            <FileText className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
          )}
          <span
            className={
              node.type === 'folder'
                ? 'font-semibold text-zinc-900 dark:text-zinc-200 truncate'
                : 'truncate'
            }
          >
            {node.name}
          </span>
        </span>
        {node.note && (
          <span className="text-[10px] font-sans text-zinc-400 dark:text-zinc-500 whitespace-nowrap shrink-0">
            {node.note}
          </span>
        )}
      </button>
      {node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={`${node.name}-${child.name}`}
              node={child}
              depth={depth + 1}
              onJump={onJump}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  completedIds,
  totalTasks,
  completedCount,
  isDark,
  onToggleTheme,
  onResetProgress,
  onNavigateToId,
  mobileOpen,
  onCloseMobile,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const gateDone = FRONTEND_GATE_CONDITIONS.filter((g) => Boolean(completedIds[g.id])).length;
  const gateComplete = gateDone === FRONTEND_GATE_CONDITIONS.length;

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const handleJump = (id: string) => {
    onNavigateToId(id);
    onCloseMobile();
  };

  const renderPanelContent = (isMobileDrawer: boolean) => (
    <div
      className={`flex flex-col h-full bg-[#FFFFFF] dark:bg-[#111114] border-l border-[#E7E5E0] dark:border-zinc-800/90 overscroll-contain ${
        isMobileDrawer ? 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]' : ''
      }`}
    >
      {/* Dedicated Mobile Drawer Top Row (no overlap with progress %) */}
      {isMobileDrawer && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E7E5E0] dark:border-zinc-800/90 shrink-0">
          <span className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
            فهرست مراحل پروژه
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="بستن فهرست"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compact Runbook Progress */}
      <div className="p-4 sm:p-5 border-b border-[#E7E5E0] dark:border-zinc-800/90 shrink-0">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            پیشرفت نقشه واحد
          </span>
          <span className="text-base font-bold font-mono text-zinc-950 dark:text-zinc-100 tabular-nums">
            {percent}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-teal-700 dark:bg-teal-400 transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
          <span>
            {completedCount} از {totalTasks} کار انجام‌شده
          </span>
          <span>{totalTasks - completedCount} باقی‌مانده</span>
        </div>
      </div>

      {/* Unified 12-Step Index + Frontend Gate + File Tree */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            مراحل خطی اجرا (۰۱ تا ۱۲)
          </div>
          <nav className="space-y-0.5">
            {UNIFIED_STEPS.map((step) => {
              const done = step.tasks.filter((t) => Boolean(completedIds[t.id])).length;
              const allDone = done === step.tasks.length;

              return (
                <React.Fragment key={step.id}>
                  {step.showFrontendGateBefore && (
                    <div className="my-2 pt-2 border-t border-[#E7E5E0] dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleJump('frontend-entry-gate')}
                        className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-right text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
                      >
                        <span className="font-semibold text-teal-700 dark:text-teal-400 truncate">
                          ۳ شرط ورود به فرانت‌اند
                        </span>
                        <span
                          className={`text-[11px] font-mono tabular-nums shrink-0 ${
                            gateComplete
                              ? 'text-teal-700 dark:text-teal-400 font-semibold'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        >
                          {gateDone}/{FRONTEND_GATE_CONDITIONS.length}
                        </span>
                      </button>
                    </div>
                  )}

                  {step.id === 'step-11' && (
                    <div className="my-2 mx-2 pt-2 border-t border-[#E7E5E0] dark:border-zinc-800 text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400">
                      مدل واقعی و استقرار نهایی
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleJump(step.id)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-right text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {allDone ? (
                        <span className="w-4 h-4 rounded-full bg-teal-700/15 dark:bg-teal-400/15 text-teal-700 dark:text-teal-400 inline-flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className="w-4 text-center font-mono text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">
                          {step.number}
                        </span>
                      )}
                      <span
                        className={`truncate ${
                          allDone
                            ? 'text-zinc-400 dark:text-zinc-500 line-through'
                            : 'text-zinc-800 dark:text-zinc-200 font-medium'
                        }`}
                      >
                        {step.title}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">
                      {done}/{step.tasks.length}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Project File Tree */}
        <div className="pt-4 border-t border-[#E7E5E0] dark:border-zinc-800">
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              ساختار فایل‌های پروژه
            </span>
            <span className="text-[10.5px] text-zinc-400">کلیک برای پرش</span>
          </div>
          <div dir="ltr" className="space-y-2">
            {PROJECT_TREE.map((root) => (
              <TreeItem key={root.name} node={root} depth={0} onJump={handleJump} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Theme & Reset Controls */}
      <div className="p-3.5 border-t border-[#E7E5E0] dark:border-zinc-800/90 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-[#E7E5E0] dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          <span>{isDark ? 'حالت روز' : 'حالت شب'}</span>
        </button>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md border border-[#E7E5E0] dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900/60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ریست</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="px-2.5 py-2.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              تأیید
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="p-2.5 rounded-md border border-[#E7E5E0] dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              aria-label="انصراف"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-72 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]">
        {renderPanelContent(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[300px] max-w-[85vw] h-dvh shadow-2xl">
            {renderPanelContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

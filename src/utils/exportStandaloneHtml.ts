import {
  FRONTEND_GATE_CONDITIONS,
  MASTER_PLAN_SUMMARY,
  PROJECT_TREE,
  STAGE_LABELS,
  TreeNode,
  UNIFIED_STEPS,
} from '../data/roadmapData';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTreeHtml(nodes: TreeNode[], depth = 0): string {
  return nodes
    .map((node) => {
      const pad = depth * 12 + 6;
      const cls = node.type === 'folder' ? 'tree-item is-folder' : 'tree-item';
      const prefix = node.type === 'folder' ? '▸ ' : '· ';
      const note = node.note ? `<span class="tree-note">${escapeHtml(node.note)}</span>` : '';
      const target = node.stepId ? ` data-jump="${escapeHtml(node.stepId)}"` : '';
      const childrenHtml = node.children ? renderTreeHtml(node.children, depth + 1) : '';
      return `<button type="button" class="${cls}" style="padding-left:${pad}px"${target}><span class="tree-name">${prefix}${escapeHtml(node.name)}</span>${note}</button>${childrenHtml}`;
    })
    .join('\n');
}

export function generateStandaloneHtml(
  initialCompleted: Record<string, boolean>,
  initialNotes: Record<string, string>,
  initialTrack: 'teach' | 'practice',
  initialDark: boolean
): string {
  const payload = JSON.stringify({
    completed: initialCompleted,
    notes: initialNotes,
    track: initialTrack,
    dark: initialDark,
  }).replace(/<\/script/gi, '<\\/script');

  const frontendGateHtml = `
      <section class="gate-section" id="frontend-entry-gate">
        <div class="gate-head">
          <div class="gate-head-text">
            <div class="milestone-label">نقطه ورود فرانت‌اند — ۳ شرطی که دقیقاً قبل از گام ۱۰ باید تیک خورده باشند</div>
            <p class="milestone-detail">بهترین زمان برای رفتن سراغ هماهنگ کردن فرانت‌اند دقیقاً همین‌جاست؛ نیازی نیست صبر کنی پرامپت بی‌نقص شود یا سرور لینوکسی تهیه کنی.</p>
          </div>
          <span class="gate-counter tabular" id="gate-counter">0/3 شرط</span>
        </div>
        <div class="gate-list">
          ${FRONTEND_GATE_CONDITIONS.map(
            (g) => `
          <label class="task-row" data-task-id="${escapeHtml(g.id)}">
            <input type="checkbox" class="task-check" data-id="${escapeHtml(g.id)}" />
            <div class="gate-item-body">
              <div class="gate-item-title">شرط ${escapeHtml(g.number)}: ${escapeHtml(g.title)}</div>
              <div class="gate-item-desc">${escapeHtml(g.description)}</div>
            </div>
          </label>`
          ).join('\n')}
        </div>
      </section>`;

  const stepsHtml = UNIFIED_STEPS.map((step) => {
    const milestoneHtml = step.milestoneBefore
      ? `
      <div class="milestone" id="${escapeHtml(step.milestoneBefore.id)}">
        <div class="milestone-label">${escapeHtml(step.milestoneBefore.label)}</div>
        <p class="milestone-detail">${escapeHtml(step.milestoneBefore.detail)}</p>
      </div>`
      : '';

    const gateBlock = step.showFrontendGateBefore ? frontendGateHtml : '';

    const trackChoiceHtml = step.hasTrackChoice
      ? `
      <div class="track-wrap">
        <div class="track-label">انتخاب بخش شروع در ریپوی فرانت‌اند:</div>
        <div class="track-grid">
          <button type="button" class="track-option" data-track="teach">
            <strong>بخش آموزش (Teach)</strong>
            <span>اتصال ارزیاب روی سؤالات داخل جریان آموزش برای راهنمایی سقراطی</span>
          </button>
          <button type="button" class="track-option" data-track="practice">
            <strong>بخش تمرین (Practice)</strong>
            <span>شروع مستقیم روی سؤالات self-assessed-text و تیک زدن خودکار چک‌باکس‌ها</span>
          </button>
        </div>
      </div>`
      : '';

    const tasksHtml = step.tasks
      .map(
        (task) => `
        <label class="task-row" data-task-id="${escapeHtml(task.id)}">
          <input type="checkbox" class="task-check" data-id="${escapeHtml(task.id)}" />
          <span class="task-text">${escapeHtml(task.text)}</span>
        </label>`
      )
      .join('\n');

    const codeHtml =
      step.files && step.files.length > 0
        ? `
        <div class="code-box">
          <div class="code-bar">
            <div class="code-tabs" dir="ltr">
              ${step.files
                .map(
                  (file, idx) =>
                    `<button type="button" class="code-tab${idx === 0 ? ' active' : ''}" data-code-tab="${escapeHtml(
                      step.id
                    )}" data-file-index="${idx}">${escapeHtml(file.filename)}</button>`
                )
                .join('')}
            </div>
            <button type="button" class="copy-btn" data-copy-step="${escapeHtml(step.id)}">کپی</button>
          </div>
          ${step.files
            .map(
              (file, idx) => `
            <div class="code-panel${idx === 0 ? ' active' : ''}" data-code-panel="${escapeHtml(
                step.id
              )}" data-file-index="${idx}">
              ${file.note ? `<div class="code-note">${escapeHtml(file.note)}</div>` : ''}
              <pre dir="ltr"><code>${escapeHtml(file.code)}</code></pre>
            </div>`
            )
            .join('')}
        </div>`
        : '';

    return `
      ${gateBlock}
      ${milestoneHtml}
      <article class="step-item" id="${escapeHtml(step.id)}" data-step-id="${escapeHtml(step.id)}" data-search="${escapeHtml(
      `${step.title} ${step.repo} ${step.targetPath} ${step.summary} ${step.tasks.map((t) => t.text).join(' ')} ${(
        step.files ?? []
      )
        .map((f) => f.filename)
        .join(' ')}`
    )}">
        <div class="step-rail">
          <div class="step-index tabular" data-step-index="${escapeHtml(step.id)}">${escapeHtml(step.number)}</div>
          <div class="step-line"></div>
        </div>
        <div class="step-card">
          <div class="step-header">
            <div class="step-heading">
              <div class="meta-line">
                <span class="mobile-num tabular">${escapeHtml(step.number)}</span>
                <span class="meta-stage">${escapeHtml(STAGE_LABELS[step.stage])}</span>
                <span>/</span>
                <span class="mono-path" dir="ltr">${escapeHtml(step.repo)}</span>
              </div>
              <h3>${escapeHtml(step.title)}</h3>
              <div class="target-path" dir="ltr">${escapeHtml(step.targetPath)}</div>
            </div>
            <div class="step-actions">
              <span class="step-counter tabular" data-step-counter="${escapeHtml(step.id)}">0/${step.tasks.length}</span>
              <div class="step-action-btns">
                <button type="button" class="btn-ghost btn-sm" data-complete-step="${escapeHtml(step.id)}">تکمیل گام</button>
                <button type="button" class="btn-ghost btn-sm" data-toggle-step="${escapeHtml(step.id)}">بستن / باز</button>
              </div>
            </div>
          </div>

          <div class="step-body" data-step-body="${escapeHtml(step.id)}">
            <p class="step-summary">${escapeHtml(step.summary)}</p>
            ${step.tip ? `<div class="tip-box"><strong>نکته اجرایی:</strong> ${escapeHtml(step.tip)}</div>` : ''}
            ${trackChoiceHtml}
            <div class="task-list">${tasksHtml}</div>
            ${codeHtml}
            <div class="note-wrap">
              <input class="note-input" type="text" data-note-id="${escapeHtml(step.id)}" placeholder="یادداشت شخصی این مرحله (ذخیره خودکار در مرورگر)..." />
            </div>
          </div>
        </div>
      </article>`;
  }).join('\n');

  const sidebarLinks = UNIFIED_STEPS.map((step) => {
    const gateLink = step.showFrontendGateBefore
      ? `<div class="side-gate-wrap"><button type="button" class="nav-step nav-gate" data-jump="frontend-entry-gate"><span class="nav-title">۳ شرط ورود به فرانت‌اند</span><span class="nav-count tabular" id="nav-gate-counter">0/3</span></button></div>`
      : '';
    const divider =
      step.id === 'step-11'
        ? '<div class="side-divider">مدل واقعی و استقرار نهایی</div>'
        : '';
    return `${gateLink}${divider}
      <button type="button" class="nav-step" data-jump="${escapeHtml(step.id)}">
        <span class="nav-step-left">
          <span class="nav-num tabular">${escapeHtml(step.number)}</span>
          <span class="nav-title">${escapeHtml(step.title)}</span>
        </span>
        <span class="nav-count tabular" data-nav-counter="${escapeHtml(step.id)}">0/${step.tasks.length}</span>
      </button>`;
  }).join('\n');

  return `<!doctype html>
<html lang="fa" dir="rtl"${initialDark ? ' class="dark"' : ''}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>نقشه اجرای واحد پروژه Dominating Graph</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #faf9f6;
      --surface: #ffffff;
      --surface-soft: #f3f2ee;
      --border: #e7e5e0;
      --text: #18181b;
      --text-muted: #52525b;
      --text-subtle: #71717a;
      --accent: #0f766e;
      --accent-soft: rgba(15, 118, 110, 0.08);
      --cta-bg: #18181b;
      --cta-text: #fafafa;
      --code-bg: #0d0d10;
      --code-bar: #141418;
      --code-border: #27272a;
      --code-text: #e4e4e7;
      --font-sans: "Vazirmatn", system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif;
      --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    html.dark {
      --bg: #0b0b0d;
      --surface: #111114;
      --surface-soft: #1a1a1f;
      --border: #27272a;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --text-subtle: #71717a;
      --accent: #2dd4bf;
      --accent-soft: rgba(45, 212, 191, 0.1);
      --cta-bg: #f4f4f5;
      --cta-text: #09090b;
      --code-bg: #09090b;
      --code-bar: #121216;
      --code-border: #27272a;
      --code-text: #e4e4e7;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; font-family: var(--font-sans); overflow-x: clip; }
    body { margin: 0; background: var(--bg); color: var(--text); line-height: 1.75; -webkit-font-smoothing: antialiased; overflow-x: clip; padding-bottom: env(safe-area-inset-bottom); }
    .tabular { font-variant-numeric: tabular-nums; }
    code, pre, .mono-path, .target-path, .step-index { font-family: var(--font-mono); }

    .topbar {
      position: sticky; top: 0; z-index: 40;
      padding-top: env(safe-area-inset-top);
      background: color-mix(in srgb, var(--surface) 94%, transparent);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
    }
    .topbar-inner {
      max-width: 1440px; margin: 0 auto; height: 56px;
      display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 16px;
    }
    .brand-wrap { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
    .menu-btn {
      display: none; align-items: center; justify-content: center;
      width: 38px; height: 38px; border-radius: 6px; border: 1px solid var(--border);
      background: transparent; color: var(--text); font-size: 18px; cursor: pointer; flex-shrink: 0;
    }
    .brand { font-weight: 800; font-size: 14px; color: var(--text); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .top-nav { display: flex; align-items: center; gap: 22px; }
    .top-nav a { font-size: 13px; font-weight: 500; color: var(--text-muted); text-decoration: none; white-space: nowrap; }
    .top-nav a:hover { color: var(--text); }
    .btn-primary {
      background: var(--cta-bg); color: var(--cta-text); border: none; border-radius: 6px;
      padding: 8px 13px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;
    }
    .btn-ghost {
      background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px;
      padding: 7px 11px; font-family: inherit; font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap;
    }
    .btn-ghost:hover { background: var(--surface-soft); color: var(--text); }
    .btn-sm { padding: 6px 10px; font-size: 11.5px; }

    .layout { display: flex; max-width: 1440px; margin: 0 auto; min-height: calc(100vh - 56px); width: 100%; }
    .drawer-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 49; }
    .drawer-backdrop.open { display: block; }
    .sidebar {
      width: 288px; flex-shrink: 0; position: sticky; top: 56px; height: calc(100vh - 56px);
      background: var(--surface); border-left: 1px solid var(--border); display: flex; flex-direction: column;
    }
    .drawer-head { display: none; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); }
    .drawer-head strong { font-size: 14px; }
    .sidebar-progress { padding: 16px 18px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .progress-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; margin-bottom: 8px; }
    .progress-track { height: 6px; border-radius: 999px; background: var(--surface-soft); overflow: hidden; }
    .progress-fill { height: 100%; width: 0%; background: var(--accent); transition: width 180ms ease; }
    .progress-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-subtle); margin-top: 8px; }
    .sidebar-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 12px; }
    .side-heading { font-size: 11px; font-weight: 700; color: var(--text-subtle); margin: 0 0 8px; padding: 0 8px; }
    .side-gate-wrap { margin: 8px 0 4px; padding-top: 8px; border-top: 1px solid var(--border); }
    .nav-gate .nav-title { color: var(--accent); font-weight: 700; }
    .side-divider { font-size: 10.5px; font-weight: 700; color: var(--text-subtle); margin: 10px 8px 4px; padding-top: 10px; border-top: 1px solid var(--border); }
    .nav-step {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px;
      padding: 7px 8px; border: none; background: transparent; color: var(--text);
      font-family: inherit; font-size: 12px; border-radius: 6px; cursor: pointer; text-align: right;
    }
    .nav-step:hover { background: var(--surface-soft); }
    .nav-step.done .nav-title { text-decoration: line-through; color: var(--text-subtle); }
    .nav-step-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .nav-num { font-size: 11px; color: var(--text-subtle); font-family: var(--font-mono); }
    .nav-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nav-count { font-size: 11px; color: var(--text-subtle); font-family: var(--font-mono); flex-shrink: 0; }
    .tree-section { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border); }
    .tree-wrap { direction: ltr; }
    .tree-item {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 6px;
      padding: 4.5px 6px; border: none; background: transparent; color: var(--text-muted);
      font-family: var(--font-mono); font-size: 11px; border-radius: 5px; cursor: pointer; text-align: left;
    }
    .tree-item:hover { background: var(--surface-soft); color: var(--text); }
    .tree-item.is-folder { font-weight: 600; color: var(--text); }
    .tree-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tree-note { font-family: var(--font-sans); font-size: 10px; color: var(--text-subtle); white-space: nowrap; }
    .sidebar-footer { padding: 12px 14px; border-top: 1px solid var(--border); display: flex; gap: 8px; flex-shrink: 0; }
    .sidebar-footer button { flex: 1; }

    .main { flex: 1; min-width: 0; width: 100%; padding: 32px 36px 76px; max-width: 980px; }
    .kicker { font-size: 12px; color: var(--text-subtle); margin-bottom: 8px; }
    h1 { font-size: clamp(1.35rem, 2.5vw, 2.05rem); line-height: 1.4; margin: 0 0 12px; font-weight: 800; text-wrap: balance; }
    .lead { font-size: 14px; color: var(--text-muted); margin: 0 0 18px; max-width: 74ch; overflow-wrap: anywhere; }
    .inline-progress { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
    .inline-progress .progress-track { flex: 1; min-width: 180px; max-width: 380px; }
    .inline-progress-text { font-size: 12px; color: var(--text-muted); }

    .toolbar {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;
      margin-bottom: 28px;
    }
    .segmented { display: inline-flex; gap: 4px; padding: 3px; background: var(--surface-soft); border: 1px solid var(--border); border-radius: 7px; }
    .seg-btn { border: none; background: transparent; color: var(--text-muted); font-family: inherit; font-size: 12px; font-weight: 600; padding: 6px 11px; border-radius: 5px; cursor: pointer; }
    .seg-btn.active { background: var(--surface); color: var(--text); box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    .search-row { display: flex; flex: 1; min-width: 200px; gap: 8px; align-items: center; }
    .search-input { flex: 1; min-width: 0; padding: 8px 11px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text); font-family: inherit; font-size: 13px; }

    .milestone { margin: 32px 0 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); scroll-margin-top: 76px; }
    .milestone:first-child { margin-top: 0; }
    .milestone-label { font-size: 13px; font-weight: 700; color: var(--accent); margin-bottom: 4px; }
    .milestone-detail { font-size: 13px; color: var(--text-muted); margin: 0; max-width: 72ch; overflow-wrap: anywhere; }

    .gate-section {
      margin: 30px 0 18px; padding: 16px 18px; border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border));
      background: var(--surface); scroll-margin-top: 76px;
    }
    .gate-section.ready { background: var(--accent-soft); }
    .gate-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
    .gate-head-text { min-width: 0; flex: 1; }
    .gate-counter { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--accent); white-space: nowrap; }
    .gate-list { display: flex; flex-direction: column; gap: 8px; }
    .gate-item-body { min-width: 0; flex: 1; }
    .gate-item-title { font-size: 13.5px; font-weight: 700; margin-bottom: 2px; }
    .gate-item-desc { font-size: 12.5px; color: var(--text-muted); overflow-wrap: anywhere; }

    .step-item { display: flex; gap: 18px; margin-bottom: 18px; scroll-margin-top: 76px; width: 100%; min-width: 0; }
    .step-rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; padding-top: 4px; }
    .step-index {
      width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface);
      display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--text-muted);
    }
    .step-item.is-complete .step-index { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
    .step-line { width: 1px; flex: 1; background: var(--border); margin-top: 8px; }
    .step-card { flex: 1; min-width: 0; width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; }
    .step-item.is-complete .step-card { border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }
    .step-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .step-heading { min-width: 0; flex: 1; }
    .meta-line { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-subtle); margin-bottom: 4px; }
    .mobile-num { display: none; font-family: var(--font-mono); font-weight: 700; color: var(--text); }
    .meta-stage { color: var(--accent); font-weight: 600; }
    .step-heading h3 { margin: 0; font-size: 15.5px; font-weight: 700; line-height: 1.45; }
    .target-path { margin-top: 3px; font-size: 11px; color: var(--text-subtle); overflow-wrap: anywhere; }
    .step-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .step-action-btns { display: flex; align-items: center; gap: 6px; }
    .step-counter { font-size: 12px; font-family: var(--font-mono); color: var(--text-subtle); }
    .step-body { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); min-width: 0; }
    .step-body.collapsed { display: none; }
    .step-summary { font-size: 13.5px; color: var(--text-muted); margin: 0 0 14px; overflow-wrap: anywhere; }
    .tip-box { font-size: 12.5px; color: var(--text-muted); background: var(--surface-soft); border: 1px solid var(--border); border-radius: 7px; padding: 10px 14px; margin-bottom: 14px; overflow-wrap: anywhere; }

    .task-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .task-row {
      display: flex; align-items: flex-start; gap: 11px; padding: 10px 12px; border-radius: 7px;
      border: 1px solid var(--border); background: var(--bg); cursor: pointer; min-height: 44px;
    }
    .task-row.checked { background: var(--accent-soft); border-color: color-mix(in srgb, var(--accent) 35%, var(--border)); }
    .task-row.checked .task-text, .task-row.checked .gate-item-title { text-decoration: line-through; color: var(--text-subtle); }
    .task-check { width: 17px; height: 17px; margin-top: 3px; accent-color: var(--accent); flex-shrink: 0; cursor: pointer; }
    .task-text { font-size: 13.5px; min-width: 0; flex: 1; overflow-wrap: anywhere; }

    .track-wrap { margin-bottom: 14px; }
    .track-label { font-size: 12px; color: var(--text-subtle); margin-bottom: 8px; }
    .track-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .track-option { text-align: right; padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-family: inherit; cursor: pointer; }
    .track-option.active { border-color: var(--accent); background: var(--accent-soft); }
    .track-option strong { display: block; font-size: 13px; margin-bottom: 3px; }
    .track-option span { font-size: 12px; color: var(--text-muted); }

    .code-box { width: 100%; max-width: 100%; min-width: 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--code-border); background: var(--code-bg); margin-bottom: 14px; }
    .code-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 10px; background: var(--code-bar); border-bottom: 1px solid var(--code-border); min-width: 0; }
    .code-tabs { display: flex; gap: 4px; overflow-x: auto; min-width: 0; flex: 1; }
    .code-tab { border: none; background: transparent; color: #a1a1aa; font-family: var(--font-mono); font-size: 11.5px; padding: 5px 9px; border-radius: 5px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
    .code-tab.active { background: #27272a; color: #fafafa; }
    .copy-btn { border: 1px solid #3f3f46; background: #27272a; color: #e4e4e7; font-family: inherit; font-size: 11.5px; padding: 5px 10px; border-radius: 5px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
    .code-panel { display: none; }
    .code-panel.active { display: block; }
    .code-note { padding: 7px 12px; font-size: 12px; color: #a1a1aa; border-bottom: 1px solid #27272a; background: #111115; overflow-wrap: anywhere; }
    pre { margin: 0; padding: 12px 14px; overflow-x: auto; max-width: 100%; font-size: 12px; line-height: 1.65; color: var(--code-text); -webkit-overflow-scrolling: touch; }

    .note-input { width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-family: inherit; font-size: 12.5px; }
    .hidden-by-filter { display: none !important; }

    @media (max-width: 960px) {
      .menu-btn { display: inline-flex; }
      .top-nav { display: none; }
      .sidebar {
        position: fixed; top: 0; right: 0; bottom: 0; z-index: 50;
        width: 300px; max-width: 85vw; height: 100dvh;
        transform: translateX(105%); transition: transform 200ms ease;
        padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);
      }
      .sidebar.open { transform: translateX(0); }
      .drawer-head { display: flex; }
      .step-rail { display: none; }
      .mobile-num { display: inline; }
      .step-item { gap: 0; }
      .main { padding: 20px 14px 56px; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .segmented { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; }
      .seg-btn { text-align: center; padding: 8px 6px; }
      .search-row { flex-direction: column; align-items: stretch; }
      .step-header { flex-direction: column; }
      .step-actions { width: 100%; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border); }
      .track-grid { grid-template-columns: 1fr; }
    }
    @media print {
      .topbar, .sidebar, .drawer-backdrop, .toolbar, .copy-btn, .step-actions button { display: none !important; }
      .main { max-width: 100%; padding: 0; }
      .step-body.collapsed { display: block !important; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand-wrap">
        <button type="button" class="menu-btn" id="btn-menu" aria-label="فهرست مراحل">☰</button>
        <a href="#top" class="brand">نقشه اجرای Dominating Graph</a>
      </div>
      <nav class="top-nav">
        <a href="#milestone-backend">بک‌اند و Mock</a>
        <a href="#frontend-entry-gate">ورود فرانت‌اند</a>
        <a href="#milestone-ai-tuning">مدل واقعی</a>
        <a href="#milestone-release">انتشار لینوکس</a>
      </nav>
      <button type="button" class="btn-primary" id="btn-theme-top">حالت شب</button>
    </div>
  </header>

  <div class="drawer-backdrop" id="drawer-backdrop"></div>

  <div class="layout" id="top">
    <aside class="sidebar" id="sidebar">
      <div class="drawer-head">
        <strong>فهرست مراحل پروژه</strong>
        <button type="button" class="btn-ghost btn-sm" id="btn-close-drawer">بستن</button>
      </div>
      <div class="sidebar-progress">
        <div class="progress-head">
          <span>پیشرفت نقشه واحد</span>
          <strong class="tabular" id="progress-percent">0%</strong>
        </div>
        <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
        <div class="progress-meta tabular">
          <span id="progress-done">0 کار انجام‌شده</span>
          <span id="progress-left">0 باقی‌مانده</span>
        </div>
      </div>

      <div class="sidebar-scroll">
        <div class="side-heading">مراحل خطی (۰۱ تا ۱۲)</div>
        ${sidebarLinks}

        <div class="tree-section">
          <div class="side-heading">ساختار فایل‌های پروژه</div>
          <div class="tree-wrap">${renderTreeHtml(PROJECT_TREE)}</div>
        </div>
      </div>

      <div class="sidebar-footer">
        <button type="button" class="btn-ghost" id="btn-print">چاپ / PDF</button>
        <button type="button" class="btn-ghost" id="btn-reset">ریست تیک‌ها</button>
      </div>
    </aside>

    <main class="main">
      <div class="kicker">مسیر اجرای یکپارچه · ۱۲ مرحله خطی + دروازه ورود فرانت‌اند</div>
      <h1>نقشه راه واحد پروژه Dominating Graph</h1>
      <p class="lead">${escapeHtml(MASTER_PLAN_SUMMARY)}</p>

      <div class="inline-progress">
        <div class="progress-track"><div class="progress-fill" id="progress-fill-inline"></div></div>
        <span class="inline-progress-text tabular" id="progress-inline-text">0% · 0 انجام‌شده</span>
      </div>

      <div class="toolbar">
        <div class="segmented">
          <button type="button" class="seg-btn active" data-filter="all">همه (۱۲)</button>
          <button type="button" class="seg-btn" data-filter="remaining">باقی‌مانده</button>
          <button type="button" class="seg-btn" data-filter="done">انجام‌شده</button>
        </div>
        <div class="search-row">
          <input type="search" id="search-box" class="search-input" placeholder="جستجو در مراحل، فایل‌ها یا کدها..." />
          <button type="button" class="btn-ghost" id="btn-toggle-all">جمع / باز همه</button>
        </div>
      </div>

      ${stepsHtml}
    </main>
  </div>

  <script>
    (function () {
      const STORAGE_KEY = 'dominating-graph-unified-v3';
      const INITIAL_SEED = ${payload};
      const STEP_TASKS = ${JSON.stringify(
        Object.fromEntries(UNIFIED_STEPS.map((s) => [s.id, s.tasks.map((t) => t.id)]))
      )};
      const GATE_IDS = ${JSON.stringify(FRONTEND_GATE_CONDITIONS.map((g) => g.id))};

      function loadState() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
        return INITIAL_SEED;
      }

      const state = loadState();
      if (!state.completed) state.completed = {};
      if (!state.notes) state.notes = {};
      if (!state.track) state.track = 'practice';

      function saveState() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
      }

      function applyTheme() {
        document.documentElement.classList.toggle('dark', Boolean(state.dark));
        const btn = document.getElementById('btn-theme-top');
        if (btn) btn.textContent = state.dark ? 'حالت روز' : 'حالت شب';
      }

      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('drawer-backdrop');
      function setDrawer(open) {
        if (!sidebar || !backdrop) return;
        sidebar.classList.toggle('open', open);
        backdrop.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      }

      function updateUI() {
        const checks = Array.from(document.querySelectorAll('.task-check'));
        let doneCount = 0;

        checks.forEach((cb) => {
          const id = cb.dataset.id;
          const isChecked = Boolean(state.completed[id]);
          cb.checked = isChecked;
          if (isChecked) doneCount++;
          const row = cb.closest('.task-row');
          if (row) row.classList.toggle('checked', isChecked);
        });

        const total = checks.length;
        const pct = total ? Math.round((doneCount / total) * 100) : 0;
        document.getElementById('progress-percent').textContent = pct + '%';
        document.getElementById('progress-fill').style.width = pct + '%';
        document.getElementById('progress-done').textContent = doneCount + ' از ' + total + ' انجام‌شده';
        document.getElementById('progress-left').textContent = (total - doneCount) + ' باقی‌مانده';

        const inlineFill = document.getElementById('progress-fill-inline');
        const inlineText = document.getElementById('progress-inline-text');
        if (inlineFill) inlineFill.style.width = pct + '%';
        if (inlineText) inlineText.textContent = pct + '% · ' + doneCount + ' از ' + total + ' انجام‌شده';

        const gateDone = GATE_IDS.filter((id) => state.completed[id]).length;
        const gateCounter = document.getElementById('gate-counter');
        const navGateCounter = document.getElementById('nav-gate-counter');
        const gateSection = document.getElementById('frontend-entry-gate');
        if (gateCounter) gateCounter.textContent = gateDone + '/' + GATE_IDS.length + ' شرط';
        if (navGateCounter) navGateCounter.textContent = gateDone + '/' + GATE_IDS.length;
        if (gateSection) gateSection.classList.toggle('ready', gateDone === GATE_IDS.length);

        Object.keys(STEP_TASKS).forEach((stepId) => {
          const ids = STEP_TASKS[stepId];
          const done = ids.filter((id) => state.completed[id]).length;
          const isFull = done === ids.length;
          const c = document.querySelector('[data-step-counter="' + stepId + '"]');
          if (c) c.textContent = done + '/' + ids.length;
          const nc = document.querySelector('[data-nav-counter="' + stepId + '"]');
          if (nc) {
            nc.textContent = done + '/' + ids.length;
            const navBtn = nc.closest('.nav-step');
            if (navBtn) navBtn.classList.toggle('done', isFull);
          }
          const item = document.querySelector('[data-step-id="' + stepId + '"]');
          if (item) item.classList.toggle('is-complete', isFull);
        });

        document.querySelectorAll('.note-input').forEach((input) => {
          const id = input.dataset.noteId;
          if (input.value !== (state.notes[id] || '')) input.value = state.notes[id] || '';
        });

        document.querySelectorAll('.track-option').forEach((btn) => {
          btn.classList.toggle('active', btn.dataset.track === state.track);
        });

        applyFilters();
      }

      let currentFilter = 'all';
      let currentQuery = '';

      function applyFilters() {
        document.querySelectorAll('.step-item').forEach((item) => {
          const stepId = item.dataset.stepId;
          const ids = STEP_TASKS[stepId] || [];
          const allDone = ids.length > 0 && ids.every((id) => state.completed[id]);
          const hay = (item.dataset.search || '').toLowerCase();
          const matchSearch = !currentQuery || hay.includes(currentQuery);
          const matchFilter =
            currentFilter === 'all' ||
            (currentFilter === 'done' && allDone) ||
            (currentFilter === 'remaining' && !allDone);
          item.classList.toggle('hidden-by-filter', !(matchSearch && matchFilter));
        });
      }

      document.addEventListener('change', (e) => {
        if (e.target.classList.contains('task-check')) {
          state.completed[e.target.dataset.id] = e.target.checked;
          saveState();
          updateUI();
        }
      });

      document.addEventListener('input', (e) => {
        if (e.target.classList.contains('note-input')) {
          state.notes[e.target.dataset.noteId] = e.target.value;
          saveState();
        }
        if (e.target.id === 'search-box') {
          currentQuery = e.target.value.trim().toLowerCase();
          applyFilters();
        }
      });

      document.addEventListener('click', (e) => {
        const jumpBtn = e.target.closest('[data-jump]');
        if (jumpBtn) {
          setDrawer(false);
          const el = document.getElementById(jumpBtn.dataset.jump);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        const tabBtn = e.target.closest('[data-code-tab]');
        if (tabBtn) {
          const stepId = tabBtn.dataset.codeTab;
          const fileIdx = tabBtn.dataset.fileIndex;
          document.querySelectorAll('[data-code-tab="' + stepId + '"]').forEach((b) => b.classList.toggle('active', b === tabBtn));
          document.querySelectorAll('[data-code-panel="' + stepId + '"]').forEach((p) => p.classList.toggle('active', p.dataset.fileIndex === fileIdx));
          return;
        }
        const copyBtn = e.target.closest('[data-copy-step]');
        if (copyBtn) {
          const stepId = copyBtn.dataset.copyStep;
          const activePanel = document.querySelector('[data-code-panel="' + stepId + '"].active code');
          if (activePanel) {
            navigator.clipboard.writeText(activePanel.textContent || '').then(() => {
              const old = copyBtn.textContent;
              copyBtn.textContent = 'کپی شد';
              setTimeout(() => (copyBtn.textContent = old), 1600);
            });
          }
          return;
        }
        const completeBtn = e.target.closest('[data-complete-step]');
        if (completeBtn) {
          const ids = STEP_TASKS[completeBtn.dataset.completeStep] || [];
          const allDone = ids.every((id) => state.completed[id]);
          ids.forEach((id) => (state.completed[id] = !allDone));
          saveState();
          updateUI();
          return;
        }
        const toggleBtn = e.target.closest('[data-toggle-step]');
        if (toggleBtn) {
          const body = document.querySelector('[data-step-body="' + toggleBtn.dataset.toggleStep + '"]');
          if (body) body.classList.toggle('collapsed');
          return;
        }
        const filterBtn = e.target.closest('[data-filter]');
        if (filterBtn) {
          currentFilter = filterBtn.dataset.filter;
          document.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === filterBtn));
          applyFilters();
          return;
        }
        const trackBtn = e.target.closest('[data-track]');
        if (trackBtn) {
          state.track = trackBtn.dataset.track;
          saveState();
          updateUI();
        }
      });

      document.getElementById('btn-menu').addEventListener('click', () => setDrawer(true));
      document.getElementById('btn-close-drawer').addEventListener('click', () => setDrawer(false));
      backdrop.addEventListener('click', () => setDrawer(false));

      document.getElementById('btn-theme-top').addEventListener('click', () => {
        state.dark = !state.dark;
        saveState();
        applyTheme();
      });

      let resetArmed = false;
      const resetBtn = document.getElementById('btn-reset');
      resetBtn.addEventListener('click', () => {
        if (!resetArmed) {
          resetArmed = true;
          resetBtn.textContent = 'کلیک مجدد برای ریست';
          setTimeout(() => {
            resetArmed = false;
            resetBtn.textContent = 'ریست تیک‌ها';
          }, 3000);
          return;
        }
        resetArmed = false;
        resetBtn.textContent = 'ریست تیک‌ها';
        state.completed = {};
        state.notes = {};
        saveState();
        updateUI();
      });

      let allCollapsed = false;
      document.getElementById('btn-toggle-all').addEventListener('click', () => {
        allCollapsed = !allCollapsed;
        document.querySelectorAll('.step-body').forEach((b) => b.classList.toggle('collapsed', allCollapsed));
      });

      document.getElementById('btn-print').addEventListener('click', () => window.print());

      applyTheme();
      updateUI();
    })();
  </script>
</body>
</html>`;
}

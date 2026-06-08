/* ─────────────────────────────────────────
   Green Hat — app.js
   Material You PWA for beginner CNC operators
   ───────────────────────────────────────── */

'use strict';

// ── State ──────────────────────────────────
const state = {
  currentNav: 'notes',
  currentStep: 1,
  selectedToolType: 'OD',
  savedJobs: [],
  savedSF: [],
  noteLog: [],
  setupData: {},
};

// ── Init ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  initWelcome();
  switchNav('notes', document.querySelector('.nav-item[data-nav="notes"]'));
  bindEvents();
  updateJobBadge();
  renderSavedJobsInline();
  renderSavedSF();
  restoreSetup();
  restoreNotes();

  // Scroll → elevate top bar
  window.addEventListener('scroll', () => {
    document.getElementById('topBar').classList.toggle('elevated', window.scrollY > 4);
  });

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});

// ── Storage ────────────────────────────────
function loadFromStorage() {
  state.savedJobs = JSON.parse(localStorage.getItem('cnc_helper_jobs') || '[]');
  state.savedSF   = JSON.parse(localStorage.getItem('cnc_helper_sf')   || '[]');
  state.noteLog   = JSON.parse(localStorage.getItem('green_hat_note_log') || '[]');
  state.setupData = JSON.parse(localStorage.getItem('cnc_helper_setup') || '{}');
}

function persist() {
  localStorage.setItem('cnc_helper_jobs',  JSON.stringify(state.savedJobs));
  localStorage.setItem('cnc_helper_sf',    JSON.stringify(state.savedSF));
  localStorage.setItem('green_hat_note_log', JSON.stringify(state.noteLog));
  localStorage.setItem('cnc_helper_setup', JSON.stringify(state.setupData));
}

// ── Navigation ────────────────────────────
function switchNav(key, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const sec = document.querySelector(`[data-nav="${key}"]`);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');

  state.currentNav = key;
  if (key === 'notes') renderHandoffSummary();
  window.scrollTo(0, 0);
}

// ── Bind Events ────────────────────────────
function bindEvents() {
  // Menu
  document.getElementById('menuBtn').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('overflowMenu').classList.toggle('open');
    document.getElementById('menuBackdrop').classList.toggle('open');
  });
  document.getElementById('menuBackdrop').addEventListener('click', closeMenu);

  // Save/load shortcuts
  document.getElementById('saveBtn').addEventListener('click', saveCurrentJob);
  document.getElementById('saveJobInline').addEventListener('click', saveCurrentJob);
  document.getElementById('loadJobInline').addEventListener('click', openLoadModal);
  document.getElementById('addLogBtn').addEventListener('click', addLogEntry);
  document.getElementById('refreshHandoffBtn').addEventListener('click', renderHandoffSummary);
  document.getElementById('exportHandoffBtn').addEventListener('click', exportHandoff);

  // Menu items
  document.getElementById('newJobBtn').addEventListener('click', () => { newJob(); closeMenu(); });
  document.getElementById('loadJobBtn').addEventListener('click', () => { openLoadModal(); closeMenu(); });
  document.getElementById('exportBtn').addEventListener('click', () => { exportJSON(); closeMenu(); });
  document.getElementById('importBtn').addEventListener('click', () => { document.getElementById('importFile').click(); closeMenu(); });
  document.getElementById('clearBtn').addEventListener('click', () => { clearAll(); closeMenu(); });
  document.getElementById('importFile').addEventListener('change', importJSON);

  // Tool type chips
  document.querySelectorAll('#toolTypeChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#toolTypeChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedToolType = chip.dataset.val;
    });
  });

  // RPM calculator live
  document.getElementById('sfmInput').addEventListener('input', calcRPM);
  document.getElementById('diaRpmInput').addEventListener('input', calcRPM);

  // Save speeds & feeds
  document.getElementById('saveSFBtn').addEventListener('click', saveSF);
  document.getElementById('saveSetupBtn').addEventListener('click', saveSetup);
}

function closeMenu() {
  document.getElementById('overflowMenu').classList.remove('open');
  document.getElementById('menuBackdrop').classList.remove('open');
}

// ── Job Notes ─────────────────────────────
function getJobFields() {
  return {
    partNumber:  val('partNumber'),
    opNumber:    val('opNumber'),
    machineName: val('machineName'),
    material:    val('materialField'),
    setupStatus: val('setupStatus') || 'Ready',
    attentionFlag: val('attentionFlag'),
    lastSetupBy: val('lastSetupBy'),
    lastRunBy: val('lastRunBy'),
    toolNotes:   val('toolNotes'),
    setupNotes:  val('setupNotes'),
    savedAt:     new Date().toLocaleString(),
  };
}

function populateJobFields(job) {
  setVal('partNumber',   job.partNumber);
  setVal('opNumber',     job.opNumber);
  setVal('machineName',  job.machineName);
  setVal('materialField',job.material);
  setVal('setupStatus',  job.setupStatus || 'Ready');
  setVal('attentionFlag',job.attentionFlag);
  setVal('lastSetupBy',  job.lastSetupBy);
  setVal('lastRunBy',    job.lastRunBy);
  setVal('toolNotes',    job.toolNotes);
  setVal('setupNotes',   job.setupNotes);
  renderHandoffSummary();
}

function saveCurrentJob() {
  const job = getJobFields();
  if (!job.partNumber) { showToast('Enter a Part Number first'); return; }

  const idx = state.savedJobs.findIndex(j => j.partNumber === job.partNumber);
  if (idx >= 0) state.savedJobs[idx] = job;
  else state.savedJobs.unshift(job);

  persist();
  updateJobBadge();
  renderSavedJobsInline();
  renderHandoffSummary();
  setActionStatus(`Saved ${job.partNumber} on this device. Export JSON if you need a backup or another device.`);
  showToast(`Saved: ${job.partNumber}`);
}

function updateJobBadge() {
  const pn = val('partNumber');
  document.getElementById('jobBadge').textContent = pn ? pn : '';
}

function renderSavedJobsInline() {
  const el = document.getElementById('savedJobsList');
  if (!state.savedJobs.length) { el.innerHTML = '<p class="empty-state">No saved jobs yet. Save this job to keep it on this device.</p>'; return; }

  el.innerHTML = state.savedJobs.map((j, i) => `
    <div class="saved-item">
      <div>
        <div class="saved-item-label">${esc(j.partNumber)}</div>
        <div class="saved-item-sub">${esc(j.opNumber || '')} ${j.machineName ? '· ' + esc(j.machineName) : ''} · ${esc(j.setupStatus || 'Ready')} · ${esc(j.savedAt || '')}</div>
      </div>
      <div class="saved-item-actions">
        <button class="icon-btn" onclick="loadJob(${i})" title="Load"><span class="material-icons-round">folder_open</span></button>
        <button class="icon-btn" onclick="deleteJob(${i})" title="Delete"><span class="material-icons-round">delete_outline</span></button>
      </div>
    </div>
  `).join('');
}

function loadJob(i) {
  populateJobFields(state.savedJobs[i]);
  updateJobBadge();
  closeLoadModal();
  setActionStatus(`Loaded ${state.savedJobs[i].partNumber}. Review status, notes, and checklist before running.`);
  showToast(`Loaded: ${state.savedJobs[i].partNumber}`);
}

function deleteJob(i) {
  const pn = state.savedJobs[i].partNumber;
  state.savedJobs.splice(i, 1);
  persist();
  renderSavedJobsInline();
  renderLoadModal();
  showToast(`Deleted: ${pn}`);
}

function newJob() {
  ['partNumber','opNumber','machineName','materialField','attentionFlag','lastSetupBy','lastRunBy','toolNotes','setupNotes'].forEach(id => setVal(id, ''));
  setVal('setupStatus', 'Ready');
  updateJobBadge();
  renderHandoffSummary();
  switchNav('notes', document.querySelector('.nav-item[data-nav="notes"]'));
  showToast('New job started');
}

function restoreNotes() {
  const last = state.savedJobs[0];
  if (last) { populateJobFields(last); updateJobBadge(); }
  renderNoteLog();
  renderHandoffSummary();
}

function addLogEntry() {
  const job = getJobFields();
  const text = [job.attentionFlag, job.setupNotes, job.toolNotes].filter(Boolean).join(' | ');
  if (!text) { showToast('Add setup notes or an attention flag first'); return; }

  state.noteLog.unshift({
    time: new Date().toLocaleString(),
    partNumber: job.partNumber,
    opNumber: job.opNumber,
    by: job.lastSetupBy || job.lastRunBy,
    status: job.setupStatus,
    text,
  });
  state.noteLog = state.noteLog.slice(0, 30);
  persist();
  renderNoteLog();
  renderHandoffSummary();
  setActionStatus('Shift handoff log entry added. It is saved on this device and included in JSON export.');
  showToast('Log entry added');
}

function renderNoteLog() {
  const el = document.getElementById('noteLogList');
  if (!el) return;
  if (!state.noteLog.length) {
    el.innerHTML = '<p class="empty-state">No note log entries yet.</p>';
    return;
  }
  el.innerHTML = state.noteLog.map(entry => `
    <div class="saved-item log-entry">
      <div>
        <div class="saved-item-label">${esc(entry.partNumber || 'No part number')} ${entry.opNumber ? '· ' + esc(entry.opNumber) : ''}</div>
        <div class="saved-item-sub">${esc(entry.time)} ${entry.by ? '· ' + esc(entry.by) : ''} · ${esc(entry.status || 'Ready')}</div>
        <div class="log-entry-text">${esc(entry.text)}</div>
      </div>
    </div>
  `).join('');
}

function handoffData() {
  const job = getJobFields();
  return {
    generatedAt: new Date().toLocaleString(),
    job,
    setup: state.setupData,
    lastLog: state.noteLog[0] || null,
  };
}

function renderHandoffSummary() {
  const el = document.getElementById('handoffSummary');
  if (!el) return;
  const data = handoffData();
  const job = data.job;
  const rows = [
    ['Part Number', job.partNumber || '—'],
    ['Operation', job.opNumber || '—'],
    ['Machine / Cell', job.machineName || '—'],
    ['Material', job.material || '—'],
    ['Setup Status', job.setupStatus || 'Ready'],
    ['Attention Flag', job.attentionFlag || 'None'],
    ['Last Setup By', job.lastSetupBy || '—'],
    ['Last Run By', job.lastRunBy || '—'],
    ['Tool Notes', job.toolNotes || '—'],
    ['Setup Notes', job.setupNotes || '—'],
    ['Last Log', data.lastLog ? `${data.lastLog.time}: ${data.lastLog.text}` : 'None'],
  ];
  el.innerHTML = rows.map(([label, value]) => `
    <div class="handoff-row">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
    </div>
  `).join('');
}

function exportHandoff() {
  const data = handoffData();
  const name = (data.job.partNumber || 'green-hat-handoff').replace(/[^a-z0-9-_]+/gi, '-');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-handoff-${datestamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setActionStatus('Handoff summary exported as JSON. Keep it with the setup or shift notes.');
  showToast('Handoff exported');
}

// ── Load Modal ────────────────────────────
function openLoadModal() {
  renderLoadModal();
  document.getElementById('loadModal').style.display = 'flex';
}

function closeLoadModal() {
  document.getElementById('loadModal').style.display = 'none';
}

function renderLoadModal() {
  const el = document.getElementById('loadJobListModal');
  if (!state.savedJobs.length) {
    el.innerHTML = '<p class="empty-state">No saved jobs yet.</p>';
    return;
  }
  el.innerHTML = state.savedJobs.map((j, i) => `
    <div class="saved-item" style="cursor:pointer" onclick="loadJob(${i})">
      <div>
        <div class="saved-item-label">${esc(j.partNumber)}</div>
        <div class="saved-item-sub">${esc(j.opNumber || '')} ${j.machineName ? '· ' + esc(j.machineName) : ''} · ${esc(j.setupStatus || 'Ready')} · ${esc(j.savedAt || '')}</div>
      </div>
      <span class="material-icons-round" style="color:var(--md-primary)">chevron_right</span>
    </div>
  `).join('');
}

// close modal on backdrop click
document.addEventListener('click', e => {
  const modal = document.getElementById('loadModal');
  if (modal.style.display === 'flex' && e.target === modal) closeLoadModal();
});

// ── Touch-Off Wizard ──────────────────────
function goStep(n) {
  state.currentStep = n;

  document.querySelectorAll('.wizard-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.wizard-step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 === n) s.classList.add('active');
    else if (i + 1 < n) s.classList.add('done');
  });

  const panel = document.getElementById(`step${n}`);
  if (panel) panel.classList.add('active');

  window.scrollTo(0, 0);
}

function calcMove() {
  const touchDia = parseFloat(val('touchDia'));
  const targetDia = parseFloat(val('targetDia'));
  const zFace = parseFloat(val('zFace')) || 0;
  const plunge = parseFloat(val('plungeDepth')) || 0;
  const zDir = val('zDirection');
  const toolType = state.selectedToolType;

  if (isNaN(touchDia) || isNaN(targetDia)) {
    showToast('Enter touch-off and target diameters');
    return;
  }

  const xDiameterMove = targetDia - touchDia;
  const radialTravel  = xDiameterMove / 2;
  const zMove = zDir === 'minus' ? -Math.abs(zFace) : Math.abs(zFace);
  const direction = xDiameterMove < 0 ? 'inward (cutting)' : 'outward';

  // Warnings
  const warn = document.getElementById('moveWarning');
  const warnText = document.getElementById('moveWarningText');
  warn.style.display = 'none';

  if (toolType === 'OD' && targetDia > touchDia) {
    warn.style.display = 'flex';
    warnText.textContent = 'Target diameter is larger than touch-off — tool moving outward. Verify this is intentional for an OD operation.';
  }
  if (toolType === 'ID' && targetDia < touchDia) {
    warn.style.display = 'flex';
    warnText.textContent = 'Target diameter is smaller than touch-off — verify for ID boring operation.';
  }
  if (Math.abs(xDiameterMove) < 0.0001) {
    warn.style.display = 'flex';
    warnText.textContent = 'Touch-off and target diameters are the same — no X move needed.';
  }

  document.getElementById('moveResults').innerHTML = `
    <div class="result-card">
      <div class="result-card-label">X Target (dia)</div>
      <div class="result-card-value">${fmt(targetDia)}</div>
      <div class="result-card-unit">in diameter · ${direction}</div>
    </div>
    <div class="result-card">
      <div class="result-card-label">X Move (dia)</div>
      <div class="result-card-value">${xDiameterMove >= 0 ? '+' : ''}${fmt(xDiameterMove)}</div>
      <div class="result-card-unit">in diameter</div>
    </div>
    <div class="result-card">
      <div class="result-card-label">Radial Travel</div>
      <div class="result-card-value">${radialTravel >= 0 ? '+' : ''}${fmt(radialTravel)}</div>
      <div class="result-card-unit">in (physical tool move)</div>
    </div>
    <div class="result-card">
      <div class="result-card-label">Z Face</div>
      <div class="result-card-value">${fmt(zMove)}</div>
      <div class="result-card-unit">in ${plunge ? '+ ' + fmt(plunge) + ' plunge' : ''}</div>
    </div>
  `;

  goStep(3);
}

function resetWizard() {
  ['touchDia','targetDia','zFace','plungeDepth'].forEach(id => setVal(id, ''));
  document.querySelectorAll('#verifyChecklist .check-item').forEach(i => i.classList.remove('checked'));
  updateCheckProgress();
  goStep(1);
}

// ── Checklist ─────────────────────────────
function toggleCheck(el) {
  el.classList.toggle('checked');
  updateCheckProgress();
}

function updateCheckProgress() {
  const items = document.querySelectorAll('#verifyChecklist .check-item');
  const done = document.querySelectorAll('#verifyChecklist .check-item.checked').length;
  document.getElementById('checkProgress').textContent = `${done} / ${items.length} checked`;
  if (done === items.length) {
    document.getElementById('checkProgress').style.color = 'var(--md-success)';
    document.getElementById('checkProgress').textContent = `✓ All ${items.length} items checked — ready to cut`;
  } else {
    document.getElementById('checkProgress').style.color = 'var(--md-primary)';
  }
}

// ── Setup Reference ────────────────────────
function saveSetup() {
  state.setupData = {
    workOffset:      val('workOffset'),
    stockDia:        val('stockDia'),
    stockLen:        val('stockLen'),
    stickout:        val('stickout'),
    chuckJaws:       val('chuckJaws'),
    coolant:         val('coolant'),
    inspectionNotes: val('inspectionNotes'),
    refNotes:        val('refNotes'),
  };
  persist();
  setActionStatus('Setup reference saved on this device.');
  showToast('Setup saved');
}

function restoreSetup() {
  const s = state.setupData;
  if (!s) return;
  setVal('workOffset',      s.workOffset);
  setVal('stockDia',        s.stockDia);
  setVal('stockLen',        s.stockLen);
  setVal('stickout',        s.stickout);
  setVal('chuckJaws',       s.chuckJaws);
  setVal('coolant',         s.coolant);
  setVal('inspectionNotes', s.inspectionNotes);
  setVal('refNotes',        s.refNotes);
}

// ── Welcome Banner ────────────────────────
function initWelcome() {
  const dismissed = localStorage.getItem('gh_welcome_dismissed');
  if (dismissed) document.getElementById('welcomeBanner').style.display = 'none';
}

function dismissWelcome() {
  document.getElementById('welcomeBanner').style.display = 'none';
  localStorage.setItem('gh_welcome_dismissed', '1');
}

// ── Speeds & Feeds ─────────────────────────
function calcRPM() {
  const sfm  = parseFloat(val('sfmInput'));
  const dia  = parseFloat(val('diaRpmInput'));

  if (!isNaN(sfm) && !isNaN(dia) && dia > 0) {
    const rpm = (sfm * 3.82) / dia;
    document.getElementById('rpmOut').textContent = Math.round(rpm).toLocaleString() + ' RPM';
    // Reverse: SFM from that RPM + diameter
    const sfmBack = (Math.round(rpm) * dia) / 3.82;
    document.getElementById('sfmOut').textContent = Math.round(sfmBack).toLocaleString() + ' SFM';
  } else if (!isNaN(dia) && isNaN(sfm)) {
    document.getElementById('rpmOut').textContent = '—';
    document.getElementById('sfmOut').textContent = '—';
  } else {
    document.getElementById('rpmOut').textContent = '—';
    document.getElementById('sfmOut').textContent = '—';
  }
}

function saveSF() {
  const label   = val('sfLabel');
  const spindle = val('sfSpindle');
  const feed    = val('sfFeed');
  const units   = val('sfFeedLabel') || 'in/rev';
  if (!label) { showToast('Enter a label'); return; }

  state.savedSF.unshift({ label, spindle, feed, units, savedAt: new Date().toLocaleString() });
  persist();
  renderSavedSF();
  setVal('sfLabel', ''); setVal('sfSpindle', ''); setVal('sfFeed', ''); setVal('sfFeedLabel', '');
  setActionStatus(`Saved speeds/feeds preset: ${label}.`);
  showToast(`Saved: ${label}`);
}

function deleteSF(i) {
  state.savedSF.splice(i, 1);
  persist();
  renderSavedSF();
}

function renderSavedSF() {
  const el = document.getElementById('savedSFList');
  if (!state.savedSF.length) { el.innerHTML = '<p class="empty-state">No saved speeds or feeds yet. Add one above to get started.</p>'; return; }

  el.innerHTML = state.savedSF.map((s, i) => `
    <div class="saved-item">
      <div>
        <div class="saved-item-label">${esc(s.label)}</div>
        <div class="saved-item-sub">
          ${s.spindle ? 'S: ' + esc(s.spindle) : ''}
          ${s.feed ? '· F: ' + esc(s.feed) + ' ' + esc(s.units) : ''}
        </div>
      </div>
      <div class="saved-item-actions">
        <button class="icon-btn" onclick="deleteSF(${i})" title="Delete"><span class="material-icons-round">delete_outline</span></button>
      </div>
    </div>
  `).join('');
}

// ── Collapsibles ───────────────────────────
function toggleCollapse(btn) {
  btn.classList.toggle('open');
  const body = btn.nextElementSibling;
  body.classList.toggle('open');
}

// ── Export / Import ────────────────────────
function exportJSON() {
  const data = {
    jobs:  state.savedJobs,
    sf:    state.savedSF,
    noteLog: state.noteLog,
    setup: state.setupData,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `cnc-helper-${datestamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setActionStatus('Full Green Hat backup exported as JSON. Use this before clearing data or changing devices.');
  showToast('Exported');
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.jobs)  state.savedJobs = data.jobs;
      if (data.sf)    state.savedSF   = data.sf;
      if (data.noteLog) state.noteLog = data.noteLog;
      if (data.setup) state.setupData = data.setup;
      persist();
      renderSavedJobsInline();
      renderSavedSF();
      renderNoteLog();
      restoreSetup();
      renderHandoffSummary();
      setActionStatus('Import complete. Jobs, notes, speeds/feeds, and setup reference were restored from the JSON file.');
      showToast('Imported successfully');
    } catch {
      setActionStatus('Import failed. Choose a Green Hat JSON backup file.');
      showToast('Import failed — invalid file');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function clearAll() {
  if (!confirm('Clear all saved jobs, speeds & feeds, note log, and setup data?')) return;
  state.savedJobs = [];
  state.savedSF   = [];
  state.noteLog   = [];
  state.setupData = {};
  persist();
  renderSavedJobsInline();
  renderSavedSF();
  renderNoteLog();
  newJob();
  setActionStatus('All saved Green Hat data has been cleared from this device.');
  showToast('All data cleared');
}

// ── Helpers ────────────────────────────────
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setVal(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v || '';
}

function fmt(n, d = 4) {
  return parseFloat(n).toFixed(d);
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function datestamp() {
  return new Date().toISOString().slice(0,10);
}

function setActionStatus(msg) {
  const el = document.getElementById('actionStatus');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('success');
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}


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
  customChecklist: [],
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
  renderCustomChecklist();
  updateUnitLabels();

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
  state.customChecklist = JSON.parse(localStorage.getItem('green_hat_custom_checklist') || '[]');
}

function persist() {
  try {
    localStorage.setItem('cnc_helper_jobs',  JSON.stringify(state.savedJobs));
    localStorage.setItem('cnc_helper_sf',    JSON.stringify(state.savedSF));
    localStorage.setItem('green_hat_note_log', JSON.stringify(state.noteLog));
    localStorage.setItem('cnc_helper_setup', JSON.stringify(state.setupData));
    localStorage.setItem('green_hat_custom_checklist', JSON.stringify(state.customChecklist));
  } catch (err) {
    showToast('Could not save on this device. Storage may be full or blocked. Export a backup and free space, then try again.');
  }
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
    const menu = document.getElementById('overflowMenu');
    if (menu.classList.contains('open')) { closeMenu(); } else { openMenu(); }
  });
  document.getElementById('menuBackdrop').addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const menu = document.getElementById('overflowMenu');
      if (menu.classList.contains('open')) { closeMenu(); document.getElementById('menuBtn')?.focus(); }
    }
  });

  // Save/load shortcuts
  document.getElementById('saveBtn').addEventListener('click', saveCurrentJob);
  document.getElementById('partNumber').addEventListener('input', updateJobBadge);
  document.getElementById('saveJobInline').addEventListener('click', saveCurrentJob);
  document.getElementById('loadJobInline').addEventListener('click', openLoadModal);
  document.getElementById('addLogBtn').addEventListener('click', addLogEntry);
  document.getElementById('refreshHandoffBtn').addEventListener('click', renderHandoffSummary);
  document.getElementById('exportHandoffBtn').addEventListener('click', exportHandoff);
  document.getElementById('printHandoffBtn').addEventListener('click', () => printView('handoff'));
  document.getElementById('printChecklistBtn').addEventListener('click', () => printView('checklist'));
  document.getElementById('addCustomCheckBtn').addEventListener('click', addCustomCheck);
  document.getElementById('clearCustomChecksBtn').addEventListener('click', clearCustomChecks);
  document.getElementById('unitSystem').addEventListener('change', () => {
    const newUnit = val('unitSystem') || 'imperial';
    const prevUnit = currentUnitSystem();
    if (!state._unitSwitchWarned && state.savedJobs.length && newUnit !== prevUnit) {
      state._unitSwitchWarned = true;
      showToast(`Units switched to ${newUnit}. Existing job numbers were not converted — review them before reuse.`);
    }
    saveUnitSystem();
    updateUnitLabels();
    calcRPM();
    renderHandoffSummary();
  });
  document.querySelectorAll('[data-day-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.dayNav;
      switchNav(key, document.querySelector(`.nav-item[data-nav="${key}"]`));
    });
  });

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
  const trigger = document.getElementById('menuBtn');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function openMenu() {
  closeMenu();
  document.getElementById('overflowMenu').classList.add('open');
  document.getElementById('menuBackdrop').classList.add('open');
  const trigger = document.getElementById('menuBtn');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
}

// ── Job Notes ─────────────────────────────
function getJobFields() {
  return {
    partNumber:  val('partNumber'),
    opNumber:    val('opNumber'),
    machineName: val('machineName'),
    material:    val('materialField'),
    unitSystem:  val('unitSystem') || 'imperial',
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
  setVal('unitSystem',   job.unitSystem || state.setupData.unitSystem || 'imperial');
  setVal('setupStatus',  job.setupStatus || 'Ready');
  setVal('attentionFlag',job.attentionFlag);
  setVal('lastSetupBy',  job.lastSetupBy);
  setVal('lastRunBy',    job.lastRunBy);
  setVal('toolNotes',    job.toolNotes);
  setVal('setupNotes',   job.setupNotes);
  updateUnitLabels();
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
  setActionStatus(`Saved ${job.partNumber} to this device. Use Export Backup if this setup matters or needs to move.`);
  showToast(`Saved: ${job.partNumber}`);
}

function updateJobBadge() {
  const pn = val('partNumber');
  document.getElementById('jobBadge').textContent = pn ? `Part ${pn}` : '';
}

function renderSavedJobsInline() {
  const el = document.getElementById('savedJobsList');
  if (!state.savedJobs.length) { el.innerHTML = '<p class="empty-state">No saved jobs yet. Use Save to Device to keep this setup in this browser.</p>'; return; }

  el.innerHTML = state.savedJobs.map((j, i) => `
    <div class="saved-item">
      <div>
        <div class="saved-item-label">${esc(j.partNumber)}</div>
        <div class="saved-item-sub">${esc(j.opNumber || '')} ${j.machineName ? '· ' + esc(j.machineName) : ''} · ${esc(j.setupStatus || 'Ready')} · ${esc(j.savedAt || '')}</div>
      </div>
      <div class="saved-item-actions">
        <button class="icon-btn" onclick="loadJob(${i})" title="Load from Device"><span class="material-icons-round">folder_open</span></button>
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
  setActionStatus('Shift handoff log entry added. It is saved on this device and included in Export Backup.');
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
    ['Units', job.unitSystem === 'metric' ? 'Metric - mm / m/min' : 'Imperial - inch / SFM'],
    ['Setup Status', job.setupStatus || 'Ready'],
    ['Attention Flag', job.attentionFlag || 'None'],
    ['Last Setup By', job.lastSetupBy || '—'],
    ['Last Run By', job.lastRunBy || '—'],
    ['Tool Notes', job.toolNotes || '—'],
    ['Setup Notes', job.setupNotes || '—'],
    ['Shop Rules', data.setup.shopRules || '—'],
    ['Default Setup Notes', data.setup.defaultSetupNotes || '—'],
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
  setActionStatus('Handoff summary exported. Keep the file with the setup or shift notes.');
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
  const units = lengthUnit();
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
      <div class="result-card-unit">${units} diameter · ${direction}</div>
    </div>
    <div class="result-card">
      <div class="result-card-label">X Move (dia)</div>
      <div class="result-card-value">${xDiameterMove >= 0 ? '+' : ''}${fmt(xDiameterMove)}</div>
      <div class="result-card-unit">${units} diameter</div>
    </div>
    <div class="result-card">
      <div class="result-card-label">Radial Travel</div>
      <div class="result-card-value">${radialTravel >= 0 ? '+' : ''}${fmt(radialTravel)}</div>
      <div class="result-card-unit">${units} (physical tool move)</div>
    </div>
    <div class="result-card">
      <div class="result-card-label">Z Face</div>
      <div class="result-card-value">${fmt(zMove)}</div>
      <div class="result-card-unit">${units} ${plunge ? '+ ' + fmt(plunge) + ' plunge' : ''}</div>
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
  const checked = el.classList.contains('checked');
  el.setAttribute('aria-checked', checked ? 'true' : 'false');
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
    unitSystem:      val('unitSystem') || 'imperial',
    workOffset:      val('workOffset'),
    stockDia:        val('stockDia'),
    stockLen:        val('stockLen'),
    stickout:        val('stickout'),
    chuckJaws:       val('chuckJaws'),
    coolant:         val('coolant'),
    inspectionNotes: val('inspectionNotes'),
    refNotes:        val('refNotes'),
    shopRules:       val('shopRules'),
    defaultSetupNotes: val('defaultSetupNotes'),
  };
  persist();
  setActionStatus('Setup reference saved on this device.');
  showToast('Setup saved');
}

function restoreSetup() {
  const s = state.setupData;
  if (!s) return;
  setVal('unitSystem',      s.unitSystem || 'imperial');
  setVal('workOffset',      s.workOffset);
  setVal('stockDia',        s.stockDia);
  setVal('stockLen',        s.stockLen);
  setVal('stickout',        s.stickout);
  setVal('chuckJaws',       s.chuckJaws);
  setVal('coolant',         s.coolant);
  setVal('inspectionNotes', s.inspectionNotes);
  setVal('refNotes',        s.refNotes);
  setVal('shopRules',       s.shopRules);
  setVal('defaultSetupNotes', s.defaultSetupNotes);
  updateUnitLabels();
}

function currentUnitSystem() {
  return val('unitSystem') || state.setupData.unitSystem || 'imperial';
}

function lengthUnit() {
  return currentUnitSystem() === 'metric' ? 'mm' : 'in';
}

function saveUnitSystem() {
  state.setupData = { ...state.setupData, unitSystem: currentUnitSystem() };
  persist();
}

function updateUnitLabels() {
  const unit = lengthUnit();
  const metric = currentUnitSystem() === 'metric';
  setLabel('touchDiaLabel', `Touch-Off Diameter (${unit})`);
  setLabel('targetDiaLabel', `Target Diameter (${unit})`);
  setLabel('zFaceLabel', `Z Face (${unit})`);
  setLabel('plungeDepthLabel', `Plunge Depth (${unit})`);
  setLabel('stockDiaLabel', `Stock Diameter (${unit})`);
  setLabel('stockLenLabel', `Stock Length (${unit})`);
  setLabel('stickoutLabel', `Stickout (${unit})`);
  setLabel('sfmInputLabel', metric ? 'Surface Speed (m/min)' : 'SFM');
  setLabel('diaRpmLabel', `Diameter (${unit})`);
  setLabel('rpmResultLabel', metric ? 'RPM (from m/min + diameter)' : 'RPM (from SFM + diameter)');
  setLabel('surfaceSpeedResultLabel', metric ? 'm/min (from RPM + diameter)' : 'SFM (from RPM + diameter)');
}

// Custom checklist items are intentionally short and plain-language.
function addCustomCheck() {
  const text = val('customCheckText');
  if (!text) { showToast('Enter a checklist item first'); return; }
  state.customChecklist.push(text);
  state.customChecklist = [...new Set(state.customChecklist)].slice(0, 12);
  setVal('customCheckText', '');
  persist();
  renderCustomChecklist();
  setActionStatus('Custom checklist item saved on this device.');
  showToast('Checklist item added');
}

function clearCustomChecks() {
  if (!state.customChecklist.length) { showToast('No custom checks to clear'); return; }
  if (!confirm('Clear all shop-specific checklist items?')) return;
  state.customChecklist = [];
  persist();
  renderCustomChecklist();
  showToast('Custom checks cleared');
}

function renderCustomChecklist() {
  const list = document.getElementById('verifyChecklist');
  if (!list) return;
  list.querySelectorAll('.custom-check-item').forEach(el => el.remove());
  state.customChecklist.forEach(text => {
    const item = document.createElement('div');
    item.className = 'check-item custom-check-item';
    item.onclick = () => toggleCheck(item);
    item.innerHTML = `<div class="check-box"><span class="material-icons-round">check</span></div><span>${esc(text)}</span>`;
    list.appendChild(item);
  });
  updateCheckProgress();
}

function printView(mode) {
  document.body.classList.add(`print-${mode}`);
  window.print();
  setTimeout(() => document.body.classList.remove(`print-${mode}`), 400);
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
  const speed = parseFloat(val('sfmInput'));
  const dia = parseFloat(val('diaRpmInput'));
  const metric = currentUnitSystem() === 'metric';

  if (!isNaN(speed) && !isNaN(dia) && dia > 0) {
    const rpm = metric ? (speed * 1000) / (Math.PI * dia) : (speed * 3.82) / dia;
    document.getElementById('rpmOut').textContent = Math.round(rpm).toLocaleString() + ' RPM';
    const speedBack = metric ? (Math.round(rpm) * Math.PI * dia) / 1000 : (Math.round(rpm) * dia) / 3.82;
    document.getElementById('sfmOut').textContent = Math.round(speedBack).toLocaleString() + (metric ? ' m/min' : ' SFM');
  } else {
    document.getElementById('rpmOut').textContent = '---';
    document.getElementById('sfmOut').textContent = '---';
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
    customChecklist: state.customChecklist,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `green-hat-backup-${datestamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setActionStatus('Backup file exported. Keep it somewhere safe before clearing data or changing devices.');
  showToast('Exported');
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const raw = JSON.parse(ev.target.result);
      const requiredTopFields = ['jobs','sf','noteLog','setup','customChecklist'];
      const hasAnyTopLevel = requiredTopFields.some(key => Object.prototype.hasOwnProperty.call(raw, key));
      if (!hasAnyTopLevel) {
        setActionStatus('Import failed. This file does not look like a Green Hat backup.');
        showToast('Import failed — incompatible file');
        return;
      }
      const incomingShape = {
        jobs: Array.isArray(raw.jobs) ? raw.jobs : undefined,
        sf: Array.isArray(raw.sf) ? raw.sf : undefined,
        noteLog: Array.isArray(raw.noteLog) ? raw.noteLog : undefined,
        setup: raw.setup && typeof raw.setup === 'object' ? raw.setup : undefined,
        customChecklist: Array.isArray(raw.customChecklist) ? raw.customChecklist : undefined,
      };
      if (incomingShape.jobs !== undefined) state.savedJobs = incomingShape.jobs;
      if (incomingShape.sf !== undefined) state.savedSF = incomingShape.sf;
      if (incomingShape.noteLog !== undefined) state.noteLog = incomingShape.noteLog;
      if (incomingShape.setup !== undefined) state.setupData = incomingShape.setup;
      if (incomingShape.customChecklist !== undefined) state.customChecklist = incomingShape.customChecklist;
      persist();
      renderSavedJobsInline();
      renderSavedSF();
      renderNoteLog();
      renderCustomChecklist();
      restoreSetup();
      renderHandoffSummary();
      setActionStatus('Import complete. Jobs, notes, speeds/feeds, and setup reference were restored from the backup file.');
      showToast('Imported successfully');
    } catch {
      setActionStatus('Import failed. Choose a Green Hat backup file.');
      showToast('Import failed — invalid file');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function hasSavedDeviceData() {
  return state.savedJobs.length > 0 ||
    state.savedSF.length > 0 ||
    state.noteLog.length > 0 ||
    state.customChecklist.length > 0 ||
    Object.keys(state.setupData || {}).length > 0;
}

function clearAll() {
  const message = 'Reset this device? This clears saved jobs, notes, speeds/feeds, setup reference, and checklist items from this device only.';
  if (!confirm(message)) return;

  if (hasSavedDeviceData()) {
    exportJSON();
    if (!confirm('Backup exported from this device. Reset saved data now?')) return;
  }

  state.savedJobs = [];
  state.savedSF   = [];
  state.noteLog   = [];
  state.setupData = {};
  state.customChecklist = [];
  persist();
  setVal('unitSystem', 'imperial');
  updateUnitLabels();
  renderSavedJobsInline();
  renderSavedSF();
  renderNoteLog();
  renderCustomChecklist();
  newJob();
  setActionStatus('Device storage reset. Import Backup can restore saved data if exported.');
  showToast('Device reset');
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

function setLabel(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
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


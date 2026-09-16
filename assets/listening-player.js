// Original recordings only. Question ranges come from the source paper/audio manifest.
let activeListeningAudio = null;
function listeningTracks(m) { return window.LISTENING_AUDIO?.[m.id] || []; }
function audioProgressKey(m, track) { return key(m.id, 'original-recording-v1', track.src); }
function stopListeningAudio() {
  if (activeListeningAudio) { activeListeningAudio.pause(); activeListeningAudio = null; }
}
function renderAudioList(m) {
  const tracks = listeningTracks(m);
  return `<div class="audio-list"><div class="notice"><strong>題目原始錄音</strong><br>${current.mode === 'strict' ? '模考：每個音檔播放一次，可暫停後繼續。' : '練習：可暫停、重播及調整播放位置。'} 同一音檔可能涵蓋多題，請依題號播放。</div>${tracks.length ? tracks.map((track, i) => {
    const progress = state.answers[audioProgressKey(m, track)] || {};
    const done = current.mode === 'strict' && progress.completed;
    return `<div class="audio-row" id="recording-${i}"><small><b>${escapeHtml(track.label)}</b></small><audio id="listening-audio-${i}" preload="none" src="${escapeAttr(track.src)}" ${current.mode === 'practice' ? 'controls' : ''} style="width:100%;margin:8px 0" aria-label="${escapeAttr(track.label)}"></audio>${current.mode === 'strict' ? `<button class="btn gold sm" id="audio-button-${i}" onclick="toggleOriginalAudio(${i})" ${done ? 'disabled' : ''}>${done ? '已播放完畢' : progress.position > 0 ? '▶ 繼續播放原音' : '▶ 播放原始錄音'}</button>` : ''}<div id="audio-status-${i}" role="status" style="font-size:12px;margin-top:6px">${done ? '本次模考已完成播放' : '尚未播放'}</div></div>`;
  }).join('') : '<div class="notice">此題組原始錄音尚未完成對照，暫不提供替代音檔。</div>'}</div>`;
}
function bindOriginalAudio() {
  const m = current.mock, strict = current.mode === 'strict';
  listeningTracks(m).forEach((track, i) => {
    const audio = document.getElementById(`listening-audio-${i}`);
    if (!audio) return;
    const pk = audioProgressKey(m, track), progress = state.answers[pk] || {};
    const status = document.getElementById(`audio-status-${i}`), button = document.getElementById(`audio-button-${i}`);
    let lastSaved = Number(progress.position || 0);
    const persist = () => {
      if (!strict || !Number.isFinite(audio.currentTime) || audio.currentTime <= 0) return;
      state.answers[pk] = { position: audio.currentTime, completed: !!state.answers[pk]?.completed };
      save(); lastSaved = audio.currentTime;
    };
    audio.addEventListener('loadedmetadata', () => {
      if (strict && progress.position > 0 && !progress.completed) audio.currentTime = Math.min(progress.position, Math.max(0, audio.duration - 0.1));
    });
    audio.addEventListener('play', () => {
      if (strict && state.answers[pk]?.completed) { audio.pause(); return; }
      if (activeListeningAudio && activeListeningAudio !== audio) activeListeningAudio.pause();
      activeListeningAudio = audio;
    });
    audio.addEventListener('playing', () => { status.textContent = '正在播放原始錄音'; if (button) button.textContent = '暫停'; });
    audio.addEventListener('waiting', () => { status.textContent = '音檔載入中…'; });
    audio.addEventListener('pause', () => { persist(); if (!audio.ended) { status.textContent = '已暫停，可繼續播放'; if (button) button.textContent = '▶ 繼續播放原音'; } });
    audio.addEventListener('timeupdate', () => { if (Math.abs(audio.currentTime - lastSaved) >= 5) persist(); });
    audio.addEventListener('ended', () => {
      if (strict) { state.answers[pk] = { position: audio.duration, completed: true }; save(); if (button) { button.disabled = true; button.textContent = '已播放完畢'; } }
      status.textContent = strict ? '本次模考已完成播放' : '播放完畢，可重播';
    });
    audio.addEventListener('error', () => { status.textContent = '音檔載入失敗，請確認網路後重試。'; if (button) button.textContent = '重試播放'; });
  });
}
async function toggleOriginalAudio(i) {
  const audio = document.getElementById(`listening-audio-${i}`);
  if (!audio) return;
  if (!audio.paused) { audio.pause(); return; }
  try { if (audio.error) audio.load(); await audio.play(); }
  catch { document.getElementById(`audio-status-${i}`).textContent = '無法播放，請確認網路後再次按下播放。'; }
}
function focusQuestionRecording(q) {
  const i = listeningTracks(current.mock).findIndex(t => q >= t.from && q <= t.to);
  if (i < 0) return toast('本題原始錄音尚未完成對照');
  document.getElementById(`recording-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (document.getElementById(`audio-button-${i}`) || document.getElementById(`listening-audio-${i}`))?.focus({ preventScroll: true });
}

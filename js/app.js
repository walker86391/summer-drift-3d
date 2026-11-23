/**
 * MAIN APP COORDINATOR
 * Ties together Shaders, Audio, Scraper, and Portfolio Generation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Engines
  const shaders = new ShaderEngine();
  const audio = new AudioEngine();

  // Connect Audio Intensity to Shaders
  audio.onIntensityChange = (val) => {
    shaders.setAudioIntensity(val);
  };

  // State
  let currentPersona = null;
  let currentTheme = 'cyberpunk';

  // DOM Elements
  const scannerView = document.getElementById('scanner-view');
  const portfolioView = document.getElementById('portfolio-view');
  const terminalBox = document.getElementById('terminal-box');
  const terminalLog = document.getElementById('terminal-log');
  const generateBtn = document.getElementById('generate-btn');
  const resetBtn = document.getElementById('reset-btn');
  const styleModal = document.getElementById('style-modal');
  const openStyleModalBtn = document.getElementById('open-style-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const deployEmbarkoBtn = document.getElementById('deploy-embarko-btn');
  const exportHtmlBtn = document.getElementById('export-html-btn');
  const crtToggleBtn = document.getElementById('crt-toggle-btn');
  const crtOverlay = document.querySelector('.crt-overlay');

  // Audio Player DOM
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const audioPill = document.querySelector('.audio-player-pill');
  const visCanvas = document.getElementById('vis-canvas');
  if (visCanvas) audio.bindVisualizer(visCanvas);

  // Set default initial theme
  document.documentElement.setAttribute('data-theme', currentTheme);
  shaders.setMode('cyber-grid');

  // Terminal Logger Utility
  const logTerminal = (msg) => {
    if (!terminalLog) return;
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `> ${msg}`;
    terminalLog.appendChild(line);
    terminalBox.scrollTop = terminalBox.scrollHeight;
  };

  // Style Picker in Scanner
  const styleOptions = document.querySelectorAll('.style-option-btn');
  styleOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      audio.playClick(750);
      styleOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const theme = btn.dataset.style;
      applyTheme(theme);
    });
  });

  // Modal Theme Options
  const modalThemeBtns = document.querySelectorAll('.modal-theme-btn');
  modalThemeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      audio.playModeSwitch();
      const theme = btn.dataset.style;
      applyTheme(theme);
      styleModal.classList.remove('open');
    });
  });

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    // Map theme to shader mode
    const shaderMap = {
      'cyberpunk': 'cyber-grid',
      'liquid-chrome': 'liquid-chrome',
      'y2k': 'y2k',
      'frutiger-aero': 'frutiger-aero',
      'brutalist': 'brutalist',
      'dark-luxury': 'aurora-pixel',
      'bento': 'cyber-grid',
      'glassmorphism': 'aurora-pixel',
      'neumorphism': 'liquid-chrome',
      'bauhaus': 'brutalist'
    };
    shaders.setMode(shaderMap[theme] || 'aurora-pixel');
  }

  // CRT Scanline Toggle
  if (crtToggleBtn && crtOverlay) {
    crtToggleBtn.addEventListener('click', () => {
      audio.playClick(400);
      crtOverlay.style.display = crtOverlay.style.display === 'none' ? 'block' : 'none';
      crtToggleBtn.textContent = crtOverlay.style.display === 'none' ? '📺 CRT: Off' : '📺 CRT: On';
    });
  }

  // Generate / Scan Button Click
  generateBtn.addEventListener('click', async () => {
    audio.playClick(900, 0.08);

    const formData = {
      github: document.getElementById('input-github')?.value.trim() || 'torvalds',
      twitter: document.getElementById('input-twitter')?.value.trim() || 'LinusTorvalds',
      instagram: document.getElementById('input-instagram')?.value.trim() || '',
      linkedin: document.getElementById('input-linkedin')?.value.trim() || '',
      discord: document.getElementById('input-discord')?.value.trim() || '',
      songTitle: document.getElementById('input-song-title')?.value.trim() || 'Resonance',
      songArtist: document.getElementById('input-song-artist')?.value.trim() || 'HOME'
    };

    // Show Progress State
    generateBtn.disabled = true;
    generateBtn.innerHTML = `<span>⚡ Extracting Aura...</span>`;
    terminalBox.style.display = 'block';
    terminalLog.innerHTML = '';

    logTerminal('Initializing persona synthesis protocol...');
    await sleep(250);

    // Run Scraper
    const ghData = await SocialScraper.scrapeGitHub(formData.github, (msg) => logTerminal(msg));
    await sleep(300);

    logTerminal('Synthesizing multi-platform aura and verified badges...');
    await sleep(250);

    logTerminal(`Harmonizing audio frequencies for: ${formData.songTitle} - ${formData.songArtist}`);
    await sleep(250);

    logTerminal(`Compiling visual tokens for [${currentTheme.toUpperCase()}] engine...`);
    await sleep(350);

    currentPersona = SocialScraper.synthesizePersona(formData, ghData);

    // Render Portfolio View
    renderPortfolio(currentPersona);

    // Transition Views
    scannerView.style.display = 'none';
    portfolioView.style.display = 'flex';
    document.getElementById('dock-bar').style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-start ambient track to wow user
    audio.toggleMusic(currentPersona.song);
    updateAudioPillUI(true);

    generateBtn.disabled = false;
    generateBtn.innerHTML = `<span>✦ Generate Persona</span>`;
  });

  // Render Data into DOM
  function renderPortfolio(data) {
    document.getElementById('disp-avatar').src = data.avatar;
    document.getElementById('disp-name').textContent = data.name;
    document.getElementById('disp-handle').textContent = `@${data.handle}`;
    document.getElementById('disp-archetype').textContent = `✦ ${data.archetype}`;
    document.getElementById('disp-bio').textContent = data.bio;

    // Badges
    const badgesWrap = document.getElementById('disp-badges');
    badgesWrap.innerHTML = '';
    data.badges.forEach(b => {
      const chip = document.createElement('span');
      chip.className = 'badge-chip';
      chip.textContent = b.label;
      badgesWrap.appendChild(chip);
    });

    // Stats
    document.getElementById('stat-craft').textContent = `${data.stats.craft}%`;
    document.getElementById('stat-speed').textContent = `${data.stats.speed}%`;
    document.getElementById('stat-chaos').textContent = `${data.stats.chaos}%`;
    document.getElementById('stat-curiosity').textContent = `${data.stats.curiosity}%`;

    // Audio Meta
    document.getElementById('disp-song-title').textContent = data.song.title;
    document.getElementById('disp-song-artist').textContent = data.song.artist;

    // Projects
    const projectsList = document.getElementById('disp-projects');
    projectsList.innerHTML = '';
    data.projects.forEach(p => {
      const card = document.createElement('a');
      card.className = 'project-card';
      card.href = p.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.innerHTML = `
        <div class="project-top">
          <span class="project-name">${escapeHtml(p.name)}</span>
          <span class="project-stars">★ ${p.stars || 1}</span>
        </div>
        <p class="project-desc">${escapeHtml(p.description)}</p>
        <span class="project-lang">
          <span class="lang-dot"></span>
          ${escapeHtml(p.language)}
        </span>
      `;
      projectsList.appendChild(card);
    });

    // Social Links
    const socialsGrid = document.getElementById('disp-socials');
    socialsGrid.innerHTML = '';
    data.socials.forEach(s => {
      const btn = document.createElement('a');
      btn.className = 'social-tile-btn';
      btn.href = s.url;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.innerHTML = `
        <span>${escapeHtml(s.platform)}</span>
        <span style="color: var(--accent-primary);">${escapeHtml(s.label)} ↗</span>
      `;
      socialsGrid.appendChild(btn);
    });
  }

  // Audio Play / Pause
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      audio.playClick(600);
      const isNowPlaying = audio.toggleMusic(currentPersona?.song);
      updateAudioPillUI(isNowPlaying);
    });
  }

  function updateAudioPillUI(isPlaying) {
    if (isPlaying) {
      audioPill?.classList.add('playing');
      if (playIcon) playIcon.textContent = '❚❚';
    } else {
      audioPill?.classList.remove('playing');
      if (playIcon) playIcon.textContent = '▶';
    }
  }

  // Reset to Scanner
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      audio.playClick(500);
      portfolioView.style.display = 'none';
      document.getElementById('dock-bar').style.display = 'none';
      scannerView.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Modals
  if (openStyleModalBtn && styleModal) {
    openStyleModalBtn.addEventListener('click', () => {
      audio.playClick(700);
      styleModal.classList.add('open');
    });
  }

  if (closeModalBtn && styleModal) {
    closeModalBtn.addEventListener('click', () => {
      audio.playClick(400);
      styleModal.classList.remove('open');
    });
  }

  // Toast Notification
  function showToast(msg) {
    let toast = document.getElementById('toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notice';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Deploy to Embarko Prompt Modal
  if (deployEmbarkoBtn) {
    deployEmbarkoBtn.addEventListener('click', () => {
      audio.playClick(800);
      const embarkoPrompt = `Deploy this interactive personal portfolio app on Embarko live at ${currentPersona ? currentPersona.handle.toLowerCase() : 'myname'}.embarko.app using the Embarko agent skill. Keep the app live. #DeployWithEmbarko`;
      navigator.clipboard.writeText(embarkoPrompt).then(() => {
        showToast('📋 Copied Embarko Deploy Prompt!');
      }).catch(() => {
        showToast(`📋 Deploy with #DeployWithEmbarko`);
      });
    });
  }

  // Export Standalone Single-File HTML
  if (exportHtmlBtn) {
    exportHtmlBtn.addEventListener('click', () => {
      audio.playClick(850);
      exportStandaloneHtml();
      showToast('📥 Portfolio HTML Exported!');
    });
  }

  function exportStandaloneHtml() {
    const pageHtml = document.documentElement.outerHTML;
    const blob = new Blob([pageHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPersona ? currentPersona.handle : 'portfolio'}-profile.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }
});

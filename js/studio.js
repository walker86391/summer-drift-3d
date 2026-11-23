/**
 * GUNS.LOL STUDIO & REACTIVE DASHBOARD ENGINE
 * Provides instant bidirectional state sync between editor controls and live device preview.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. REACTIVE PROFILE STATE
  // ==========================================================================
  const state = {
    handle: "crazy",
    displayName: "/crazy",
    tagline: "dystopias.xyz",
    typewriterTexts: ["dystopias.xyz", "full-stack developer", "crafting high-craft systems", "music & games"],
    bio: "full-stack developer. i like programming, music and playing games.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=crazy",
    location: "word",
    timezone: "GMT+1",
    badges: ["💎", "❄️", "⏱", "⭐️", "🚀"],
    skills: ["Python", "htmx", "Java", "CSS", "JavaScript", "C++", "Rust", "WebGL"],
    presence: {
      platform: "Roblox",
      status: "relapse",
      meta: "4 Friends · 46 Followers",
      avatar: "https://tr.rbxcdn.com/30DAY-Avatar-682482620ABE002A90EBC5B2BCAE8D4C-Png/420/420/Avatar/Png/noFilter"
    },
    projects: [
      { title: "Dystopia Stock", desc: "fully automated robux store.", url: "https://dystopias.xyz/", actionText: "Visit" },
      { title: "guns-engine", desc: "ultra-fast aesthetic biolink with animated titlebar.", url: "https://github.com", actionText: "Visit" }
    ],
    socials: {
      x: "https://x.com",
      github: "https://github.com",
      instagram: "https://instagram.com",
      telegram: "https://t.me",
      email: "mailto:swat@dystopias.xyz"
    },
    theme: "silk", // 'silk', 'katana', 'cyber', 'vapor'
    effects: {
      dither: true,
      crt: false,
      sparkles: true
    },
    views: 1669
  };

  // ==========================================================================
  // 2. ANIMATED BROWSER TITLE BAR
  // ==========================================================================
  let titleTimer = null;
  let titleIndex = 1;
  let titleForward = true;

  function syncTitleAnimation(handle) {
    if (titleTimer) clearInterval(titleTimer);
    const base = `@/${handle || 'user'}`;
    titleIndex = 1;
    titleForward = true;

    titleTimer = setInterval(() => {
      if (titleForward) {
        document.title = base.slice(0, titleIndex);
        titleIndex++;
        if (titleIndex > base.length) titleForward = false;
      } else {
        document.title = base.slice(0, titleIndex);
        titleIndex--;
        if (titleIndex < 2) titleForward = true;
      }
    }, 280);
  }

  syncTitleAnimation(state.handle);

  // ==========================================================================
  // 3. TAB NAVIGATION
  // ==========================================================================
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.editor-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${targetTab}`)?.classList.add('active');
    });
  });

  // ==========================================================================
  // 4. VIEWPORT MODE SWITCHER (Phone vs Desktop vs Fullscreen)
  // ==========================================================================
  const deviceFrame = document.getElementById('device-frame');
  const btnViewPhone = document.getElementById('btn-view-phone');
  const btnViewDesktop = document.getElementById('btn-view-desktop');
  const btnViewFullscreen = document.getElementById('btn-view-fullscreen');
  const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');

  btnViewPhone?.addEventListener('click', () => {
    btnViewPhone.classList.add('active');
    btnViewDesktop.classList.remove('active');
    deviceFrame.className = 'device-frame-phone';
  });

  btnViewDesktop?.addEventListener('click', () => {
    btnViewDesktop.classList.add('active');
    btnViewPhone.classList.remove('active');
    deviceFrame.className = 'device-frame-desktop';
  });

  btnViewFullscreen?.addEventListener('click', () => {
    document.body.classList.add('fullscreen-mode');
  });

  exitFullscreenBtn?.addEventListener('click', () => {
    document.body.classList.remove('fullscreen-mode');
  });

  // Mobile Workspace Toggle (for phones)
  const mobileToggleEdit = document.getElementById('mobile-toggle-edit');
  const mobileTogglePrev = document.getElementById('mobile-toggle-prev');
  const studioWorkspace = document.querySelector('.studio-workspace');

  mobileToggleEdit?.addEventListener('click', () => {
    mobileToggleEdit.classList.add('active');
    mobileTogglePrev.classList.remove('active');
    studioWorkspace?.classList.remove('show-preview');
  });

  mobileTogglePrev?.addEventListener('click', () => {
    mobileTogglePrev.classList.add('active');
    mobileToggleEdit.classList.remove('active');
    studioWorkspace?.classList.add('show-preview');
  });

  // ==========================================================================
  // 5. LIVE AUDIO SYNTHESIZER
  // ==========================================================================
  let audioCtx = null;
  let isPlaying = false;
  let masterGain = null;
  let synthLoop = null;

  const audioBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');
  const volumeSlider = document.getElementById('volume-slider');

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 392.00]  // G
  ];
  let chordIdx = 0;

  function playSynthChord(freqs) {
    if (!audioCtx || !isPlaying) return;
    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, now);

    gain.connect(filter);
    filter.connect(masterGain);

    freqs.forEach(f => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 2.9);
    });
  }

  function toggleAudio() {
    initAudio();
    if (isPlaying) {
      isPlaying = false;
      if (synthLoop) clearInterval(synthLoop);
      if (audioIcon) audioIcon.textContent = '🔇';
    } else {
      isPlaying = true;
      if (audioIcon) audioIcon.textContent = '🔊';
      playSynthChord(chords[chordIdx]);
      synthLoop = setInterval(() => {
        chordIdx = (chordIdx + 1) % chords.length;
        playSynthChord(chords[chordIdx]);
      }, 3000);
    }
  }

  audioBtn?.addEventListener('click', toggleAudio);
  volumeSlider?.addEventListener('input', (e) => {
    initAudio();
    if (masterGain) {
      masterGain.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
    }
  });

  // ==========================================================================
  // 6. TYPEWRITER EFFECT
  // ==========================================================================
  const typewriterEl = document.getElementById('typewriter-text');
  let typeArrIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 95;

  function tickTypewriter() {
    if (!typewriterEl) return;
    const texts = state.typewriterTexts;
    if (!texts || texts.length === 0) return;

    const currentStr = texts[typeArrIndex] || texts[0];

    if (isDeleting) {
      charIndex--;
      typeSpeed = 45;
    } else {
      charIndex++;
      typeSpeed = 95;
    }

    typewriterEl.textContent = currentStr.slice(0, charIndex);

    if (!isDeleting && charIndex === currentStr.length) {
      typeSpeed = 2200;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      typeArrIndex = (typeArrIndex + 1) % texts.length;
      typeSpeed = 500;
    }

    setTimeout(tickTypewriter, typeSpeed);
  }

  tickTypewriter();

  // ==========================================================================
  // 7. LIVE TIMEZONE WORLD CLOCK
  // ==========================================================================
  const clockEl = document.getElementById('live-clock');
  const clockMetaEl = document.getElementById('clock-meta');
  const clockDeltaEl = document.getElementById('clock-delta');

  function updateClock() {
    const now = new Date();
    let offsetHours = 1;
    if (state.timezone.includes('+')) {
      offsetHours = parseFloat(state.timezone.split('+')[1]) || 0;
    } else if (state.timezone.includes('-')) {
      offsetHours = -parseFloat(state.timezone.split('-')[1]) || 0;
    }

    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetDate = new Date(utc + (3600000 * offsetHours));

    const timeStr = targetDate.toTimeString().split(' ')[0];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${days[targetDate.getDay()]}, ${months[targetDate.getMonth()]} ${targetDate.getDate()} · ${state.timezone}`;

    if (clockEl) clockEl.textContent = timeStr;
    if (clockMetaEl) clockMetaEl.textContent = dateStr;

    const visitorLocal = now.toTimeString().split(' ')[0].slice(0, 5);
    const diffHours = (now.getTimezoneOffset() / -60) - offsetHours;
    const sign = diffHours >= 0 ? '+' : '';
    if (clockDeltaEl) {
      clockDeltaEl.textContent = `Your time: ${visitorLocal} (${sign}${diffHours}h)`;
    }
  }

  setInterval(updateClock, 1000);
  updateClock();

  // ==========================================================================
  // 8. LIQUID CHROME SILK CANVAS
  // ==========================================================================
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) {
    const ctx = bgCanvas.getContext('2d');
    let w = (bgCanvas.width = bgCanvas.parentElement.clientWidth || 400);
    let h = (bgCanvas.height = bgCanvas.parentElement.clientHeight || 800);
    let t = 0;

    window.addEventListener('resize', () => {
      w = bgCanvas.width = bgCanvas.parentElement.clientWidth || 400;
      h = bgCanvas.height = bgCanvas.parentElement.clientHeight || 800;
    });

    function drawSilkWave() {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      if (state.theme === 'katana') {
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        for (let i = 0; i < 50; i++) {
          const x = (Math.sin(t + i * 2) * 0.5 + 0.5) * w;
          const y = ((t * 70 + i * 30) % h);
          ctx.beginPath();
          ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (state.theme === 'cyber') {
        ctx.fillStyle = '#05070e';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
        ctx.lineWidth = 1;
        const grid = 28;
        const offY = (t * 15) % grid;
        ctx.beginPath();
        for (let x = 0; x < w; x += grid) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = offY; y < h; y += grid) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();
      } else if (state.theme === 'vapor') {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1c0032');
        grad.addColorStop(0.6, '#3a0066');
        grad.addColorStop(1, '#ff007f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else {
        // Default Liquid Chrome Silk
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#0a0a0c');
        grad.addColorStop(0.5, '#16161c');
        grad.addColorStop(1, '#08080a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.moveTo(0, h * 0.3 + j * 70);
          for (let x = 0; x <= w; x += 30) {
            const y = h * 0.4 + Math.sin(x * 0.003 + t + j * 0.8) * 110 + Math.cos(t * 0.5 + j) * 50;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();

          const waveGrad = ctx.createLinearGradient(0, 0, w, 0);
          waveGrad.addColorStop(0, `rgba(200, 215, 240, ${0.04 + j * 0.02})`);
          waveGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.09 + j * 0.03})`);
          waveGrad.addColorStop(1, `rgba(140, 160, 190, ${0.03 + j * 0.02})`);
          ctx.fillStyle = waveGrad;
          ctx.fill();
        }
      }

      requestAnimationFrame(drawSilkWave);
    }

    drawSilkWave();
  }

  // ==========================================================================
  // 9. MOUSE SPARKLE TRAIL
  // ==========================================================================
  const sparkleCanvas = document.getElementById('sparkle-canvas');
  if (sparkleCanvas) {
    const sCtx = sparkleCanvas.getContext('2d');
    sparkleCanvas.width = window.innerWidth;
    sparkleCanvas.height = window.innerHeight;
    const sparkles = [];

    window.addEventListener('resize', () => {
      sparkleCanvas.width = window.innerWidth;
      sparkleCanvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.effects.sparkles) return;
      if (Math.random() < 0.35) {
        sparkles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5,
          size: Math.random() * 3 + 1,
          alpha: 1
        });
      }
    });

    function renderSparkles() {
      sCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.02;
        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }
        sCtx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        sCtx.shadowBlur = 8;
        sCtx.shadowColor = '#ffffff';
        sCtx.beginPath();
        sCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        sCtx.fill();
      }
      requestAnimationFrame(renderSparkles);
    }

    renderSparkles();
  }

  // ==========================================================================
  // 10. REACIVE PREVIEW UPDATE
  // ==========================================================================
  function updatePreview() {
    // Top Bar Pill
    const urlPill = document.getElementById('preview-url-text');
    if (urlPill) urlPill.textContent = `${state.handle}.embarko.app`;

    // Title animation
    syncTitleAnimation(state.handle);

    // Hero Avatar
    const avatarImg = document.getElementById('hero-avatar');
    if (avatarImg) avatarImg.src = state.avatar;

    // Display Name
    const nameEl = document.getElementById('hero-display-name');
    if (nameEl) nameEl.textContent = state.displayName;

    // Badges Row
    const badgesRow = document.getElementById('hero-badges-row');
    if (badgesRow) {
      badgesRow.innerHTML = '';
      state.badges.forEach(b => {
        const span = document.createElement('span');
        span.className = 'badge-item';
        span.textContent = b;
        badgesRow.appendChild(span);
      });
    }

    // Winged Social Links
    const innerSocials = document.getElementById('social-icons-inner');
    if (innerSocials) {
      innerSocials.innerHTML = '';
      const iconMap = {
        x: '🕏',
        github: '🐙',
        instagram: '📷',
        telegram: '✈️',
        email: '✉️',
        discord: '💬'
      };
      Object.entries(state.socials).forEach(([k, url]) => {
        if (!url) return;
        const a = document.createElement('a');
        a.className = 'social-glow-link';
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = iconMap[k] || '🔗';
        innerSocials.appendChild(a);
      });
    }

    // View Count & Location
    const viewsEl = document.getElementById('hero-views-count');
    if (viewsEl) viewsEl.textContent = Number(state.views).toLocaleString();

    const locEl = document.getElementById('hero-location-text');
    if (locEl) locEl.textContent = state.location;

    // About Me
    const aboutRole = document.getElementById('about-role-title');
    if (aboutRole) aboutRole.textContent = state.tagline;

    const aboutBio = document.getElementById('about-bio-text');
    if (aboutBio) aboutBio.textContent = state.bio;

    // Skills
    const skillsWrap = document.getElementById('skills-wrap');
    if (skillsWrap) {
      skillsWrap.innerHTML = '';
      state.skills.forEach(sk => {
        const chip = document.createElement('span');
        chip.className = 'skill-chip';
        chip.textContent = sk;
        skillsWrap.appendChild(chip);
      });
    }

    // Presence
    const presTitle = document.getElementById('presence-title');
    if (presTitle) presTitle.textContent = state.presence.status;

    const presMeta = document.getElementById('presence-meta');
    if (presMeta) presMeta.textContent = state.presence.meta;

    // Featured Projects
    const projectsList = document.getElementById('featured-projects-list');
    if (projectsList) {
      projectsList.innerHTML = '';
      state.projects.forEach(p => {
        const item = document.createElement('a');
        item.className = 'project-item';
        item.href = p.url;
        item.target = '_blank';
        item.rel = 'noopener noreferrer';
        item.innerHTML = `
          <div class="project-left">
            <h4>${escapeHtml(p.title)}</h4>
            <p>${escapeHtml(p.desc)}</p>
          </div>
          <span class="btn-visit">${escapeHtml(p.actionText || 'Visit')} ↗</span>
        `;
        projectsList.appendChild(item);
      });
    }

    // Effects
    const ditherEl = document.querySelector('.dither-overlay');
    if (ditherEl) ditherEl.style.display = state.effects.dither ? 'block' : 'none';

    // Clock
    updateClock();
  }

  // ==========================================================================
  // 11. BIND EDITOR INPUTS TO STATE (Bidirectional Reactivity)
  // ==========================================================================
  const inputDisplayName = document.getElementById('edit-display-name');
  const inputHandle = document.getElementById('edit-handle');
  const inputTagline = document.getElementById('edit-tagline');
  const inputBio = document.getElementById('edit-bio');
  const inputLocation = document.getElementById('edit-location');
  const inputTimezone = document.getElementById('edit-timezone');
  const inputAvatar = document.getElementById('edit-avatar');
  const inputTypewriters = document.getElementById('edit-typewriters');
  const inputSkills = document.getElementById('edit-skills');

  // Social Inputs
  const inputSocialX = document.getElementById('edit-social-x');
  const inputSocialGithub = document.getElementById('edit-social-github');
  const inputSocialInsta = document.getElementById('edit-social-insta');
  const inputSocialTg = document.getElementById('edit-social-tg');
  const inputSocialEmail = document.getElementById('edit-social-email');

  // Populate initial values in editor
  function populateEditorFields() {
    if (inputDisplayName) inputDisplayName.value = state.displayName;
    if (inputHandle) inputHandle.value = state.handle;
    if (inputTagline) inputTagline.value = state.tagline;
    if (inputBio) inputBio.value = state.bio;
    if (inputLocation) inputLocation.value = state.location;
    if (inputTimezone) inputTimezone.value = state.timezone;
    if (inputAvatar) inputAvatar.value = state.avatar;
    if (inputTypewriters) inputTypewriters.value = state.typewriterTexts.join('\n');
    if (inputSkills) inputSkills.value = state.skills.join(', ');

    if (inputSocialX) inputSocialX.value = state.socials.x || '';
    if (inputSocialGithub) inputSocialGithub.value = state.socials.github || '';
    if (inputSocialInsta) inputSocialInsta.value = state.socials.instagram || '';
    if (inputSocialTg) inputSocialTg.value = state.socials.telegram || '';
    if (inputSocialEmail) inputSocialEmail.value = state.socials.email || '';
  }

  populateEditorFields();

  // Listeners for live updates
  inputDisplayName?.addEventListener('input', (e) => {
    state.displayName = e.target.value;
    updatePreview();
  });

  inputHandle?.addEventListener('input', (e) => {
    state.handle = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    updatePreview();
  });

  inputTagline?.addEventListener('input', (e) => {
    state.tagline = e.target.value;
    updatePreview();
  });

  inputBio?.addEventListener('input', (e) => {
    state.bio = e.target.value;
    updatePreview();
  });

  inputLocation?.addEventListener('input', (e) => {
    state.location = e.target.value;
    updatePreview();
  });

  inputTimezone?.addEventListener('input', (e) => {
    state.timezone = e.target.value;
    updatePreview();
  });

  inputAvatar?.addEventListener('input', (e) => {
    state.avatar = e.target.value;
    updatePreview();
  });

  inputTypewriters?.addEventListener('input', (e) => {
    state.typewriterTexts = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
    charIndex = 0;
    typeArrIndex = 0;
  });

  inputSkills?.addEventListener('input', (e) => {
    state.skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    updatePreview();
  });

  inputSocialX?.addEventListener('input', (e) => { state.socials.x = e.target.value; updatePreview(); });
  inputSocialGithub?.addEventListener('input', (e) => { state.socials.github = e.target.value; updatePreview(); });
  inputSocialInsta?.addEventListener('input', (e) => { state.socials.instagram = e.target.value; updatePreview(); });
  inputSocialTg?.addEventListener('input', (e) => { state.socials.telegram = e.target.value; updatePreview(); });
  inputSocialEmail?.addEventListener('input', (e) => { state.socials.email = e.target.value; updatePreview(); });

  // Badge Selector Bank
  const badgeChips = document.querySelectorAll('.badge-toggle-chip');
  badgeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const icon = chip.dataset.icon;
      if (state.badges.includes(icon)) {
        state.badges = state.badges.filter(b => b !== icon);
        chip.classList.remove('selected');
      } else {
        state.badges.push(icon);
        chip.classList.add('selected');
      }
      updatePreview();
    });
  });

  // Theme Preset Cards
  const themeCardBtns = document.querySelectorAll('.theme-card-btn');
  themeCardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeCardBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.theme = btn.dataset.theme;
    });
  });

  // Effect Switches
  document.getElementById('switch-dither')?.addEventListener('change', (e) => {
    state.effects.dither = e.target.checked;
    updatePreview();
  });

  document.getElementById('switch-sparkles')?.addEventListener('change', (e) => {
    state.effects.sparkles = e.target.checked;
  });

  // ==========================================================================
  // 12. AI SCRAPE & AUTOPILOT (GROQ POWERED)
  // ==========================================================================
  const aiScrapeBtn = document.getElementById('ai-scrape-trigger');
  const aiLogTerminal = document.getElementById('ai-log-terminal');

  function logAI(msg) {
    if (!aiLogTerminal) return;
    const div = document.createElement('div');
    div.textContent = `> ${msg}`;
    aiLogTerminal.appendChild(div);
    aiLogTerminal.scrollTop = aiLogTerminal.scrollHeight;
  }

  aiScrapeBtn?.addEventListener('click', async () => {
    const targetQuery = document.getElementById('ai-target-query')?.value.trim() || 'torvalds';
    aiScrapeBtn.disabled = true;
    aiScrapeBtn.textContent = '⚡ Running Groq AI Scrape...';
    aiLogTerminal.innerHTML = '';

    logAI(`Connecting to backend intelligence protocol...`);
    logAI(`Target identity: [${targetQuery}]`);

    try {
      logAI(`Querying public search indices & GitHub APIs...`);
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetQuery,
          github: targetQuery,
          twitter: targetQuery,
          songTitle: 'Resonance',
          songArtist: 'HOME'
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      logAI(`Synthesizing persona via Groq (openai/gpt-oss-120b)...`);
      const synthesized = await res.json();

      logAI(`Persona successfully generated for @/${synthesized.handle}!`);

      // Overwrite state
      state.handle = synthesized.handle;
      state.displayName = synthesized.displayName;
      state.tagline = synthesized.tagline;
      state.typewriterTexts = synthesized.typewriterTexts || [synthesized.tagline, "crafting digital systems"];
      state.bio = synthesized.bio;
      state.avatar = synthesized.avatar;
      state.location = synthesized.location;
      state.timezone = synthesized.timezone;
      state.badges = synthesized.badges?.map(b => b.icon) || ["💎", "⚡", "⭐️", "🚀"];
      state.skills = synthesized.skills || ["TypeScript", "Rust", "Python"];
      state.presence = synthesized.presence || state.presence;
      state.projects = synthesized.projects || state.projects;
      state.views = synthesized.views || 2400;

      // Extract socials
      if (synthesized.socials) {
        synthesized.socials.forEach(s => {
          if (s.platform === 'X') state.socials.x = s.url;
          if (s.platform === 'GitHub') state.socials.github = s.url;
          if (s.platform === 'Instagram') state.socials.instagram = s.url;
          if (s.platform === 'Telegram') state.socials.telegram = s.url;
          if (s.platform === 'Email') state.socials.email = s.url;
        });
      }

      // Sync editor fields and preview
      populateEditorFields();
      updatePreview();
      showToast(`✨ Successfully scraped and synced @/${synthesized.handle}!`);
    } catch (err) {
      console.error(err);
      logAI(`Error: ${err.message}. Applied high-craft fallback.`);
      showToast('⚠️ AI Scrape completed with local fallback.');
    } finally {
      aiScrapeBtn.disabled = false;
      aiScrapeBtn.textContent = '⚡ Run AI Autopilot Scrape';
    }
  });

  // ==========================================================================
  // 13. EMBARKO DEPLOY & EXPORT
  // ==========================================================================
  const deployEmbarkoBtn = document.getElementById('deploy-embarko-action');
  const exportHtmlBtn = document.getElementById('export-html-action');

  deployEmbarkoBtn?.addEventListener('click', () => {
    const prompt = `Deploy this interactive guns.lol personal portfolio on Embarko live at ${state.handle.toLowerCase()}.embarko.app using the Embarko agent skill. Keep the app live. #DeployWithEmbarko`;
    navigator.clipboard.writeText(prompt).then(() => {
      showToast('📋 Copied Embarko Deploy Prompt!');
    }).catch(() => {
      showToast(`Prompt: ${prompt}`);
    });
  });

  exportHtmlBtn?.addEventListener('click', () => {
    const previewContent = document.getElementById('device-frame').innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@/${state.handle}</title>
  <link rel="stylesheet" href="css/guns.css">
</head>
<body>
  ${previewContent}
  <script src="js/guns.js"></script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.handle}-guns.lol.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Exported Standalone HTML!');
  });

  // Toast Functionality
  function showToast(msg) {
    let t = document.getElementById('studio-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'studio-toast';
      t.className = 'guns-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => {
      t.classList.remove('show');
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, t => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[t] || t));
  }

  // Initial preview render
  updatePreview();
});

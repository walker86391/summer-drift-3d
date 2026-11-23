/**
 * GUNS.LOL INTERACTIVE ENGINE
 * Animated title bar, audio controller, cursor sparkle trail, typewriter, world clock, and AI scraper.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. STATE & INITIAL PROFILE DATA
  // ==========================================================================
  let activeProfile = {
    handle: "crazy",
    displayName: "/crazy",
    tagline: "dystopias.xyz",
    typewriterTexts: ["dystopias.xyz", "full-stack developer", "crafting high-craft systems", "music & games"],
    bio: "full-stack developer. i like programming, music and playing games.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=crazy",
    location: "word",
    timezone: "GMT+1",
    badges: [
      { icon: "💎", name: "Premium" },
      { icon: "❄️", name: "Frost" },
      { icon: "⏱", name: "Early" },
      { icon: "⭐️", name: "Legend" },
      { icon: "🚀", name: "Dev" }
    ],
    skills: ["Python", "htmx", "Java", "CSS", "JavaScript", "C++", "Rust", "WebGL"],
    presence: {
      platform: "Roblox",
      status: "relapse",
      meta: "4 Friends · 46 Followers",
      avatar: "https://tr.rbxcdn.com/30DAY-Avatar-682482620ABE002A90EBC5B2BCAE8D4C-Png/420/420/Avatar/Png/noFilter"
    },
    projects: [
      {
        title: "Dystopia Stock",
        desc: "fully automated robux store.",
        url: "https://dystopias.xyz/",
        actionText: "Visit"
      },
      {
        title: "guns-engine",
        desc: "ultra-fast aesthetic biolink with animated titlebar.",
        url: "https://github.com",
        actionText: "Visit"
      }
    ],
    socials: [
      { icon: "𝕏", url: "https://x.com" },
      { icon: "✉️", url: "mailto:swat@dystopias.xyz" },
      { icon: "✈️", url: "https://t.me" },
      { icon: "🐙", url: "https://github.com" },
      { icon: "📷", url: "https://instagram.com" }
    ],
    views: 1669,
    theme: "silk"
  };

  // ==========================================================================
  // 2. ANIMATED BROWSER TITLE BAR (Signature guns.lol feature)
  // ==========================================================================
  let titleIndex = 0;
  let titleForward = true;
  let titleTimer = null;

  function startTitleAnimation(handle) {
    if (titleTimer) clearInterval(titleTimer);
    const base = `@/${handle}`;
    titleIndex = 1;
    titleForward = true;

    titleTimer = setInterval(() => {
      if (titleForward) {
        document.title = base.slice(0, titleIndex);
        titleIndex++;
        if (titleIndex > base.length) {
          titleForward = false;
        }
      } else {
        document.title = base.slice(0, titleIndex);
        titleIndex--;
        if (titleIndex < 2) {
          titleForward = true;
        }
      }
    }, 280);
  }

  startTitleAnimation(activeProfile.handle);

  // ==========================================================================
  // 3. AUDIO SYNTHESIZER & CONTROLS
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

  function playSynthChord(frequencies) {
    if (!audioCtx || !isPlaying) return;
    const now = audioCtx.currentTime;

    const chordGain = audioCtx.createGain();
    chordGain.gain.setValueAtTime(0.001, now);
    chordGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    chordGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    chordGain.connect(filter);
    filter.connect(masterGain);

    frequencies.forEach(f => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.connect(chordGain);
      osc.start(now);
      osc.stop(now + 2.9);
    });
  }

  const ambientChords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 392.00]  // G
  ];
  let chordIdx = 0;

  function toggleAudio() {
    initAudio();
    if (isPlaying) {
      isPlaying = false;
      if (synthLoop) clearInterval(synthLoop);
      if (audioIcon) audioIcon.textContent = '🔇';
    } else {
      isPlaying = true;
      if (audioIcon) audioIcon.textContent = '🔊';
      playSynthChord(ambientChords[chordIdx]);
      synthLoop = setInterval(() => {
        chordIdx = (chordIdx + 1) % ambientChords.length;
        playSynthChord(ambientChords[chordIdx]);
      }, 3000);
    }
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', toggleAudio);
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      initAudio();
      const val = parseFloat(e.target.value);
      if (masterGain) {
        masterGain.gain.setValueAtTime(val, audioCtx.currentTime);
      }
    });
  }

  // ==========================================================================
  // 4. TYPEWRITER EFFECT
  // ==========================================================================
  const typewriterEl = document.getElementById('typewriter-text');
  let typeArrIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  function tickTypewriter() {
    if (!typewriterEl) return;
    const texts = activeProfile.typewriterTexts;
    if (!texts || texts.length === 0) return;

    const currentStr = texts[typeArrIndex];

    if (isDeleting) {
      charIndex--;
      typeSpeed = 45;
    } else {
      charIndex++;
      typeSpeed = 95;
    }

    typewriterEl.textContent = currentStr.slice(0, charIndex);

    if (!isDeleting && charIndex === currentStr.length) {
      typeSpeed = 2200; // Pause at end of text
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      typeArrIndex = (typeArrIndex + 1) % texts.length;
      typeSpeed = 500; // Pause before typing next word
    }

    setTimeout(tickTypewriter, typeSpeed);
  }

  tickTypewriter();

  // ==========================================================================
  // 5. LIVE TIMEZONE WORLD CLOCK & TIME DELTA
  // ==========================================================================
  const clockEl = document.getElementById('live-clock');
  const clockMetaEl = document.getElementById('clock-meta');
  const clockDeltaEl = document.getElementById('clock-delta');

  function updateClock() {
    const now = new Date();
    // Parse timezone offset (e.g. GMT+1 or GMT-5)
    let offsetHours = 1;
    if (activeProfile.timezone.includes('+')) {
      offsetHours = parseFloat(activeProfile.timezone.split('+')[1]) || 0;
    } else if (activeProfile.timezone.includes('-')) {
      offsetHours = -parseFloat(activeProfile.timezone.split('-')[1]) || 0;
    }

    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetDate = new Date(utc + (3600000 * offsetHours));

    const timeStr = targetDate.toTimeString().split(' ')[0];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${days[targetDate.getDay()]}, ${months[targetDate.getMonth()]} ${targetDate.getDate()} · ${activeProfile.timezone}`;

    if (clockEl) clockEl.textContent = timeStr;
    if (clockMetaEl) clockMetaEl.textContent = dateStr;

    // Delta calculation
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
  // 6. LIQUID CHROME SILK & SHADER CANVAS
  // ==========================================================================
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) {
    const ctx = bgCanvas.getContext('2d');
    let w = (bgCanvas.width = window.innerWidth);
    let h = (bgCanvas.height = window.innerHeight);
    let t = 0;

    window.addEventListener('resize', () => {
      w = bgCanvas.width = window.innerWidth;
      h = bgCanvas.height = window.innerHeight;
    });

    function drawSilkWave() {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      if (activeProfile.theme === 'katana') {
        // Dark Katana Mist & Falling Snow
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        for (let i = 0; i < 60; i++) {
          const x = (Math.sin(t + i * 2) * 0.5 + 0.5) * w;
          const y = ((t * 80 + i * 30) % h);
          ctx.beginPath();
          ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Liquid Chrome Silk Cloth (guns.lol/crazy)
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#0a0a0c');
        grad.addColorStop(0.5, '#16161c');
        grad.addColorStop(1, '#08080a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Fluid flowing specular curves
        for (let j = 0; j < 5; j++) {
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
  // 7. MOUSE CURSOR SPARKLE TRAIL
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
      if (Math.random() < 0.4) {
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
  // 8. RENDER PROFILE DOM
  // ==========================================================================
  function renderProfile(data) {
    activeProfile = data;

    // Title animation
    startTitleAnimation(data.handle);

    // Hero Avatar
    const avatarEl = document.getElementById('hero-avatar');
    if (avatarEl) avatarEl.src = data.avatar;

    // Display Name
    const nameEl = document.getElementById('hero-display-name');
    if (nameEl) nameEl.textContent = data.displayName;

    // Badges Row
    const badgesRow = document.getElementById('hero-badges-row');
    if (badgesRow) {
      badgesRow.innerHTML = '';
      data.badges.forEach(b => {
        const span = document.createElement('span');
        span.className = 'badge-item';
        span.textContent = b.icon;
        span.title = b.name;
        badgesRow.appendChild(span);
      });
    }

    // Winged Social Links
    const socialsWrap = document.getElementById('winged-socials-wrap');
    if (socialsWrap) {
      socialsWrap.innerHTML = `
        <span class="wing-icon">🪽</span>
        <div style="display: flex; gap: 10px; align-items: center;" id="social-icons-inner"></div>
        <span class="wing-icon">🪽</span>
      `;
      const inner = document.getElementById('social-icons-inner');
      data.socials.forEach(s => {
        const a = document.createElement('a');
        a.className = 'social-glow-link';
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = s.icon;
        a.title = s.platform || 'Link';
        inner.appendChild(a);
      });
    }

    // View Count & Location
    const viewsEl = document.getElementById('hero-views-count');
    if (viewsEl) viewsEl.textContent = Number(data.views).toLocaleString();

    const locEl = document.getElementById('hero-location-text');
    if (locEl) locEl.textContent = data.location;

    // About Me Section
    const aboutTitleEl = document.getElementById('about-role-title');
    if (aboutTitleEl) aboutTitleEl.textContent = data.tagline;

    const aboutBioEl = document.getElementById('about-bio-text');
    if (aboutBioEl) aboutBioEl.textContent = data.bio;

    // Skills
    const skillsWrap = document.getElementById('skills-wrap');
    if (skillsWrap) {
      skillsWrap.innerHTML = '';
      data.skills.forEach(sk => {
        const chip = document.createElement('span');
        chip.className = 'skill-chip';
        chip.textContent = sk;
        skillsWrap.appendChild(chip);
      });
    }

    // Presence
    const presAvatar = document.getElementById('presence-avatar');
    if (presAvatar) presAvatar.src = data.presence.avatar || data.avatar;

    const presTitle = document.getElementById('presence-title');
    if (presTitle) presTitle.textContent = data.presence.status;

    const presMeta = document.getElementById('presence-meta');
    if (presMeta) presMeta.textContent = data.presence.meta || data.presence.game || 'Active';

    // Featured Projects
    const projectsList = document.getElementById('featured-projects-list');
    if (projectsList) {
      projectsList.innerHTML = '';
      data.projects.forEach(p => {
        const card = document.createElement('a');
        card.className = 'project-item';
        card.href = p.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.innerHTML = `
          <div class="project-left">
            <h4>${escapeHtml(p.title)}</h4>
            <p>${escapeHtml(p.desc)}</p>
          </div>
          <span class="btn-visit">${escapeHtml(p.actionText || 'Visit')} ↗</span>
        `;
        projectsList.appendChild(card);
      });
    }

    // Update Clock immediately
    updateClock();
  }

  // ==========================================================================
  // 9. STUDIO DRAWER & AI SCRAPING INTEGRATION
  // ==========================================================================
  const studioTriggerBtn = document.getElementById('studio-trigger-btn');
  const drawerBackdrop = document.getElementById('studio-drawer-backdrop');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const scrapeLaunchBtn = document.getElementById('scrape-launch-btn');
  const copyDeployBtn = document.getElementById('copy-deploy-btn');
  const exportHtmlBtn = document.getElementById('export-html-btn');

  function openDrawer() {
    drawerBackdrop?.classList.add('open');
  }

  function closeDrawer() {
    drawerBackdrop?.classList.remove('open');
  }

  studioTriggerBtn?.addEventListener('click', openDrawer);
  drawerCloseBtn?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', (e) => {
    if (e.target === drawerBackdrop) closeDrawer();
  });

  // Theme Pill Selector in Studio
  const themePills = document.querySelectorAll('.theme-pill-btn');
  themePills.forEach(btn => {
    btn.addEventListener('click', () => {
      themePills.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      activeProfile.theme = btn.dataset.theme;
    });
  });

  // Toast Functionality
  function showToast(msg) {
    let t = document.getElementById('guns-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'guns-toast';
      t.className = 'guns-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => {
      t.classList.remove('show');
    }, 3200);
  }

  // Run AI Scrape & Rebuild
  scrapeLaunchBtn?.addEventListener('click', async () => {
    const payload = {
      name: document.getElementById('field-name')?.value.trim() || 'crazy',
      github: document.getElementById('field-github')?.value.trim() || '',
      twitter: document.getElementById('field-twitter')?.value.trim() || '',
      instagram: document.getElementById('field-instagram')?.value.trim() || '',
      discord: document.getElementById('field-discord')?.value.trim() || '',
      songTitle: document.getElementById('field-song')?.value.trim() || 'Resonance'
    };

    scrapeLaunchBtn.disabled = true;
    scrapeLaunchBtn.textContent = '⚡ Querying Groq & Scraping...';

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const synthesized = await res.json();

      // Render updated profile
      renderProfile(synthesized);
      closeDrawer();
      showToast(`✨ Rebuilt profile for @/${synthesized.handle}!`);
    } catch (err) {
      console.error('Scrape error:', err);
      showToast('⚠️ Using local synthesis fallback.');
      // Local fallback
      activeProfile.handle = payload.github || payload.name;
      activeProfile.displayName = `/${activeProfile.handle}`;
      activeProfile.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${activeProfile.handle}`;
      renderProfile(activeProfile);
      closeDrawer();
    } finally {
      scrapeLaunchBtn.disabled = false;
      scrapeLaunchBtn.textContent = '⚡ AI Scrape & Rebuild';
    }
  });

  // Copy Embarko Deploy Prompt
  copyDeployBtn?.addEventListener('click', () => {
    const prompt = `Deploy this interactive guns.lol personal portfolio on Embarko live at ${activeProfile.handle.toLowerCase()}.embarko.app using the Embarko agent skill. Keep the app live. #DeployWithEmbarko`;
    navigator.clipboard.writeText(prompt).then(() => {
      showToast('📋 Copied Embarko Deploy Prompt!');
    }).catch(() => {
      showToast(`Prompt: ${prompt}`);
    });
  });

  // Export HTML
  exportHtmlBtn?.addEventListener('click', () => {
    const htmlBlob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(htmlBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProfile.handle}-guns.lol.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Exported Standalone HTML!');
  });

  // Scroll Down Button
  document.getElementById('scroll-down-btn')?.addEventListener('click', () => {
    document.getElementById('deep-profile')?.scrollIntoView({ behavior: 'smooth' });
  });

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
});

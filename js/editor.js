// ==========================================================================
// CYBER DRIFT // IN-GAME PORTFOLIO & CAR CUSTOMIZER
// Real-time synchronization, station modals, GitHub AI scraping & persistence
// ==========================================================================

const DEFAULT_PROFILE = {
  name: "Alex Rivera",
  handle: "arivera",
  tagline: "Creative Technologist // WebGL Engineer",
  bio: "Obsessed with high-performance graphics, real-time physics engines, and high-craft software. Exploring the tropical digital coast with top-down WebGL racing.",
  location: "California / Tropical Coast",
  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=arivera",
  carColor: "#ff6b6b",
  projects: [
    {
      title: "Cyber-Kernel",
      desc: "Ultra-low-latency WebGL graphics engine with custom deferred shading and spatial audio.",
      url: "https://github.com/torvalds",
      tags: ["WebGL", "Three.js", "GLSL", "C++"]
    },
    {
      title: "Aura-UI",
      desc: "Design token library and motion primitives inspired by cyberpunk HUDs and brutalist aesthetics.",
      url: "https://github.com",
      tags: ["TypeScript", "CSS Art", "Figma"]
    },
    {
      title: "Synthetix-Audio",
      desc: "Zero-dependency procedural sound generator using Web Audio API synthesis and spatial filters.",
      url: "https://github.com",
      tags: ["Web Audio", "DSP", "JavaScript"]
    }
  ],
  skills: [
    "WebGL / Three.js",
    "TypeScript",
    "Python",
    "Rust",
    "React / Next.js",
    "GLSL Shaders",
    "Web Audio API",
    "Physics Engines"
  ],
  socials: [
    { platform: "GitHub", icon: "🐙", url: "https://github.com" },
    { platform: "X / Twitter", icon: "𝕏", url: "https://x.com" },
    { platform: "Discord", icon: "💬", url: "https://discord.com" },
    { platform: "Email", icon: "✉️", url: "mailto:alex@cyberdrift.app" }
  ]
};

class PortfolioManager {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.profile = this.loadProfile();
    this.activeModal = null;

    this.initUI();
    this.bindEvents();
    this.syncProfileToScene();
  }

  loadProfile() {
    try {
      const saved = localStorage.getItem("cyberdrift_profile");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  }

  saveProfile() {
    try {
      localStorage.setItem("cyberdrift_profile", JSON.stringify(this.profile));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
    this.syncProfileToScene();
  }

  initUI() {
    // Populate drawer input fields
    document.getElementById("input-name").value = this.profile.name || "";
    document.getElementById("input-tagline").value = this.profile.tagline || "";
    document.getElementById("input-bio").value = this.profile.bio || "";
    document.getElementById("input-location").value = this.profile.location || "";
    document.getElementById("input-avatar").value = this.profile.avatar || "";

    // Sync Driver HUD Pill
    this.updateDriverHUD();
  }

  updateDriverHUD() {
    const pill = document.getElementById("hud-driver-name");
    if (pill) {
      pill.textContent = this.profile.name || "Driver";
    }
  }

  bindEvents() {
    // 1. Game engine callbacks
    this.game.onStationDetected = (station) => {
      this.showZoneBanner(station);
    };

    this.game.onStationLeft = () => {
      this.hideZoneBanner();
    };

    this.game.onStationEnter = (station) => {
      this.openStationModal(station.id);
    };

    this.game.onSpeedUpdate = (mph, gear) => {
      const speedVal = document.getElementById("hud-speed-val");
      const gearVal = document.getElementById("hud-gear-val");
      if (speedVal) speedVal.textContent = mph;
      if (gearVal) gearVal.textContent = gear;
    };

    this.game.onSkillCollected = (skill, count) => {
      const skillCountEl = document.getElementById("hud-skills-val");
      if (skillCountEl) skillCountEl.textContent = `${count}/6`;
    };

    // 2. Zone Proximity Banner Click
    const zoneOpenBtn = document.getElementById("zone-open-btn");
    if (zoneOpenBtn) {
      zoneOpenBtn.addEventListener("click", () => {
        if (this.game.activeStation) {
          this.openStationModal(this.game.activeStation.id);
        }
      });
    }

    // 3. Teleport Selector
    const teleportSelect = document.getElementById("teleport-select");
    if (teleportSelect) {
      teleportSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val) {
          this.game.teleportToStation(val);
          e.target.value = "";
        }
      });
    }

    // 4. Reset Car Button
    const resetBtn = document.getElementById("btn-reset-car");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.game.resetCar();
      });
    }

    // 5. Audio Mute Toggle
    const audioBtn = document.getElementById("btn-audio-toggle");
    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        if (window.cyberAudio) {
          window.cyberAudio.ensureContext();
          const muted = window.cyberAudio.toggleMute();
          audioBtn.innerHTML = muted ? "<span>🔇</span>" : "<span>🔊</span>";
          audioBtn.title = muted ? "Unmute Sound" : "Mute Sound";
        }
      });
    }

    // 6. Customizer Drawer Toggle
    const openDrawerBtn = document.getElementById("btn-open-customizer");
    const closeDrawerBtn = document.getElementById("btn-close-customizer");
    const drawer = document.getElementById("customizer-drawer");

    if (openDrawerBtn && drawer) {
      openDrawerBtn.addEventListener("click", () => {
        drawer.classList.add("open");
      });
    }
    if (closeDrawerBtn && drawer) {
      closeDrawerBtn.addEventListener("click", () => {
        drawer.classList.remove("open");
      });
    }

    // 7. Save Profile Button
    const saveProfileBtn = document.getElementById("btn-save-profile");
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", () => {
        this.profile.name = document.getElementById("input-name").value.trim();
        this.profile.tagline = document.getElementById("input-tagline").value.trim();
        this.profile.bio = document.getElementById("input-bio").value.trim();
        this.profile.location = document.getElementById("input-location").value.trim();
        this.profile.avatar = document.getElementById("input-avatar").value.trim() || DEFAULT_PROFILE.avatar;

        this.saveProfile();
        this.updateDriverHUD();
        drawer.classList.remove("open");

        // Flash confirmation
        this.showToast("Profile & 3D World Updated!");
      });
    }

    // 8. GitHub AI Quick-Fill Button
    const aiScrapeBtn = document.getElementById("btn-ai-scrape");
    if (aiScrapeBtn) {
      aiScrapeBtn.addEventListener("click", () => {
        const handle = document.getElementById("input-ai-handle").value.trim();
        if (!handle) {
          alert("Please enter a GitHub username or handle!");
          return;
        }
        this.scrapeAndAutoFill(handle, aiScrapeBtn);
      });
    }

    // 9. Color Swatches
    document.querySelectorAll(".color-swatch-btn").forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        document.querySelectorAll(".color-swatch-btn").forEach((s) => s.classList.remove("active"));
        swatch.classList.add("active");
        const color = swatch.getAttribute("data-color");
        this.profile.carColor = color;
        this.game.updateCarColor(parseInt(color.replace("#", "0x")));
      });
    });

    // 10. Close Station Modals
    const closeStationBtn = document.getElementById("btn-close-modal");
    const modalBackdrop = document.getElementById("station-modal");
    if (closeStationBtn && modalBackdrop) {
      closeStationBtn.addEventListener("click", () => {
        this.closeModal();
      });
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) {
          this.closeModal();
        }
      });
    }

    // Modal quick edit trigger
    const modalEditBtn = document.getElementById("btn-modal-edit");
    if (modalEditBtn && drawer) {
      modalEditBtn.addEventListener("click", () => {
        this.closeModal();
        drawer.classList.add("open");
      });
    }

    // 11. Embarko Deploy Button
    const deployBtn = document.getElementById("btn-deploy-embarko");
    if (deployBtn) {
      deployBtn.addEventListener("click", () => {
        this.openDeployModal();
      });
    }
  }

  syncProfileToScene() {
    if (this.profile.carColor) {
      const hex = parseInt(this.profile.carColor.replace("#", "0x"));
      this.game.updateCarColor(hex);
    }
  }

  showZoneBanner(station) {
    const banner = document.getElementById("zone-banner");
    const titleEl = document.getElementById("zone-banner-title");
    const subEl = document.getElementById("zone-banner-sub");
    const iconEl = document.getElementById("zone-banner-icon");

    if (banner && titleEl && subEl && iconEl) {
      titleEl.textContent = station.title;
      subEl.textContent = `${station.desc} (Press E or Tap to Open)`;
      iconEl.textContent = station.icon;
      banner.classList.add("active");
    }
  }

  hideZoneBanner() {
    const banner = document.getElementById("zone-banner");
    if (banner) {
      banner.classList.remove("active");
    }
  }

  openStationModal(stationId) {
    const backdrop = document.getElementById("station-modal");
    const titleEl = document.getElementById("modal-station-title");
    const tagEl = document.getElementById("modal-station-tag");
    const bodyEl = document.getElementById("modal-station-body");

    if (!backdrop || !bodyEl) return;

    let contentHtml = "";

    switch (stationId) {
      case "about":
        tagEl.textContent = "CHECKPOINT 01 // IDENTITY";
        titleEl.textContent = "About Me";
        contentHtml = `
          <div class="profile-hero-card">
            <img class="profile-avatar-img" src="${this.profile.avatar}" alt="${this.profile.name}">
            <div class="profile-details">
              <div class="profile-name">${this.profile.name}</div>
              <div class="profile-tagline">${this.profile.tagline}</div>
              <div class="profile-meta-row">
                <span>📍 ${this.profile.location}</span>
                <span>⚡ 60 FPS WebGL</span>
              </div>
            </div>
          </div>
          <div class="about-bio-text">
            ${this.profile.bio}
          </div>
        `;
        break;

      case "projects":
        tagEl.textContent = "CHECKPOINT 02 // SHOWROOM";
        titleEl.textContent = "Featured Projects";
        const projCards = this.profile.projects.map((p) => `
          <div class="project-card">
            <div class="project-top-row">
              <span class="project-title">${p.title}</span>
              <a class="project-link-btn" href="${p.url}" target="_blank" rel="noopener">
                View Project ↗
              </a>
            </div>
            <p class="project-desc">${p.desc}</p>
            <div class="project-tags">
              ${(p.tags || []).map((t) => `<span class="tag-pill">${t}</span>`).join("")}
            </div>
          </div>
        `).join("");
        contentHtml = `<div class="projects-grid">${projCards}</div>`;
        break;

      case "skills":
        tagEl.textContent = "CHECKPOINT 03 // TECH STACK";
        titleEl.textContent = "Skills & Mastery";
        const skillBadges = this.profile.skills.map((s) => `
          <div class="skill-badge-card">
            <span>⚡</span>
            <span>${s}</span>
          </div>
        `).join("");
        contentHtml = `
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
            Collected Crystals: ${this.game.collectedSkills} of ${this.game.skillPickups.length}. Drive across the track to pick up power-up crystals!
          </p>
          <div class="skills-tags-wrap">${skillBadges}</div>
        `;
        break;

      case "socials":
        tagEl.textContent = "CHECKPOINT 04 // WARP GATES";
        titleEl.textContent = "Social Frequencies";
        const socialCards = this.profile.socials.map((s) => `
          <a class="social-portal-btn" href="${s.url}" target="_blank" rel="noopener">
            <span class="social-icon-big">${s.icon}</span>
            <span>${s.platform}</span>
          </a>
        `).join("");
        contentHtml = `<div class="social-portals-grid">${socialCards}</div>`;
        break;

      case "vibe":
        tagEl.textContent = "CHECKPOINT 05 // AUDIO DECK";
        titleEl.textContent = "Drive-In Radio";
        contentHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 20px 0;">
            <div style="font-size: 48px;">📻</div>
            <div style="font-family: var(--font-mono); font-size: 18px; color: var(--cyan-neon); font-weight: 700;">
              RESONANCE // 104.2 FM
            </div>
            <p style="font-size: 13px; color: var(--text-muted); text-align: center; max-width: 360px;">
              Real-time synthesized audio powered by Web Audio API oscillators and lowpass filters. Scaled dynamically with car engine RPM and drift torque.
            </p>
            <button id="modal-radio-toggle" class="hud-btn primary" style="padding: 10px 24px; font-size: 13px;">
              Toggle Sound Engine
            </button>
          </div>
        `;
        break;
    }

    bodyEl.innerHTML = contentHtml;
    backdrop.classList.add("open");

    // Bind inner radio toggle button if present
    const radioBtn = document.getElementById("modal-radio-toggle");
    if (radioBtn) {
      radioBtn.addEventListener("click", () => {
        if (window.cyberAudio) {
          window.cyberAudio.ensureContext();
          const muted = window.cyberAudio.toggleMute();
          radioBtn.textContent = muted ? "Sound Muted (Click to Unmute)" : "Sound Active (Click to Mute)";
        }
      });
    }
  }

  closeModal() {
    const backdrop = document.getElementById("station-modal");
    if (backdrop) {
      backdrop.classList.remove("open");
    }
  }

  openDeployModal() {
    const backdrop = document.getElementById("station-modal");
    const titleEl = document.getElementById("modal-station-title");
    const tagEl = document.getElementById("modal-station-tag");
    const bodyEl = document.getElementById("modal-station-body");

    if (!backdrop || !bodyEl) return;

    tagEl.textContent = "#DeployWithEmbarko";
    titleEl.textContent = "Deploy 3D Game Portfolio";
    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <p style="font-size: 14px; color: #c9d1d9; line-height: 1.6;">
          Your 3D WebGL Racing Game Portfolio is completely standalone and ready for instant deployment to Embarko for the <strong>Deploy With Embarko Student Challenge</strong>!
        </p>
        <div style="background: rgba(0,0,0,0.5); border: 1px solid var(--border-neon); border-radius: 12px; padding: 14px; font-family: var(--font-mono); font-size: 12px;">
          <div style="color: var(--cyan-neon); margin-bottom: 6px;">✦ Embarko Deployment Prompt:</div>
          <div style="color: #fff; line-height: 1.5;">
            "Deploy this 3D WebGL racing game portfolio with Three.js arcade physics, interactive station checkpoints, real-time customizer, and mobile touch controls to my embarko.app subdomain."
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 8px;">
          <a class="hud-btn primary" href="https://embarko.ai/challenge" target="_blank" rel="noopener" style="flex: 1; justify-content: center; text-decoration: none;">
            Open Embarko Challenge ↗
          </a>
        </div>
      </div>
    `;
    backdrop.classList.add("open");
  }

  async scrapeAndAutoFill(handle, buttonEl) {
    const origText = buttonEl.innerHTML;
    buttonEl.innerHTML = "<span>⚡</span><span>Scanning GitHub...</span>";
    buttonEl.disabled = true;

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github: handle,
          name: handle
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      console.log("[Auto-Fill] Scraped persona:", data);

      // Auto populate fields
      if (data.displayName || data.handle) {
        this.profile.name = (data.displayName || data.handle).replace(/^\//, "");
        document.getElementById("input-name").value = this.profile.name;
      }
      if (data.tagline) {
        this.profile.tagline = data.tagline;
        document.getElementById("input-tagline").value = data.tagline;
      }
      if (data.bio) {
        this.profile.bio = data.bio;
        document.getElementById("input-bio").value = data.bio;
      }
      if (data.location) {
        this.profile.location = data.location;
        document.getElementById("input-location").value = data.location;
      }
      if (data.avatar) {
        this.profile.avatar = data.avatar;
        document.getElementById("input-avatar").value = data.avatar;
      }
      if (data.projects && data.projects.length) {
        this.profile.projects = data.projects.map((p) => ({
          title: p.title || "Project",
          desc: p.desc || "Open-source software project",
          url: p.url || `https://github.com/${handle}`,
          tags: ["Code", "Open-Source"]
        }));
      }
      if (data.skills && data.skills.length) {
        this.profile.skills = data.skills;
      }

      this.saveProfile();
      this.updateDriverHUD();
      this.showToast(`Auto-imported @${handle} into 3D World!`);
    } catch (err) {
      console.error("[Auto-Fill] Scrape failed:", err);
      // Fallback direct GitHub fetch
      try {
        const ghRes = await fetch(`https://api.github.com/users/${handle}`);
        if (ghRes.ok) {
          const ghUser = await ghRes.json();
          this.profile.name = ghUser.name || ghUser.login;
          this.profile.bio = ghUser.bio || this.profile.bio;
          this.profile.location = ghUser.location || this.profile.location;
          this.profile.avatar = ghUser.avatar_url || this.profile.avatar;

          document.getElementById("input-name").value = this.profile.name;
          document.getElementById("input-bio").value = this.profile.bio;
          document.getElementById("input-avatar").value = this.profile.avatar;

          this.saveProfile();
          this.updateDriverHUD();
          this.showToast(`Imported GitHub @${handle}!`);
        } else {
          alert("Could not find GitHub user: " + handle);
        }
      } catch (e) {
        alert("Could not reach GitHub API: " + e.message);
      }
    } finally {
      buttonEl.innerHTML = origText;
      buttonEl.disabled = false;
    }
  }

  showToast(msg) {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "80px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "rgba(0, 240, 255, 0.9)";
    toast.style.color = "#07090e";
    toast.style.fontFamily = "var(--font-mono)";
    toast.style.fontSize = "13px";
    toast.style.fontWeight = "700";
    toast.style.padding = "10px 22px";
    toast.style.borderRadius = "999px";
    toast.style.boxShadow = "0 0 20px rgba(0, 240, 255, 0.5)";
    toast.style.zIndex = "999";
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.4s ease";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }
}

window.PortfolioManager = PortfolioManager;

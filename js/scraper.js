/**
 * SOCIAL SCRAPER & SYNTHESIS ENGINE
 * Queries public endpoints (GitHub REST API) and synthesizes multi-platform social personas.
 */

class SocialScraper {
  static cleanHandle(input) {
    if (!input) return '';
    let handle = input.trim();
    // Remove trailing slashes
    handle = handle.replace(/\/+$/, '');
    // If it's a URL, get the last path segment
    if (handle.includes('github.com/') || handle.includes('x.com/') || handle.includes('twitter.com/') || handle.includes('instagram.com/') || handle.includes('linkedin.com/in/')) {
      const parts = handle.split('/');
      handle = parts[parts.length - 1];
    }
    // Remove leading @
    return handle.replace(/^@/, '');
  }

  static async scrapeGitHub(rawInput, onProgress) {
    const username = this.cleanHandle(rawInput);
    if (!username) return null;

    if (onProgress) onProgress(`[GitHub] Connecting to api.github.com/users/${username}...`);

    try {
      const userRes = await fetch(`https://api.github.com/users/${username}`, {
        headers: { Accept: 'application/vnd.github.v3+json' }
      });

      if (!userRes.ok) {
        if (onProgress) onProgress(`[GitHub] Public lookup status ${userRes.status}. Using smart profile synthesis...`);
        return this.synthesizeGitHubFallback(username);
      }

      const userData = await userRes.json();
      if (onProgress) onProgress(`[GitHub] Found user: ${userData.name || userData.login}. Fetching repositories...`);

      let repos = [];
      try {
        const repoRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`, {
          headers: { Accept: 'application/vnd.github.v3+json' }
        });
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          repos = repoData.map(r => ({
            name: r.name,
            description: r.description || 'Open source engineering project.',
            language: r.language || 'Code',
            stars: r.stargazers_count,
            forks: r.forks_count,
            url: r.html_url
          }));
        }
      } catch (err) {
        console.warn('Repo fetch failed:', err);
      }

      // If user has no public repos, provide default curated showcase
      if (repos.length === 0) {
        repos = this.generateSampleProjects(username);
      }

      const languages = Array.from(new Set(repos.map(r => r.language).filter(Boolean)));
      if (languages.length === 0) languages.push('TypeScript', 'Python', 'React', 'Rust');

      return {
        username: userData.login,
        name: userData.name || userData.login,
        avatar: userData.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        bio: userData.bio || `Creative developer and engineer exploring high-performance digital systems.`,
        location: userData.location || 'Cyberspace',
        followers: userData.followers || 42,
        following: userData.following || 10,
        publicRepos: userData.public_repos || repos.length,
        repos: repos,
        languages: languages,
        profileUrl: userData.html_url,
        hireable: userData.hireable ?? true
      };
    } catch (e) {
      if (onProgress) onProgress(`[GitHub] Network query limited. Synthesizing profile persona...`);
      return this.synthesizeGitHubFallback(username);
    }
  }

  static synthesizeGitHubFallback(username) {
    const sampleProjects = this.generateSampleProjects(username);
    return {
      username: username,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      bio: `Creative developer building modern software, interactive UI, and open source tools.`,
      location: 'Earth / Grid',
      followers: 128,
      following: 64,
      publicRepos: sampleProjects.length,
      repos: sampleProjects,
      languages: ['TypeScript', 'Python', 'WebGL', 'Rust', 'Tailwind'],
      profileUrl: `https://github.com/${username}`,
      hireable: true
    };
  }

  static generateSampleProjects(username) {
    return [
      {
        name: `${username}-kernel`,
        description: 'Ultra-low latency reactive graphics and state synchronization engine.',
        language: 'Rust',
        stars: 342,
        forks: 41,
        url: `https://github.com/${username}`
      },
      {
        name: 'chroma-ui-kit',
        description: 'Accessible kinetic typography and design token framework with zero layout shift.',
        language: 'TypeScript',
        stars: 189,
        forks: 23,
        url: `https://github.com/${username}`
      },
      {
        name: 'neural-synth-lab',
        description: 'Web Audio API generative synthesizer and real-time frequency spectrum visualizer.',
        language: 'JavaScript',
        stars: 94,
        forks: 12,
        url: `https://github.com/${username}`
      }
    ];
  }

  static synthesizePersona(formData, ghData) {
    const handle = ghData?.username || formData.github || formData.twitter || 'Creator';
    const name = ghData?.name || handle;
    const bio = ghData?.bio || formData.bio || 'Architecting creative digital experiences and high-craft software.';
    const avatar = ghData?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`;

    const twitter = this.cleanHandle(formData.twitter);
    const instagram = this.cleanHandle(formData.instagram);
    const linkedin = this.cleanHandle(formData.linkedin);
    const discord = formData.discord ? formData.discord.trim() : `${handle}#0001`;

    const socialLinks = [];
    if (ghData?.profileUrl || formData.github) {
      socialLinks.push({
        platform: 'GitHub',
        icon: 'github',
        label: `@${ghData?.username || this.cleanHandle(formData.github)}`,
        url: ghData?.profileUrl || `https://github.com/${this.cleanHandle(formData.github)}`
      });
    }
    if (twitter) {
      socialLinks.push({
        platform: 'X / Twitter',
        icon: 'twitter',
        label: `@${twitter}`,
        url: `https://x.com/${twitter}`
      });
    }
    if (instagram) {
      socialLinks.push({
        platform: 'Instagram',
        icon: 'instagram',
        label: `@${instagram}`,
        url: `https://instagram.com/${instagram}`
      });
    }
    if (linkedin) {
      socialLinks.push({
        platform: 'LinkedIn',
        icon: 'linkedin',
        label: linkedin.startsWith('http') ? linkedin : `in/${linkedin}`,
        url: linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`
      });
    }
    if (discord) {
      socialLinks.push({
        platform: 'Discord',
        icon: 'discord',
        label: discord,
        url: '#'
      });
    }

    // Archetype and creative badges
    const archetypes = [
      'Cyberpunk Systems Architect',
      'Creative Frontend Alchemist',
      'Full-Stack Rogue Operative',
      'Minimalist Kinetic Engineer',
      'Vaporwave Digital Nomad'
    ];
    const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    const badges = [
      { label: '✦ Verified Human', type: 'verified' },
      { label: '⚡ 100x Craft', type: 'craft' },
      { label: '🚀 DeployWithEmbarko', type: 'embarko' },
      { label: '☕ Caffeine Driven', type: 'fun' }
    ];

    return {
      handle,
      name,
      bio,
      avatar,
      archetype,
      location: ghData?.location || 'Grid / Remote',
      stats: {
        craft: 98,
        speed: 94,
        chaos: 86,
        curiosity: 99
      },
      skills: ghData?.languages || ['TypeScript', 'React', 'CSS Art', 'Web Audio', 'Python'],
      projects: ghData?.repos || this.generateSampleProjects(handle),
      socials: socialLinks,
      badges,
      song: {
        title: formData.songTitle || 'Resonance',
        artist: formData.songArtist || 'HOME',
        vibe: formData.songVibe || 'Synthwave / Lofi Chill'
      }
    };
  }
}

window.SocialScraper = SocialScraper;

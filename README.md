# Summer Drift 3D // Island Racing Game Portfolio

> 🌴 **Live Demo**: [https://walker86391.github.io/summer-drift-3d/](https://walker86391.github.io/summer-drift-3d/)

An interactive 3D WebGL racing game portfolio built with Three.js, arcade drift physics, top-down following camera, and real-time portfolio customization.

Inspired by Bruno Simon's iconic 3D portfolio, redesigned with a sunny desert island, beach cabanas, interactable props, and full mobile touch controls.

![Summer Drift 3D](https://raw.githubusercontent.com/walker86391/summer-drift-3d/main/assets/preview.png)

## Highlights

- **Top-Down Following Camera**: Elevated 55-degree chase camera smoothly tracking the vehicle with dynamic lookahead and speed-based FOV.
- **Arcade Drift Physics**: Real lateral slip angle physics, sand dust particles, and tire skid marks.
- **Interactable 3D Objects**: Ram into beach balls and wooden cargo crates to launch, roll, and tumble them across the island.
- **5 Interactive Cabana Stations**:
  1. **About Me (Cabana 01)**: Bamboo tiki hut with avatar hologram, profile details, and customizable bio.
  2. **Projects (Marina 02)**: Coastal exhibition dock showcasing projects with direct links.
  3. **Skills (Coconut Grove 03)**: Collectible golden coconuts with audio chimes.
  4. **Socials (Surf Shack 04)**: Wooden signpost portals to GitHub, X, Discord, and Email.
  5. **Tiki Radio Bar (Cabana 05)**: Drive-in sound deck powered by Web Audio API synthesizers.
- **In-Game Live Customizer**: Real-time slide-out drawer to edit name, bio, projects, and car paint colors with instant 3D sync.
- **GitHub AI Auto-Fill**: One-click import from any GitHub handle to populate repos, bio, and avatar.
- **Mobile First**: Full touch controls (D-pad steering, Gas, Brake/Rev, Drift) tested for phone judges.

## Running Locally

```bash
# Clone the repository
git clone https://github.com/walker86391/summer-drift-3d.git
cd summer-drift-3d

# Start the Python server
python server.py

# Open in your browser
# http://localhost:8089
```

## Controls

### Desktop
- **W / Up**: Accelerate (Gas)
- **S / Down**: Brake / Reverse
- **A / D or Left / Right**: Steer
- **Space**: Handbrake / Drift
- **R**: Reset car position
- **E / Enter**: Open active cabana card

### Mobile & Touch
- **Lower 65% of screen (below 35% from top)**: Tap and drag anywhere to spawn the dynamic virtual joystick (Up for gas, Down for reverse, Left/Right for steering).
- **Upper 35% of screen**: Swipe horizontally to freely look and rotate camera around the car.
- **Floating DRIFT Button**: Tap and hold the bottom-right pill button to trigger manual high-speed drifts.

## Built With
- Three.js (r128)
- Web Audio API (procedural engine synth, tire screeches, chimes)
- HTML5 Canvas & WebGL
- Groq AI LLM synthesis (`server.py`)

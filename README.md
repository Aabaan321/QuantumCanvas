# ✦ NebulaTouch v5 — Crystal Expanse

A hand-gesture-controlled 3D particle visualization powered by **Three.js** and **MediaPipe Hands**. Shape 18,000 glowing particles into stunning 3D forms using your hands — or mouse/touch if no webcam is available.

![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=threedotjs)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **18,000 particles** with glow sprite rendering and additive blending
- **8 morphing shapes** — Sphere, Heart, Cube, Galaxy, DNA, Torus Knot, Star, Tornado
- **20 hand gestures** for real-time control (pinch, swipe, peace, rock, etc.)
- **Mouse & touch fallback** — drag to rotate, scroll/pinch to zoom
- **Animated starfield** background with 3,000 stars
- **Dynamic lighting** — 3 orbiting colored point lights
- **9 toggleable effects** — Auto-Rotate, Gravity, Mirror, Freeze, Trails, Rainbow, Pulsate, Warp, Sound
- **Curated color palettes** — Crimson, Teal, Gold, Purple, Neo Green
- **FPS counter** and live gesture display
- **Screenshot capture** — save your creations as PNG

## 🚀 Getting Started

Since the app loads `app.js` as a module, you need a local HTTP server:

```bash
# Using Python
python -m http.server 8080

# Then open http://localhost:8080
```

> 💡 Hand tracking requires a webcam. Without one, all features still work via mouse/touch.

## 🎮 Controls

### Keyboard
| Key | Action |
|-----|--------|
| `N` / `B` | Next / Previous shape |
| `Space` | Explode particles |
| `R` | Rainbow mode |
| `W` | Warp speed |
| `T` | Trails |
| `P` | Pulsate |
| `S` | Toggle sound |
| `C` | Screenshot |

### Mouse / Touch
| Input | Action |
|-------|--------|
| Drag | Rotate |
| Scroll / Pinch | Zoom |

### Hand Gestures
| Gesture | Action |
|---------|--------|
| 👋 Swipe | Change shape |
| 🤏 Pinch | Resize |
| ✋ Move | Rotate |
| ✌️ Peace | Auto-rotate |
| 👍 Thumbs Up | Cycle colors |
| 👎 Thumbs Down | Reset view |
| ☝️ Point Up/Down | Speed ±|
| 🤘 Rock | Explode |
| 🖖 Vulcan | Freeze |
| 👌 OK | Vortex |
| ✊ / 🖐️ Fist/Open | Compress/Expand |
| 🤲 Both Open | Gravity field |
| ✌️✌️ Both Peace | Mirror mode |
| 👏 Clap | Shockwave |
| 🤏🤏 Both Pinch | Camera zoom |

## 🛠 Tech Stack

- **Three.js r128** — 3D rendering
- **MediaPipe Hands** — Real-time hand tracking
- **Web Audio API** — Sound synthesis
- **Vanilla HTML/CSS/JS** — No build tools required

## 📄 License

MIT

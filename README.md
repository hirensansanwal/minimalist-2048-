# Minimalist 2048

A sleek, distraction-free, and accessible web implementation of the classic 2048 puzzle game built with **React 19**, **TypeScript**, and **Vite**.

![2048 Preview](https://raw.githubusercontent.com/gabrielecirulli/2048/master/meta/og_image.png)

## ✨ Features

- **Smooth GPU Animations**: GPU-accelerated `translate3d` tile sliding, spawn pop, and merge pulse transitions.
- **Full Touch & Mobile Support**: Native-feeling swipe gesture detection with `touch-action: none;` preventing accidental browser scrolls.
- **Persistence**: Automatically preserves active game state and best score in `localStorage` across browser refreshes.
- **One-Step Undo**: Revert your previous move anytime (via UI button or <kbd>U</kbd> / <kbd>Ctrl+Z</kbd> keyboard shortcuts).
- **Responsive Design**: Fluid layout adapting from mobile viewports ($320\text{px}$) to wide desktop displays.
- **Accessibility & Themes**: WCAG AA color contrast, ARIA grid landmarks, polite live regions, and `prefers-reduced-motion` support for motion sensitivity.
- **Light & Dark Mode**: Adapts seamlessly to system color preferences.

## 🎮 How to Play

Join equal numbers to reach the **2048** tile!

- **Desktop**: Use Arrow Keys (<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>) or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>.
- **Mobile / Tablet**: Swipe in any direction across the board.
- **Undo**: Press <kbd>U</kbd> or click the **Undo** button.
- **New Game**: Click the **New Game** button to restart anytime.

## 🛠 Tech Stack

- **Framework**: React 19
- **Bundler**: Vite 8
- **Language**: TypeScript
- **Testing**: Node.js Native Test Runner (`node:test`)
- **Linter**: Oxlint

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v20+ recommended) installed.

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd minimalist-2048

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Run Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

## 📄 License

MIT

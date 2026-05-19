# Responsive Game Layout

Use this guide for PC and smartphone layout.

## Goal

The game fills the browser screen on:

- desktop
- laptop
- tablet
- smartphone portrait
- in-app browser

The current SP target is portrait play.

## CSS Role

CSS only fills the viewport and prevents scrolling.

Current baseline:

```css
.app-shell {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
}

.game-frame,
.game-canvas {
  width: 100%;
  height: 100%;
}

.game-canvas canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
```

Do not rotate the canvas with CSS.

## Phaser Role

Phaser handles:

- layout recalculation on resize
- menu element placement
- lane/road geometry
- character positions
- cue positions
- HUD positions
- pointer hit areas

Use `this.scale.width` and `this.scale.height` as the current visible size.

## Current Screen Layout Rules

### Start

- Background image fills the screen.
- Large `START!` button sits near the lower center.
- Trophy / settings / help buttons sit below.

### Music Select

- Card carousel is vertically centered.
- Setting button sits at lower right.
- Back button is hidden.

### Select Level

- Difficulty panels are centered.
- Back button sits beside the `START!` button.
- Setting button sits at lower right.

### Game

- Gameplay background fills the screen.
- Characters stand near the lower part of the lanes.
- Character buttons are large and sit under the matching character lane.
- Buttons should be close to one third of the screen width with small gaps.

## Pointer Coordinate Rule

Use Phaser/camera coordinates, not hand-written CSS transforms.

```ts
const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
```

## Mobile Checks

When changing layout:

- verify SP portrait
- verify desktop wide
- check button hit areas
- check text does not overflow
- check important UI is not cut off by the viewport

## Do Not

- rely on fixed pixel positions only
- rotate the canvas with CSS
- place important UI below the visible bottom
- use tiny buttons on SP
- let text overlap cards/buttons

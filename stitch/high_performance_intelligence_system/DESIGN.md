---
name: High-Performance Intelligence System
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#39393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#c6c6cf'
  on-secondary: '#2f3037'
  secondary-container: '#45464e'
  on-secondary-container: '#b4b4bd'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e2e1eb'
  secondary-fixed-dim: '#c6c6cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#45464e'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-xl:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid_columns: '12'
  gutter: 24px
  margin: 40px
  sidebar_width: 260px
  pane_min_width: 320px
  unit_base: 4px
---

## Brand & Style
The design system embodies a "High-Performance Intelligence" aesthetic, drawing inspiration from technical precision and sophisticated SaaS paradigms. It targets a professional audience that values efficiency, clarity, and tool-grade reliability. 

The style is **Corporate / Modern** with a lean toward **Minimalism** and **Glassmorphism**. It prioritizes high-density information display without visual clutter. The emotional response should be one of "calm authority"—the interface feels like a powerful, silent engine. Key visual markers include razor-sharp typography, subtle micro-interactions, and a strict adherence to a monochromatic base punctuated by a singular, vibrant energy color.

## Colors
The palette is rooted in a deep, "obsidian" neutral base to minimize eye strain and maximize focus. 

- **Primary:** Electric Blue (#3b82f6) is used exclusively for primary actions, active states, and critical progress indicators. It serves as the "signal" in the noise.
- **Neutral:** The core surface is #131314. Secondary surfaces use #1e1e20 to create depth through tonal layering rather than heavy shadows.
- **Support:** Functional colors for success, warning, and error should be desaturated to maintain the sophisticated atmosphere, only gaining vibrance on hover or interaction.

## Typography
This design system utilizes a trio of typefaces to establish a technical hierarchy:
- **Geist** handles the heavy lifting for headlines, providing a clean, geometric, and developer-centric feel.
- **Inter** is the workhorse for body copy, chosen for its exceptional legibility in data-dense environments.
- **JetBrains Mono** is reserved for labels, metadata, and "secondary intelligence" to reinforce the system's analytical nature.

On desktop, we leverage larger display sizes to create clear entry points for the eye. Tracking is slightly tightened on large headings to maintain a "locked-in" professional look.

## Layout & Spacing
The desktop layout utilizes a **12-column fluid grid** for the main content area, while global navigation elements remain fixed.

- **The Sidebar:** A fixed 260px left-hand navigation allows for rapid context switching. It should be semi-transparent with a background blur (16px) to maintain a sense of space.
- **Multi-Pane Layouts:** For complex workflows (e.g., reviewing transcripts while viewing analytics), the system uses a flexible pane model. Panes can be resized but have a minimum width of 320px to ensure content integrity.
- **Spacing Rhythm:** A 4px baseline grid ensures vertical consistency. Internal padding for cards and containers should default to 24px (6 units) to provide "breathability" in a high-density UI.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than traditional shadows.

1.  **Level 0 (Base):** #131314 - The canvas.
2.  **Level 1 (Cards/Panes):** #1e1e20 with a 1px border of #27272a.
3.  **Level 2 (Popovers/Modals):** #27272a with a subtle 10% white inner border on the top edge to simulate a light source.

Backdrop blurs (`blur(12px)`) are applied to fixed headers and sidebars to create a "glass" effect that prevents the dark UI from feeling heavy or claustrophobic.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a subtle modern touch without sacrificing the "industrial" and "precise" feel of the system. 

- **Small Components:** Checkboxes and small buttons use the base 4px radius.
- **Large Components:** Cards and main content containers use `rounded-lg` (8px).
- **Interactive Elements:** Active states are often indicated by a vertical 2px "pill" bar on the left edge of list items rather than fully rounded shapes.

## Components
- **Sidebar:** Navigation items use a "Ghost" style by default, shifting to a subtle gray background on hover and the primary blue for the active indicator bar. Use JetBrains Mono for category headers.
- **Top Navigation:** Breadcrumbs are essential for desktop wayfinding. Use a "/" separator and ensure the current page is high-contrast white.
- **Buttons:** 
    - *Primary:* Solid Electric Blue with white text.
    - *Secondary:* Dark gray background (#27272a) with a subtle border.
    - *Tertiary:* Ghost style (text only) that reveals a background on hover.
- **Input Fields:** Use a solid background (#1e1e20) with a 1px border. The border glows with a 2px blue outer shadow only when focused.
- **Multi-Pane Dividers:** Use a 1px border (#27272a). Interaction handles for resizable panes should be invisible until hover, appearing as a subtle blue vertical line.
- **Chips:** Small, rectangular with 2px radius. Use for status (e.g., "AI-Generated", "Verified") with low-opacity background tints of the status color.
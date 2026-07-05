---
name: Ecclesia Administrative System
colors:
  surface: '#FFFFFF'
  surface-dim: '#d2daeb'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#e0e9f9'
  surface-container-highest: '#dae3f4'
  on-surface: '#131c28'
  on-surface-variant: '#45464d'
  inverse-surface: '#28313d'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#525e7b'
  primary: '#08152e'
  on-primary: '#ffffff'
  primary-container: '#1e2a44'
  on-primary-container: '#8591b0'
  inverse-primary: '#bac6e7'
  secondary: '#785a00'
  on-secondary: '#ffffff'
  secondary-container: '#ffd169'
  on-secondary-container: '#765900'
  tertiary: '#151615'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a2b29'
  on-tertiary-container: '#92928f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#bac6e7'
  on-primary-fixed: '#0e1b34'
  on-primary-fixed-variant: '#3b4662'
  secondary-fixed: '#ffdf9b'
  secondary-fixed-dim: '#ecc15a'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#e3e2df'
  tertiary-fixed-dim: '#c7c6c4'
  on-tertiary-fixed: '#1b1c1a'
  on-tertiary-fixed-variant: '#464745'
  background: '#f8f9ff'
  on-background: '#131c28'
  surface-variant: '#dae3f4'
  text-primary: '#1A1A1A'
  success: '#2F6B4F'
  warning: '#B4740E'
  danger: '#A63A3A'
  neutral-badge: '#6B7280'
typography:
  report-title:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-table:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '450'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 260px
  sidebar-collapsed: 64px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is built upon a foundation of **dignified authority and administrative clarity**. It is designed for a religious hierarchy that requires a balance between traditional significance and modern technical efficiency. The personality is "Steadfast," "Formal," and "Quietly Authoritative," moving away from the ephemeral nature of standard corporate SaaS toward a sense of institutional permanence.

The visual style is **Corporate / Modern** with a lean toward **Minimalism**. It prioritizes high data density and legibility without feeling cluttered. The interface utilizes a structured layout, purposeful whitespace, and a dual-typography system to distinguish between active management and official documentation. The emotional response should be one of trust, stability, and serious purpose.

## Colors

The color palette is derived from liturgical themes, substituting standard "SaaS Blue" with a deep, authoritative Indigo. 

- **Primary (#1E2A44):** Used for structural elements like the sidebar and headers to provide a "weighty" frame for the application.
- **Secondary (#B8912F):** A muted gold reserved for highlights, active states, and primary actions. It signifies importance without being garish.
- **Background (#F6F5F2):** A warm neutral chosen to reduce eye strain during long administrative sessions, providing a softer contrast than pure white.
- **Surface (#FFFFFF):** Used for cards and data containers to make them pop against the warm background.
- **Semantic Colors:** Green, Amber, and Red are deeply saturated to ensure high visibility for compliance statuses (Submitted, Pending, Overdue).

## Typography

This system employs a strict dual-font strategy:

1.  **IBM Plex Sans:** The workhorse of the system. Used for all interface elements, navigation, and data tables. Its technical clarity and excellent numeral legibility make it ideal for handling large datasets and administrative grids.
2.  **Source Serif 4:** Reserved exclusively for official report titles and generated PDF exports. This provides a formal, "documentary" feel that bridges the gap between digital management and physical record-keeping.

Use `data-table` for all tabular information to ensure alignment and readability. Labels should always be uppercase when used in a `label-sm` context to provide clear categorisation in dense forms.

## Layout & Spacing

The layout follows a **Global Application Shell** model with a fixed left-hand sidebar and a top navigation bar for breadcrumbs and global search.

- **Grid:** A 12-column fluid grid is used within the "Main Content Area." On desktop, margins are set to 24px.
- **Responsive Behavior:** 
    - **Desktop (1024px+):** Fixed sidebar. 
    - **Tablet:** Sidebar collapses to a 64px icon-only rail.
    - **Mobile:** Sidebar becomes a hidden off-canvas drawer, and page margins reduce to 16px.
- **Rhythm:** A standard 8px-based spacing system (stack-sm, stack-md, stack-lg) ensures consistent vertical rhythm between card elements and form fields.

## Elevation & Depth

This system avoids heavy shadows in favor of **Tonal Layers** and crisp borders to maintain a professional, administrative look.

- **Level 0 (Background):** The warm neutral surface (#F6F5F2).
- **Level 1 (Cards/Tables):** Pure white surfaces with a subtle 1px border (#E5E7EB) and a very soft, low-opacity ambient shadow to provide just enough lift to separate content from the background.
- **Level 2 (Slide-over Panels):** Used for Create/Edit tasks. These use a higher elevation with a 20% opacity backdrop overlay to focus the user's attention on the task at hand without losing the context of the parent screen.
- **Sidebar:** Uses a flat, dark primary color with no shadow, acting as a structural anchor rather than a floating element.

## Shapes

The shape language is primarily **Soft (0.25rem)** to maintain a disciplined, professional appearance. 

- **Containers:** Cards and input fields use the standard 0.25rem radius.
- **Pill-Shaped Elements:** Status badges and "Scope Badges" (Parish, Deanery, etc.) are the only elements that use a full `rounded-full` (pill) treatment. This distinction helps interactive or status-based metadata stand out against the more rigid, rectangular structure of the data tables.

## Components

- **Buttons:** Primary buttons use the Accent Gold (#B8912F) with white text. Secondary buttons use a primary-colored outline. All buttons have a subtle 2px vertical padding increase to feel more "substantial."
- **Status Badges:** Always pill-shaped. Use semantic background colors with a high-contrast dark text variant for accessibility.
- **Data Tables:** High-density rows with 12px vertical padding. Headers should be sticky with a subtle bottom border. Use IBM Plex Sans specifically for all numeric data.
- **Stat Cards:** Located at the top of dashboards. Features a large-format number, a clear label, and a small Lucide icon in the top right.
- **Slide-over Panels:** These slide in from the right. They must include a clear header with a "Close" icon and a fixed footer for "Save/Cancel" actions.
- **Sidebar Navigation:** Active items use a vertical gold bar on the left edge and a subtle background tint. The "User Info Card" is permanently pinned to the bottom of the sidebar.
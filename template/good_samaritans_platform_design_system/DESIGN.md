---
name: Good Samaritans Platform Design System
colors:
  surface: '#fbf8ff'
  surface-dim: '#dbd9e1'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2fb'
  surface-container: '#efecf5'
  surface-container-high: '#eae7ef'
  surface-container-highest: '#e4e1ea'
  on-surface: '#1b1b21'
  on-surface-variant: '#454652'
  inverse-surface: '#303036'
  inverse-on-surface: '#f2eff8'
  outline: '#767683'
  outline-variant: '#c6c5d4'
  surface-tint: '#4c56af'
  primary: '#000666'
  on-primary: '#ffffff'
  primary-container: '#1a237e'
  on-primary-container: '#8690ee'
  inverse-primary: '#bdc2ff'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#380b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#5c1800'
  on-tertiary-container: '#e17c5a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000767'
  on-primary-fixed-variant: '#343d96'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#7b2e12'
  background: '#fbf8ff'
  on-background: '#1b1b21'
  surface-variant: '#e4e1ea'
  navy-deep: '#0A1128'
  charcoal-dark: '#1C1C1C'
  gold-accent: '#D4AF37'
  status-published: '#2E7D32'
  status-draft: '#FBC02D'
  status-error: '#D32F2F'
  surface-muted: '#F5F7F8'
  border-subtle: '#E0E0E0'
typography:
  h1-display:
    fontFamily: Work Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
  h1-mobile:
    fontFamily: Work Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  h2-section:
    fontFamily: Work Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  h3-heading:
    fontFamily: Work Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.8'
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  eyebrow:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  label-small:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
  blockquote:
    fontFamily: Source Sans 3
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  section-gap: 80px
  section-gap-mobile: 48px
  gutter: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

# Good Samaritans Platform — Full Page Content Descriptions
**UI & Content Reference Document**

> This document describes every visible element, section, piece of text, and interactive component on every page of the platform. It is the single source of truth for designers and developers building the UI.

---

## Table of Contents

### Public Website (`goodsamaritans.com`)
1. [Global Elements — Navbar & Footer](#1-global-elements--navbar--footer)
2. [Home Page](#2-home-page)
3. [About Page](#3-about-page)
4. [Leadership Page](#4-leadership-page)
5. [Ministries Page](#5-ministries-page)
6. [News Listing Page](#6-news-listing-page)
7. [News Article Detail Page](#7-news-article-detail-page)
8. [Media Page](#8-media-page)
9. [Contact Page](#9-contact-page)

### Admin Dashboard (`admin.goodsamaritans.com`)
10. [Login Page](#10-login-page)
11. [Global Admin Elements — Sidebar & Top Bar](#11-global-admin-elements--sidebar--top-bar)
12. [Dashboard Overview Page](#12-dashboard-overview-page)
13. [News Management — Article List](#13-news-management--article-list)
14. [News Management — Create / Edit Article](#14-news-management--create--edit-article)
15. [Leadership Management Page](#15-leadership-management-page)
16. [Ministries Management Page](#16-ministries-management-page)
17. [Media Management Page](#17-media-management-page)
18. [Page Content Editor](#18-page-content-editor)

---

---

# PUBLIC WEBSITE

---

## 1. Global Elements — Navbar & Footer

### Navbar
The navbar is fixed to the top of the viewport and remains visible as the user scrolls. It has a white background with a subtle bottom border or drop shadow to lift it above page content.

**Left side — Brand / Logo:**
- The Good Samaritans logo (an icon + the text "Good Samaritans") sits on the far left.
- Below the name, in a smaller muted font, the tagline: *"Kampala Archdiocese"*.
- Clicking the logo returns the user to the Home page.

**Center — Navigation Links:**
The following links are displayed horizontally in the center of the navbar on desktop:
- **Home** — routes to `/`
- **About** — routes to `/about`
- **Leadership** — routes to `/leadership`
- **Ministries** — routes to `/ministries`
- **News** — routes to `/news`
- **Media** — routes to `/media`
- **Contact** — routes to `/contact`

The currently active page link is underlined or highlighted with the brand accent color to indicate the user's location.

**Right side — Call to Action:**
- A solid button labeled **"Find Your Parish"** that links to `/ministries`.
- On mobile, this button collapses into the hamburger menu.

**Mobile Behavior:**
- On screens below 768px, the center navigation links are hidden.
- A hamburger menu icon (three stacked lines) appears on the right.
- Tapping it slides down a full-width dropdown menu listing all navigation links vertically, plus the "Find Your Parish" button at the bottom.

---

### Footer
The footer sits at the very bottom of every page and has a dark background (deep navy or charcoal) with white/light-gray text.

**Layout: Three columns on desktop, stacked on mobile.**

**Column 1 — About the Organization:**
- The Good Samaritans logo in white.
- Two to three sentences describing the mission: serving the Kampala Archdiocese by connecting the faithful with their parishes, news, and community.
- Social media icon links: Facebook, Twitter/X, YouTube, Instagram (icons only, no labels).

**Column 2 — Quick Links:**
- Heading: **"Quick Links"**
- Vertical list of the same navigation links as the navbar: Home, About, Leadership, Ministries, News, Media, Contact.

**Column 3 — Contact Information:**
- Heading: **"Get In Touch"**
- A location pin icon followed by the physical address of the Archdiocese.
- A phone icon followed by the main contact phone number.
- An envelope icon followed by the main contact email address.
- A small embedded Google Maps static image or pin showing the Archdiocese headquarters location (optional).

**Bottom Bar:**
- A thin dividing line separates the columns from the bottom bar.
- Left: copyright text — *"© 2025 Good Samaritans — Kampala Archdiocese. All rights reserved."*
- Right: small links for *Privacy Policy* and *Terms of Use*.

---

## 2. Home Page

The Home Page is the primary landing experience. It is built from dynamic content fetched from the database, so every section can be updated by an admin without a code change.

---

### Section 1 — Hero
This is the first thing a visitor sees — a full-viewport-height section that fills the entire screen.

**Background:**
- A high-quality full-bleed photograph of the Kampala Archdiocese, a cathedral interior, or a congregation gathered in worship. The image has a semi-transparent dark overlay (roughly 50% opacity) to ensure text is legible on top of it.

**Content (centered vertically and horizontally):**
- **Eyebrow text** (small, uppercase, letter-spaced): *"Kampala Archdiocese"*
- **Main Heading (H1):** A large, bold headline pulled from the database — e.g., *"Welcome to the Good Samaritans"*. This is the most prominent text on the entire site.
- **Subtitle:** A supporting sentence beneath the heading — e.g., *"Serving the faithful of Uganda with Faith, Hope, and Love"*. Slightly smaller, lighter weight, and more transparent than the heading.
- **Two CTA Buttons:**
  - Primary (solid, brand color): **"Find Your Parish"** → links to `/ministries`
  - Secondary (outlined, white border): **"Read Our News"** → links to `/news`

**Scroll Indicator:**
- At the very bottom of the hero, a small animated downward-pointing arrow or chevron that hints to the user they can scroll.

---

### Section 2 — Quick Stats Banner
A narrow horizontal band below the hero with a white or light-gray background. It displays four key statistics side by side, each with a large bold number and a label beneath it.

| Stat | Example Value | Label |
|---|---|---|
| 1 | 4 | Vicariates |
| 2 | 24 | Deaneries |
| 3 | 150+ | Parishes |
| 4 | 3M+ | Faithful Served |

Each stat is separated by a subtle vertical divider line. The numbers are displayed in the brand accent color.

---

### Section 3 — About / Mission Snippet
A two-column layout (text on the left, image on the right) on desktop, stacked on mobile.

**Left Column:**
- **Small label** (uppercase, brand color): *"Who We Are"*
- **Heading (H2):** *"Our Mission"* — pulled from the database.
- **Body text:** Two to three paragraphs describing the Archdiocese's mission, vision, and commitment to the community — also pulled from the `page_content` table.
- **CTA Link:** A text link with a right-arrow icon — *"Learn more about us →"* — that routes to `/about`.

**Right Column:**
- A rounded or slightly rotated image of the cathedral, a community gathering, or a religious ceremony. The image has a decorative accent element (e.g., a colored background square peeking out behind it).

---

### Section 4 — Latest News
A full-width section with a light background.

**Header area:**
- **Heading (H2):** *"Latest News"*
- A right-aligned text link: *"View all news →"* that routes to `/news`.

**Content:**
- Three news cards displayed in a three-column grid on desktop, a two-column grid on tablet, and a single column on mobile.
- Each **News Card** contains:
  - A cover image (16:9 ratio, rounded corners at the top).
  - A small **category badge** (e.g., "Pastoral", "Events", "General") in the top-left of the image.
  - The article **title** in bold — up to two lines, truncated with an ellipsis if longer.
  - The article **subtitle** — up to three lines of muted, smaller text.
  - A **metadata row** at the bottom of the card: a calendar icon + the published date (e.g., "June 12, 2025"), separated by a dot from a small reading time estimate (e.g., "4 min read").
  - The entire card is clickable and routes to `/news/[slug]`.
  - On hover, the card lifts slightly with a subtle box shadow.

---

### Section 5 — Find Your Parish (Ministries Preview)
A visually distinct section, potentially with a brand-color or pattern background.

**Header:**
- **Heading (H2):** *"Find Your Parish"*
- **Subheading:** *"The Kampala Archdiocese is home to over 150 parishes across 4 Vicariates. Find the one nearest to you."*

**Content:**
- A simplified visual of the hierarchy — three "step" icons in a row showing: Vicariate → Deanery → Parish — with a brief one-line description under each.
- A large, prominent CTA button: **"Explore All Parishes"** → routes to `/ministries`.
- Below the button, an optional small inline map preview (static image) hinting at the geographic spread of parishes.

---

### Section 6 — Leadership Spotlight
A section showcasing two to three of the top-level Archdiocese leaders.

**Header:**
- **Heading (H2):** *"Our Leadership"*
- A right-aligned link: *"Meet the full team →"* → `/leadership`.

**Content:**
- Two or three **Leader Cards** displayed in a row.
- Each **Leader Card** contains:
  - A circular profile photo.
  - The leader's **full name** in bold.
  - Their **title** (e.g., "Archbishop of Kampala") in a smaller muted font.
  - A one-sentence excerpt from their bio.

---

### Section 7 — Media / Video Preview
A dark-background section showcasing the media presence of the Archdiocese.

**Header:**
- **Heading (H2):** *"Watch & Listen"*
- A subtitle: *"Sermons, events, and community stories — available anytime."*

**Content:**
- One featured YouTube video displayed as a large thumbnail embed (using `lite-youtube-embed`).
- Two smaller video thumbnails displayed alongside or below it.
- Each thumbnail shows the video title beneath it.
- A CTA button: **"View All Videos"** → routes to `/media`.

---

### Section 8 — Contact / Stay Connected Banner
A full-width, high-contrast section (dark background, white text) near the bottom of the page.

**Content (centered):**
- **Heading:** *"Get In Touch"*
- **Subheading:** *"Have a question, prayer request, or want to get involved? We'd love to hear from you."*
- **Two side-by-side buttons:**
  - Primary: **"Contact Us"** → routes to `/contact`
  - Secondary (outlined): **"Find a Parish"** → routes to `/ministries`

---

## 3. About Page

### Section 1 — Page Hero (Inner Banner)
A shorter hero (roughly 40% of viewport height, not full-screen like the homepage).

- **Background:** A full-width photograph with a dark overlay.
- **Breadcrumb:** *"Home / About"* in small text above the heading.
- **Heading (H1):** *"About the Good Samaritans"*
- **Subtitle:** One sentence summarizing the page purpose.

---

### Section 2 — Our Story
A two-column section (image on the left, text on the right).

- **Label:** *"Our History"*
- **Heading (H2):** *"A Legacy of Faith"*
- **Body:** Three to four paragraphs telling the history of the Kampala Archdiocese and the Good Samaritans initiative — when it was founded, the key milestones, and how it has grown.
- **Image:** A historical photograph or a meaningful image relevant to the story.

---

### Section 3 — Mission, Vision & Values
Three cards displayed in a row.

Each card has:
- A large icon at the top (e.g., a cross for Mission, a lamp for Vision, a star for Values).
- A **Heading** (e.g., *"Our Mission"*, *"Our Vision"*, *"Core Values"*).
- Two to three sentences of text.

---

### Section 4 — By the Numbers
Same stats banner as on the Home Page, repeated here for context.

---

### Section 5 — Organizational Structure
A simple org-chart diagram or a visual explanation of how the Archdiocese is structured:
- Archdiocese at the top.
- Below it: four Vicariate blocks.
- Below each Vicariate: Deanery blocks.
- Below each Deanery: Parish blocks.

A short paragraph explains each level.

---

## 4. Leadership Page

### Section 1 — Page Hero (Inner Banner)
- **Background:** Full-width image with overlay.
- **Breadcrumb:** *"Home / Leadership"*
- **Heading (H1):** *"Our Leadership"*
- **Subtitle:** *"Meet the dedicated men and women who guide the Kampala Archdiocese."*

---

### Section 2 — Archdiocese-Level Leadership
The topmost level — the Archbishop and any Auxiliary Bishops.

- **Section label:** *"Archdiocese Leadership"*
- **Layout:** A single centered card (or two cards side by side) for the Archbishop and Auxiliary Bishop.

Each **Full Leader Card** at this level is larger and more prominent:
- A large circular or rounded-square photograph.
- **Full name** (large, bold).
- **Title** (e.g., *"Archbishop of Kampala"*).
- A **full bio** of two to three paragraphs, describing their background, appointment, and ministry focus.
- Optional: A pull-quote from the leader in stylized blockquote formatting.

---

### Section 3 — Vicariate Leaders
- **Section label:** *"Vicariate Vicars"*
- A four-column grid (one card per Vicariate Vicar).
- Each card is a smaller version of the Full Leader Card: circular photo, name, title, the name of their Vicariate, and a short one-paragraph bio.

---

### Section 4 — Deanery & Parish Leadership
- A tabbed or accordion section. The tab labels are the Vicariate names.
- Selecting a Vicariate tab reveals the Deans of each Deanery in that Vicariate in a grid.
- Each Dean card shows: photo, name, title, and which Deanery they oversee.

---

## 5. Ministries Page

### Section 1 — Page Hero (Inner Banner)
- **Heading (H1):** *"Our Ministries & Parishes"*
- **Subtitle:** *"Explore the full network of the Kampala Archdiocese — from Vicariates down to individual parishes near you."*

---

### Section 2 — Interactive Hierarchy Explorer
The main feature of this page. A split-panel layout on desktop:

**Left Panel — Navigation Tree:**
- A vertical accordion list showing all four Vicariates.
- Each Vicariate row has a right-arrow/chevron icon.
- Clicking a Vicariate expands it to reveal its Deaneries as an indented sub-list.
- Clicking a Deanery expands it to reveal its Parishes as a further-indented list.
- Clicking a Parish highlights it and updates the right panel.
- The currently selected item is highlighted in the brand accent color.

**Right Panel — Detail View:**
When a Parish is selected, the right panel updates to show:
- **Parish Name** (H2).
- **Physical Address** with a location pin icon.
- **Mass Times** — displayed as a formatted list (e.g., "Sunday: 8:00 AM, 10:00 AM, 12:00 PM").
- **Phone Number** with a phone icon.
- **Email Address** with an envelope icon.
- **Google Maps Embed** — an inline map centered on the parish's GPS coordinates (latitude/longitude).
- **Parish Priest** — if a leader is assigned to this parish, a small leader card showing their photo, name, and title.

When no Parish is selected (default), the right panel shows:
- A prompt: *"Select a parish from the list to view details."*
- A decorative illustration or icon.

---

### Section 3 — Parish Search Bar
Above the hierarchy explorer, a search input allows the user to type a parish name to quickly filter the list. The hierarchy tree updates in real time as the user types.

---

### Section 4 — Full Parishes Map
Below the explorer, a full-width embedded Google Map showing pin markers for every parish that has GPS coordinates. Clicking a pin opens a small info popup with the parish name and address.

---

## 6. News Listing Page

### Section 1 — Page Hero (Inner Banner)
- **Heading (H1):** *"News & Updates"*
- **Subtitle:** *"Stay informed with the latest pastoral letters, community events, and stories from across the Archdiocese."*

---

### Section 2 — Filter Bar
A horizontal bar below the hero with two controls:

- **Category Filter:** A row of pill/chip buttons for each category (e.g., "All", "Pastoral", "Events", "Community", "International"). The active category is filled/highlighted.
- **Search Input:** A text input on the right side with a search icon, allowing full-text search of article titles.

---

### Section 3 — Featured Article
The most recently published article is displayed as a large featured card spanning the full width of the content area.

**Featured Card contains:**
- A large cover image (approximately 50% of the card width) on the left.
- On the right: category badge, title (H2, large), subtitle (two to three lines), published date, and a **"Read Article →"** button.

---

### Section 4 — Articles Grid
Below the featured card, the remaining articles are displayed in a three-column grid.

Each **News Card** (same design as on the Home Page) contains:
- Cover image (16:9, rounded top corners).
- Category badge.
- Title (bold, up to two lines).
- Subtitle (muted, up to three lines).
- Published date and estimated reading time.
- The entire card links to `/news/[slug]`.

---

### Section 5 — Pagination
At the bottom of the articles grid, a pagination bar:
- "Previous" and "Next" arrow buttons on the left and right.
- Page number buttons in the center (e.g., 1 · 2 · 3 · … · 8).
- A small label: *"Showing 1–10 of 78 articles"*.

---

## 7. News Article Detail Page

### Section 1 — Article Header
Full-width section at the top of the page (not a separate hero image — the cover image serves this purpose).

- **Breadcrumb:** *"Home / News / [Article Title]"*
- **Category Badge:** Small pill (e.g., "Pastoral").
- **Title (H1):** The full article title, large and bold.
- **Subtitle:** The article subtitle in a larger, lighter-weight font.
- **Metadata row:** Author name (with small circular avatar if available), published date, and reading time estimate.
- **Social Share Icons:** Small icon buttons for sharing on Facebook, Twitter/X, and WhatsApp. A "Copy Link" button is also included.

---

### Section 2 — Cover Image
A large, full-width cover image below the header. Rounded corners on desktop. The image includes an optional caption below it in small italic text.

---

### Section 3 — Article Body
The main content area. The Markdown body is rendered as rich HTML using `react-markdown`.

**Rendered elements include:**
- **H2 and H3 headings** — used for article sub-sections, styled with the brand font and a left-border accent on H3.
- **Paragraphs** — comfortable line spacing (1.8), max reading width (approximately 65 characters per line), centered in the page.
- **Bold and italic text** for emphasis.
- **Unordered and ordered lists** with proper indentation.
- **Block quotes** — indented with a thick left-border in the brand accent color, used for scripture verses or key statements.
- **Inline links** — underlined, brand accent color.
- **Images embedded in the body** — full-width with caption support.

---

### Section 4 — Tags
Below the article body, a row of small tag chips (e.g., "#Kampala", "#Pastoral2025", "#Archbishop"). Clicking a tag routes to `/news?tag=tagname`.

---

### Section 5 — Related Articles
- **Heading:** *"You Might Also Like"*
- Three smaller news cards displayed in a row, automatically populated with articles from the same category.

---

### Section 6 — Navigation (Previous / Next Article)
A two-column row at the very bottom of the article. On the left: a link to the previous article (with its title). On the right: a link to the next article (with its title). Each has a left or right arrow icon.

---

## 8. Media Page

### Section 1 — Page Hero (Inner Banner)
- **Heading (H1):** *"Media Gallery"*
- **Subtitle:** *"Watch sermons, events, and community stories from the Kampala Archdiocese."*

---

### Section 2 — Category Filter
A row of pill buttons to filter videos by category (e.g., "All", "Sermons", "Events", "Community", "Testimonies").

---

### Section 3 — Featured Video
The most recently added or manually featured video is displayed prominently at the top.

- A large YouTube embed (using `lite-youtube-embed` for fast load) taking up most of the content width.
- To the right (on desktop): the video title (H2), a short description, and the date it was added.

---

### Section 4 — Video Grid
Below the featured video, all other videos are shown in a three-column grid.

Each **Video Card** contains:
- A thumbnail image with a play button overlay in the center (clicking loads the YouTube embed).
- The video **title** below the thumbnail (bold, up to two lines).
- A short **description** (muted, up to two lines).
- The video **category** as a small badge.
- The **date added**.

---

## 9. Contact Page

### Section 1 — Page Hero (Inner Banner)
- **Heading (H1):** *"Contact Us"*
- **Subtitle:** *"We're here to help. Reach out with any questions, prayer requests, or inquiries."*

---

### Section 2 — Two-Column Layout

**Left Column — Contact Form:**
A clean form with the following fields:
- **Full Name** — text input, required.
- **Email Address** — email input, required.
- **Phone Number** — tel input, optional.
- **Subject** — a select dropdown with options: *General Inquiry*, *Prayer Request*, *Parish Information*, *Event Information*, *Media Request*, *Other*.
- **Message** — a multi-line textarea (at least 5 rows), required.
- A **"Send Message"** submit button (full-width, brand color).
- Below the button: *"We typically respond within 1–2 business days."*

**Right Column — Contact Details:**
- **Heading:** *"Archdiocese Headquarters"*
- A location pin icon + full physical address.
- A phone icon + main phone number.
- An envelope icon + main email address.
- Office hours: *"Monday – Friday, 8:00 AM – 5:00 PM EAT"*
- An embedded Google Map showing the headquarters location.

---

---

# ADMIN DASHBOARD

---

## 10. Login Page

The login page is a standalone page — it does **not** show the admin sidebar or top bar. It is the only page on `admin.goodsamaritans.com` accessible without authentication.

**Layout:**
- A full-viewport-height page.
- Left half (desktop): A full-height background image related to the Archdiocese with a dark overlay. On top of the image: the Good Samaritans logo (white), a large quote or scripture verse, and a copyright notice at the bottom.
- Right half (desktop): A centered white card containing the login form. On mobile, only the form is shown with a plain light background.

**Login Form Card:**
- **Heading:** *"Admin Login"* (bold, large).
- **Subheading:** *"Good Samaritans — Content Management System"* (small, muted).
- **Email field:** Label *"Email Address"*, placeholder *"admin@goodsamaritans.com"*.
- **Password field:** Label *"Password"*, placeholder *"••••••••••••"*. A show/hide toggle icon inside the input on the right.
- **Error message area:** A red-background alert box that appears below the password field if login fails (e.g., *"Invalid email or password. Please try again."*). Hidden by default.
- **Sign In button:** Full-width, solid brand-color button. During the API call, the button text changes to *"Signing in…"* and is disabled with a loading spinner inside it.
- **Forgot password link:** Small text link below the button — *"Forgot your password?"* — that triggers a password reset email via Supabase Auth.

**Security note:**
- There is no *"Sign Up"* link or registration option. Admin accounts are created only by invitation from within the Supabase dashboard.

---

## 11. Global Admin Elements — Sidebar & Top Bar

### Sidebar
The sidebar is a fixed, full-height vertical column on the left side of every admin page after login. It has a dark background (dark navy or charcoal).

**Top Section — Brand:**
- The Good Samaritans logo in white.
- Below it: the logged-in user's **role** displayed in a small colored badge (e.g., "Super Admin" in gold, "Editor" in gray).

**Navigation Section:**
A vertical list of navigation items, each with an icon on the left and a label on the right. The currently active item has a filled/highlighted background.

| Icon | Label | Route |
|---|---|---|
| Grid icon | Dashboard | `/dashboard` |
| Newspaper icon | News | `/news` |
| Users icon | Leadership | `/leadership` |
| Map pin icon | Ministries | `/ministries` |
| Video camera icon | Media | `/media` |
| Sliders icon | Page Content | `/content` |

**Bottom Section — User:**
- The logged-in user's **email address** in small, muted text.
- A **Sign Out** button (with a logout icon on the left). Clicking it immediately signs the user out and redirects to the login page.

---

### Top Bar
A horizontal bar spanning the top of the main content area (not including the sidebar).

**Left side:**
- A **hamburger/menu icon** that collapses or expands the sidebar on desktop, and opens a slide-in drawer on mobile.
- A **dynamic page title** that updates based on the current admin page (e.g., *"News Articles"*, *"Edit Article"*, *"Ministries"*).
- An optional **breadcrumb** below the title for deep pages (e.g., *"News / Edit Article / Advent Pastoral Letter"*).

**Right side:**
- A **notification bell icon** (future-ready placeholder — can show a badge count later).
- The logged-in user's **name** (e.g., *"Fr. John Ssali"*) and **circular avatar/initials** (first letter of their name).
- Clicking the avatar opens a small dropdown with: *"My Profile"* and *"Sign Out"*.

---

## 12. Dashboard Overview Page

The dashboard is the first page an admin sees after logging in. It provides a snapshot of the site's content at a glance.

### Section 1 — Welcome Banner
- **Heading:** *"Good morning, [First Name]."* (Time of day is dynamic.)
- **Subheading:** *"Here's what's happening on the Good Samaritans platform today."*

---

### Section 2 — Stats Cards
Four metric cards in a row (two rows of two on mobile).

Each card contains:
- A **colored icon** in the top-right corner (e.g., newspaper icon for articles, map pin for parishes).
- A **large bold number** in the center (the metric value).
- A **label** below the number describing what it counts.
- A small **trend indicator** at the bottom (e.g., *"+3 this month"* in green, or *"No change"* in gray).

| Card | Metric | Example |
|---|---|---|
| 1 | Total Published Articles | 42 |
| 2 | Draft Articles | 7 |
| 3 | Total Parishes | 153 |
| 4 | Total Leaders | 28 |

---

### Section 3 — Recent Activity
A vertical timeline list of the five most recent changes made by any admin.

Each activity item contains:
- A small circular icon indicating the type of action (e.g., a pencil for edit, a plus for create, a trash icon for delete) with a colored background.
- **Action text** (e.g., *"New article published: 'Advent Pastoral Letter 2025'"*).
- **Who did it** (e.g., *"by Fr. John Ssali"*) and **when** (e.g., *"2 hours ago"*).

---

### Section 4 — Quick Actions
A row of shortcut buttons to the most common admin tasks:

- **"+ New Article"** → routes to `/news/new`
- **"+ Add Leader"** → opens the Add Leader modal on `/leadership`
- **"+ Add Parish"** → opens the Add Parish modal on `/ministries`
- **"Edit Home Page"** → routes to `/content`

---

### Section 5 — Draft Articles Reminder
A small alert box (yellow/amber background) that appears only if there are unpublished draft articles.

- **Text:** *"You have 7 draft articles awaiting review. Publish them when ready."*
- A **"Review Drafts"** link inside the alert that routes to the news list filtered to drafts.

---

## 13. News Management — Article List

### Section 1 — Page Header
- **Title:** *"News Articles"*
- **Right side:** A green **"+ New Article"** button that routes to `/news/new`.

---

### Section 2 — Filter & Search Bar
A horizontal bar with three controls:
- **Status Filter:** A segmented control or tabs — *"All"*, *"Published"*, *"Draft"*.
- **Category Filter:** A dropdown selector for filtering by category.
- **Search Input:** A text input that filters the table rows in real time as the admin types.

---

### Section 3 — Articles Data Table
A full-width data table listing all articles (both published and drafts).

**Columns:**

| Column | Description |
|---|---|
| **Cover** | A small 60×40px thumbnail of the article's cover image. |
| **Title** | The article title in bold. The subtitle appears below it in smaller muted text. |
| **Category** | A small pill/badge with the article's category. |
| **Status** | A colored badge — green *"Published"* or yellow *"Draft"*. |
| **Published Date** | The date the article was published, or *"—"* if still a draft. |
| **Actions** | Three icon buttons: a pencil (edit), an eye (preview on frontend), and a trash can (delete). |

**Table Behavior:**
- Clicking anywhere on a row (outside the action buttons) opens the edit page for that article.
- The trash icon triggers a **confirmation modal** before deleting: *"Are you sure you want to delete '[Article Title]'? This action cannot be undone."* with *"Cancel"* and *"Delete"* buttons.
- The table shows 10 rows per page by default. A pagination control is at the bottom.
- Column headers for Title, Status, and Published Date are clickable to sort the table.

---

## 14. News Management — Create / Edit Article

This is the richest admin page. It is a full-width editor layout.

### Section 1 — Page Header
- **Title:** *"New Article"* (or *"Edit Article"* when editing an existing one).
- **Right side:** Two buttons:
  - **"Save as Draft"** — saves without publishing, with a floppy disk icon.
  - **"Publish"** — saves and sets `is_published = true`, with a send/upload icon. A dropdown arrow on this button also offers *"Schedule for later"* (future feature).

---

### Section 2 — Two-Panel Editor Layout

**Main Content Area (left, ~65% width):**

- **Title Field:** A large, borderless text input styled to look like an H1 heading. Placeholder: *"Article title…"*. The font is large (32–36px) and bold.
- **Subtitle Field:** A slightly smaller borderless input below the title. Placeholder: *"Subtitle or brief summary…"*
- **Markdown Editor:** The main body editor (`@uiw/react-md-editor`). It has two modes togglable via tabs:
  - **Write tab:** A plain Markdown text area with syntax highlighting. A toolbar at the top offers formatting shortcuts: Bold, Italic, Heading, Quote, Code, Link, Image, Ordered List, Unordered List, Horizontal Rule.
  - **Preview tab:** A live-rendered preview of the Markdown exactly as it will appear on the public site.
  - **Split tab:** Side-by-side write and preview panels.

**Sidebar (right, ~35% width):**

A vertical stack of settings panels, each collapsible:

- **Status Panel:**
  - Current status badge (Draft or Published).
  - A toggle switch labeled *"Published"* — flipping it to ON publishes immediately.
  - Published date (auto-set) and a *"Change date"* link (future feature).

- **Cover Image Panel:**
  - A dashed-border drag-and-drop upload zone.
  - *"Drag an image here, or click to browse"* text in the center.
  - Once an image is uploaded, it is shown as a preview thumbnail with an X button to remove it.
  - Below: a text input for pasting an external image URL as an alternative.

- **Category Panel:**
  - A dropdown selector for the article's category.
  - An *"+ Add category"* link for typing a new custom category.

- **Tags Panel:**
  - A tag input where the admin types a tag and presses Enter to add it.
  - Added tags appear as small removable chips above the input.

- **SEO Preview Panel:**
  - A non-editable preview box showing how the article will appear in Google Search results — headline in blue, URL in green, description excerpt in gray.
  - Below: a read-only field showing the auto-generated URL slug (e.g., `goodsamaritans.com/news/advent-pastoral-letter-2025`), with a copy icon.

---

## 15. Leadership Management Page

### Section 1 — Page Header
- **Title:** *"Leadership"*
- **Right side:** A green **"+ Add Leader"** button that opens the Add Leader modal.

---

### Section 2 — Filter Bar
- **Filter by Level:** A row of tabs — *"All"*, *"Archdiocese"*, *"Vicariate"*, *"Deanery"*, *"Parish"*.
- **Search Input:** Filter leaders by name.

---

### Section 3 — Leaders Data Table
A table listing all leaders.

**Columns:**

| Column | Description |
|---|---|
| **Photo** | A small circular profile photo thumbnail (40×40px). A gray silhouette placeholder is shown if no image has been uploaded. |
| **Name** | The leader's full name in bold. |
| **Title** | Their role/title (e.g., *"Archbishop of Kampala"*). |
| **Assigned To** | The name of the entity they lead (e.g., *"Archdiocese"*, *"Kampala East Vicariate"*, *"St. Mary's Parish"*). |
| **Level** | A colored badge — different color for each level: gold for Archdiocese, purple for Vicariate, blue for Deanery, green for Parish. |
| **Order** | A drag handle icon on the far left of the row. Rows can be dragged up and down to reorder leaders within their level. The new order is saved automatically. |
| **Actions** | Edit (pencil icon) and Delete (trash icon). |

---

### Section 4 — Add / Edit Leader Modal
A full-overlay modal (not a new page) that slides in from the right or appears centered.

**Modal Title:** *"Add New Leader"* or *"Edit Leader"*

**Form Fields:**
- **Full Name** — text input, required.
- **Title / Role** — text input (e.g., *"Archbishop"*, *"Parish Priest"*), required.
- **Bio** — a multi-line textarea for the leader's biography.
- **Profile Photo** — a drag-and-drop upload zone that uploads to the `leader-avatars` Supabase Storage bucket. Shows a circular preview of the uploaded image.
- **Level** — a dropdown: *"Archdiocese"*, *"Vicariate"*, *"Deanery"*, *"Parish"*.
- **Assigned Entity** — a second dropdown that updates based on the Level selection. If *"Vicariate"* is selected, it lists all Vicariates. If *"Parish"* is selected, it lists all Parishes. This field is hidden if *"Archdiocese"* is selected.
- **Display Order** — a number input for controlling the sort order.

**Modal Footer Buttons:**
- **"Cancel"** — closes the modal with no changes.
- **"Save Leader"** — submits the form, closes the modal, and updates the table.

---

## 16. Ministries Management Page

### Section 1 — Page Header
- **Title:** *"Ministries & Parishes"*
- **Right side:** Three buttons — **"+ Add Vicariate"**, **"+ Add Deanery"**, **"+ Add Parish"** — each opens a respective modal.

---

### Section 2 — Hierarchy Tree Table
An interactive, collapsible tree table showing the full organizational hierarchy.

**Top Level — Vicariate rows:**
- Each Vicariate is a full-width row with a bold name, a toggle arrow on the left to expand/collapse, and action icons (edit, delete) on the right.
- A small badge shows the number of Deaneries and Parishes within it (e.g., *"6 Deaneries · 38 Parishes"*).

**Second Level — Deanery rows (indented):**
- Visible when the parent Vicariate is expanded.
- Shows the Deanery name, its Vicariate, a badge with its parish count, and edit/delete actions.

**Third Level — Parish rows (further indented):**
- Visible when the parent Deanery is expanded.
- Shows the parish name, physical address, and whether GPS coordinates have been set (a green checkmark or a gray dash).
- Edit and delete icons on the right.
- Clicking the edit icon opens the Edit Parish modal.

---

### Section 3 — Add / Edit Parish Modal

**Form Fields:**
- **Parish Name** — text input, required.
- **Parent Deanery** — dropdown to select which Deanery this parish belongs to, required.
- **Physical Address** — textarea.
- **Mass Times** — a text area for free-form mass schedule text (e.g., *"Sunday 8am, 10am, 12pm · Weekdays 6:30am"*).
- **Phone Number** — tel input.
- **Email Address** — email input.
- **GPS Coordinates:**
  - Two side-by-side inputs: *"Latitude"* and *"Longitude"*.
  - A small note: *"You can find coordinates by right-clicking a location on Google Maps."*
  - A **"Preview on Map"** button that opens a small inline map preview with a pin at the entered coordinates.

---

## 17. Media Management Page

### Section 1 — Page Header
- **Title:** *"Media Videos"*
- **Right side:** A green **"+ Add Video"** button that opens the Add Video modal.

---

### Section 2 — Video Grid
A grid of video cards (three columns on desktop).

Each **Admin Video Card** contains:
- YouTube thumbnail image.
- Video **title** in bold.
- **Category** badge.
- A toggle switch labeled *"Published"* — the admin can instantly hide or show a video on the public site.
- Edit (pencil) and Delete (trash) icon buttons.
- A drag handle on the top-left corner — the admin can drag cards to reorder them. The sort order is saved.

---

### Section 3 — Add / Edit Video Modal

**Form Fields:**
- **Video Title** — text input, required.
- **YouTube Video ID** — text input (the short code from the YouTube URL, e.g., `dQw4w9WgXcQ`), required.
  - A note: *"This is the part of the YouTube URL after `?v=`"*.
  - A **"Preview"** button that shows a small thumbnail preview next to the input once a valid ID is entered.
- **Description** — textarea.
- **Category** — dropdown (Sermons, Events, Community, Testimonies, General).
- **Published** — a toggle switch, on by default.

---

## 18. Page Content Editor

This page allows the admin to edit the dynamic text content that appears on the public site without touching any code.

### Section 1 — Page Header
- **Title:** *"Page Content"*
- **Subtitle:** *"Edit the text that appears on the public-facing website. Changes are reflected immediately after saving."*

---

### Section 2 — Page Tabs
A row of tabs, one per editable page:
- **Home** · **About** · **Contact**

The selected tab determines which set of content fields are shown below.

---

### Section 3 — Content Fields (Home Tab)
Each content field is displayed as a labeled form row.

**Hero Section:**
- **Hero Title** — text input. Current value shown. Label: *"The large heading on the homepage hero banner."*
- **Hero Subtitle** — text input. Label: *"The supporting sentence beneath the title."*
- **Hero CTA Button Text** — text input. Label: *"The text on the primary call-to-action button."*

**Mission Section:**
- **Mission Title** — text input.
- **Mission Body** — a multi-line textarea. Label: *"The paragraph(s) describing the Archdiocese's mission."*

**Stats Section:**
- Four rows (one per stat): a **Label** text input and a **Value** text input side by side.
  - e.g., Label: *"Vicariates"* · Value: *"4"*
  - e.g., Label: *"Parishes"* · Value: *"150+"*

---

### Section 4 — Save Controls
At the bottom of each tab:
- A **"Save Changes"** button (brand color, full-width or right-aligned).
- A **"Revert"** text link that resets the form fields to their last-saved values.
- After saving, a green **toast notification** appears at the top-right corner: *"Page content updated successfully."*

---

*Good Samaritans Platform — Page Content Descriptions v1.0*
*Last updated: May 2026*
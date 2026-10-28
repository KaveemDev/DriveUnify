# DriveUnify landing page: build prompt

Copy everything below the line into your AI coding tool (Claude Code, Cursor, v0, etc.).

---

## Role

You are a senior design engineer who builds award-level marketing sites (think Linear, Vercel, Raycast, Arc, Stripe). Every section must have a reason to move. Motion explains the product; it is not decoration. Build a landing page that feels like a product demo you scroll through, not a template with fade-ins.

## Product

**DriveUnify**: one dashboard for all your cloud storage. Connect multiple Google Drive accounts and Dropbox (OneDrive coming soon), and browse, search, upload, preview and move files across all of them in one place.

Real features (use these; do not invent others):

| Feature | What it actually does |
|---|---|
| Multi-account | Connect unlimited Google Drive accounts plus Dropbox, side by side |
| Unified explorer | Every file from every account in one grid or list view, with folder navigation and breadcrumbs |
| Cross-drive transfer | Move or copy a file or folder from one account to another (source → target, pick root or a subfolder) |
| Global search & sort | Real-time search across all accounts; sort by name, date, size, type |
| Command palette | ⌘K to upload, create a folder, connect a drive, switch grid/list |
| Upload | Drag and drop or pick files; resumable chunked uploads for files over 5 MB, up to 5 GB |
| Preview | Images, video, PDFs and Google Docs open in a preview without leaving the app |
| File actions | Rename, delete, star, share, copy link, open in Drive |
| Storage insight | Per-account and combined storage bars, analytics on what fills your space |
| Quick views | Starred, Shared with me, Trash |
| Fast | Virtualized lists handle 10,000+ files smoothly |
| Offline aware | Banner when offline, resyncs when you're back |
| Private | Sign in with Google via Firebase; files stay in your own drives; users only see their own data |

Primary CTA: **"Open dashboard"** / **"Connect your drives free"** (links to the dashboard app). Secondary: **"See how it works"** (scrolls to the demo section).

## Stack (already in the project, do not add a framework)

- Next.js 16 App Router (`landing/src/app`), React 19, JavaScript (no TypeScript)
- Tailwind CSS v4
- `framer-motion` for all animation (`useScroll`, `useTransform`, `useSpring`, `motion`, `AnimatePresence`, `layout`, `whileInView`)
- `lucide-react` for icons
- Existing components to reuse: `components/ui/AnimatedButton`, `GlassCard`, `GradientText`, `SectionHeading`, `components/layout/Navbar`, `Footer`, `ClientLayout`
- Optional single addition: `lenis` for smooth scrolling. Nothing else.

## Visual direction

- Dark first. Background `#020617` (slate-950) with surfaces `#0f172a` / `#1e293b`, hairline borders `rgba(255,255,255,0.06)`.
- One accent: blue `#3b82f6` (hover `#60a5fa`, glow `rgba(59,130,246,0.35)`). Provider colors only where a provider appears: Google Drive (its 4-color mark), Dropbox `#0061FF`.
- Typography: Inter (or Geist) for UI, a tight display setting for headlines: `font-weight: 600`, `letter-spacing: -0.04em`, `line-height: 1.0`. Hero headline 72–96px desktop, 44px mobile. Body 17px, `text-slate-400`.
- Use real UI, not illustrations: every product visual is a recreated, live piece of the DriveUnify dashboard in HTML/CSS (sidebar with accounts, file grid, storage bars, command palette), with real-looking file names (`Q3-report.pdf`, `wedding-photos/`, `thesis-final-v7.docx`).
- Depth from layering, light and blur, not from drop shadows everywhere.
- Grain: one subtle SVG noise overlay at 3–4% opacity over the whole page.

## Hard bans (this is what makes it look AI-generated)

- No purple-to-pink gradients, no rainbow gradient text, no "gradient blob" backgrounds.
- No generic 3×3 icon-card feature grids where every card is identical.
- No emoji in headings, no "🚀 Supercharge your workflow".
- No stock phrases: "seamless", "revolutionize", "unlock", "elevate", "game-changer", "in today's fast-paced world".
- No fake testimonials, fake logos, fake user counts or fake stats. If there is no data, leave the section out.
- No element that just fades up 20px as its only animation, repeated for every section.
- No centered-everything layout. Mix left-aligned editorial blocks, asymmetric splits and full-bleed moments.
- No glassmorphism on everything. Glass is for one or two floating UI layers only.

## Motion system (define once, use everywhere)

Create `landing/src/lib/motion.js` with shared values:

- Easing: `ease = [0.22, 1, 0.36, 1]` (expo-out) for entrances; springs `{ stiffness: 300, damping: 30 }` for interactive things, `{ stiffness: 100, damping: 20, mass: 0.5 }` for scroll-smoothed values.
- Durations: micro 150ms, UI 300ms, section entrances 700–900ms. Nothing slower than 1.2s.
- Stagger children 60–80ms.
- Animate only `transform`, `opacity`, `filter` and `clip-path`. Never animate `width`, `height`, `top`, `left`.
- All scroll-linked values go through `useSpring` so they feel weighted, not jittery.
- `prefers-reduced-motion`: disable parallax, pinning and scrubbing; keep instant opacity changes only. Use framer-motion's `useReducedMotion`.
- Mobile (< 768px): replace pinned/scrubbed sequences with simple stacked reveals; keep it 60fps on a mid-range phone.

## Page structure and choreography

### 0. Page load (first 1.2s)
- Navbar slides down from `y: -20` with opacity.
- Hero headline reveals word by word: each word in an `overflow: hidden` mask, sliding up from `y: 100%`, 60ms stagger.
- Subheadline and CTAs follow 200ms after the last word.
- Hero product mock assembles: the dashboard frame scales from `0.96` to `1` and un-blurs from `blur(12px)`; then the three account rows in its sidebar pop in one by one.

### 1. Navbar
- Transparent at top; after 40px of scroll it shrinks in height, gains a `backdrop-blur` and border, and becomes a floating pill with margin from the edges (animate with `layout`).
- Hides on scroll down, reappears on scroll up.
- Links: Features, How it works, Integrations, Docs. A thin underline that slides between hovered links using `layoutId`.
- Thin blue scroll-progress bar at the very top (`scaleX` bound to `scrollYProgress`).

### 2. Hero: "Every drive. One place."
- Left-aligned headline, e.g. **"All your drives. One window."** Subhead: "Connect every Google Drive and Dropbox account you own, then search, preview and move files between them without switching tabs."
- Right/below: the live dashboard mock in a tilted 3D frame (`perspective: 1200px`, `rotateX: 12deg`).
- On scroll through the hero (first 100vh): the frame rotates to flat (`rotateX 12 → 0`), scales up to near full width, and the headline moves up and fades with parallax at 0.5× speed. This handoff makes the mock become the stage for the next section.
- Mouse: the mock tilts slightly toward the cursor (±4deg, springy). Off on touch devices.
- Background: a single soft blue radial light behind the mock that follows scroll position, plus a faint dot grid that fades out at the edges with a mask.

### 3. The problem: "Five tabs. Three logins. Zero idea where that file is."
- Pinned section (height 250vh, inner `position: sticky`).
- Starts with 4–5 separate browser windows (Drive account 1, Drive account 2, Dropbox, …) scattered and overlapping, each with a different account avatar.
- As you scroll, the windows slide in, line up, then collapse into one DriveUnify window: their file lists merge into a single grid. Use one `scrollYProgress` mapped to each window's `x`, `y`, `rotate`, `scale`.
- Copy changes in three steps on the left, crossfading with a vertical mask: problem → "Connect them once" → "Now it's one drive".

### 4. Connect accounts (how it works, 3 steps)
- Horizontal scroll section on desktop: vertical scroll drives `x` of a track of 3 large panels (pinned, 300vh).
  1. **Sign in with Google**: a mocked sign-in button that presses itself when the panel centers.
  2. **Connect your drives**: provider tiles (Google Drive, Dropbox, OneDrive "soon") that flip from "Connect" to a green "✓ Connected" check with a spring.
  3. **Everything appears**: storage bars for each account fill to their value, then a combined bar sums them.
- Large step numbers (01, 02, 03) in outlined type that fill with color as their panel becomes active.
- On mobile: vertical stack, each panel animates when 40% in view.

### 5. Feature showcase (sticky split, not a card grid)
- Left column scrolls: one feature block per viewport height with a short headline and two lines of copy.
- Right column is a sticky product mock that **changes state** to match the active feature (use `AnimatePresence` with `mode="wait"`, or `layoutId` for shared elements so pieces morph instead of swapping):
  - **Global search**: text types itself into the search bar; results from different accounts filter in, each tagged with its account color.
  - **Command palette (⌘K)**: palette drops in with a spring; the highlighted row moves down the actions list.
  - **Cross-drive transfer**: a file card lifts out of "Work Drive" and travels along a curved SVG path (`pathLength` animated) into "Personal Dropbox"; a progress ring completes.
  - **Upload**: a file is dragged onto the drop zone; the zone glows; a chunked progress bar fills in segments (it's resumable).
  - **Preview**: a file card expands into a full preview modal using a shared `layoutId`.
- Active feature indicator: a vertical progress line on the left that fills as you scroll through features.

### 6. Speed: "10,000 files. No lag."
- Full-bleed section. A file list scrolls at high speed inside a frame (infinite CSS transform loop) while a counter ticks from 0 to 10,000 when in view (`useMotionValue` + `animate`).
- One line about virtualization in plain words: "We only render what's on screen, so huge drives stay instant."

### 7. Bento of the smaller things
- Asymmetric bento grid (not equal cards): Storage insight (large), Starred / Shared / Trash quick views, Offline banner, Rename & share actions, Grid ⇄ List toggle.
- Each tile has its own micro-interaction on hover: the grid/list tile morphs its layout with `layout`; the offline tile shows the banner sliding down and resolving to "Back online"; the storage tile's donut redraws.
- Cursor spotlight: a radial gradient follows the mouse inside each tile's border (CSS vars `--x`, `--y`).
- Tiles enter with a staggered clip-path reveal (`inset(100% 0 0 0)` → `inset(0)`).

### 8. Integrations
- A center DriveUnify logo with provider logos orbiting on a slow ring; connecting lines draw in (`pathLength 0 → 1`) as the section enters. Dropbox and Google Drive are "Live", OneDrive is "Coming soon" with a dimmed state.

### 9. Privacy: "Your files never touch our servers."
- Calm section after all the motion: plenty of whitespace, slower reveal.
- Three plain facts: Google sign-in via Firebase; files stay in your own Drive/Dropbox; Firestore rules mean only you can see your account data.
- A lock icon whose shackle closes when the section is in view.

### 10. Final CTA
- Huge headline that scales from 0.9 to 1 and its letter-spacing tightens as it enters.
- Primary button is magnetic (follows cursor within 60px, springs back) with a light sweep on hover.
- Background: the hero's blue light returns, closing the loop.

### 11. Footer
- Large outlined "DriveUnify" wordmark that fills in left to right as you reach the bottom.
- Links to existing routes: about, blog, contact, docs, features, help, integrations, legal.

## Micro-interactions (apply globally)

- Buttons: `whileHover` scale 1.02, `whileTap` scale 0.97, 150ms; a subtle inner highlight moves with the cursor.
- Links: underline grows from left on hover, retracts to the right on leave.
- Custom cursor is **not** wanted; keep the native cursor.
- Focus states visible on every interactive element (blue 2px ring with offset).
- Section headings: split into lines; each line reveals from a mask when 30% in view (`once: true`).

## Performance and quality bar

- Lighthouse performance ≥ 90 on mobile; no layout shift from animations (reserve space for every animated element).
- `will-change: transform` only on elements that are currently animating.
- Lazy-mount heavy sections (`whileInView` / `IntersectionObserver`), and pause infinite loops when off-screen.
- All mocks are HTML/CSS, not images, so they stay crisp and themeable.
- Semantic HTML: one `h1`, sections with `aria-labelledby`, decorative motion `aria-hidden`.
- Works at 375px, 768px, 1280px and 1920px. No horizontal scroll on mobile.

## Deliverables

1. `src/lib/motion.js` with shared easings, springs and variants.
2. One component per section in `src/components/sections/` (Hero, Problem, HowItWorks, FeatureShowcase, Speed, Bento, Integrations, Privacy, FinalCTA).
3. Reusable mock pieces in `src/components/mocks/` (DashboardFrame, Sidebar, FileGrid, CommandPalette, StorageBar, TransferAnimation).
4. `src/app/page.js` composing the sections; update `Navbar` and `Footer` as described.
5. Build one section at a time. After each one, run `npm run dev`, check it at desktop and 375px width, and confirm it holds 60fps before moving on.

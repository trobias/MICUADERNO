# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Plain HTML + CSS + classic (non-module) JavaScript, no framework and no build step, so the same folder opens by double-click (`file://`) and also works as an installable PWA when served over HTTPS (e.g. GitHub Pages). Chosen by the brief ("HTML + CSS + JavaScript standalone", "sin npm para la persona que lo recibe") and confirmed by the user ("Ambas": doble clic + web instalable). Dev-only tooling (tests, icon generation) uses Node and lives outside the shipped files.

## Users

Anyone who wants a personal notebook (the user chose "para cualquiera"): copy stays gender-neutral; the feminine personality lives in the visual language, not in grammatical gender. Situations: a rushed morning (log how the day started in two taps), mid-day (mark an activity), a quiet night (close the day), Sundays (plan the week, routines), month/year end (look back, export, print), hard days (write without being judged), coming back after days away (no guilt).

## Product Purpose

MI CUADERNO is a private digital notebook — diary, planner, free-text emotions, routines and scrapbook in one object — that currently lives entirely on the person's device. Success: opening it feels like opening a beautiful paper notebook; logging something takes under a minute; over months it gives the person back their own story (calendar, year map, memories, exports). The approved A→B→C migration in `MIGRATION_PLAN.md` adds an account/PIN, section permissions and cloud sync in B; those are not current capabilities.

## Positioning

A journal that never punishes: activity states are human ("lo hice", "hice un poquito", "lo dejo para otro día", "hoy no salió"), there are no streaks to lose, insights only count and never conclude. The current local app sends no content away; B must explain cloud storage and guest access honestly before turning either on.

## Operating Context

Daily ritual on phone and computer; installed as an app or opened from a folder. Offline always. Rioplatense Spanish (vos). Exports: JSON backup/restore, TXT, CSV, XLSX, and a printable notebook (A4/A5/Letter).

## Capabilities and Constraints

- Storage: IndexedDB for all personal data; localStorage only for light UI prefs.
- No backend, login, cloud, analytics. Notifications are local only (no remote push without a server).
- Service workers don't run on `file://`; the double-click folder works without SW, the hosted copy is the installable PWA.
- Not clinical: no diagnosis, no causal health claims, no pathologizing.

## Brand Commitments

- Name: MI CUADERNO. Tagline: "un lugarcito para mí ♡".
- Starting palette (from brief, adjustable): cream paper #FFF9ED, butter #F6D978, soft pink #F4B9C6, old rose #D98FA1, peach #F4C3A2, sage #B9CBA7, lavender #C9B8DE, ink #493D3B, soft ink #796966.
- Personality: delicate, cozy, intimate, calm, slightly nostalgic, handmade; not childish, not over-kawaii, not saturated.
- The notebook is the central object: pages, tabs, ribbons, stickers, tape. Butterfly as the recurring symbol.
- Calm motion, occasional ambient scenes, no sound by default.

## Evidence on Hand

No real user content. All sample data in tests is synthetic. No testimonials or claims to show.

## Product Principles

D59 extends My Year with a month-grouped paper album, personal victories, chosen memories with source images, finished creations and the first saved drawing of the year. Special activities are classified once and produce a moment only when done or partial; first-time events use the first recorded occurrence. Rest, boundaries, help, courage, care and enjoyment are chosen by the person, never inferred from their writing or emotions. One contextual editor preserves references, optional words, source privacy and existing year parts. Individual activity bars are 16px tall. Backup v12 is additive; IndexedDB stays at 5, shell cache at v53, with no new dependencies or services.

Since D55, the weekly planner includes automatic activity checklists, fixed weekdays and flexible weekly targets, optional duration notes, and descriptive daily/weekly counts. D56 places progress inside the Important note, with a visible weekly bar per activity and five editable initial activities. Pencil controls open the existing editor; scheduling stays in a closed disclosure. Initial activities are installed once, never reappear after deletion, and never overwrite existing equivalents. Progress measures completed scheduled opportunities; it never ranks people or emotions. Closed weeks retain their plan and dated records. The notebook remains classic JavaScript (D42).

D57 groups weekly bars by activity name: three Trabajar opportunities show one 0/3 bar. Both calendars hide only unmarked activities, in past, present and future dates; all other states remain visible, including skipped and postponed. Unmarked checkboxes remain preloaded on the day page and still count toward the weekly target. Grouping and visibility are derived; original records, rules and history stay intact.

1. The notebook is the interface: every surface is paper, tab, sticker or ink.
   D58 renames the weekly note to Progreso. A partial activity counts as one recorded occurrence and half a yellow fill; full completion adds a green fill. Reaching every occurrence earns the existing small-victory star, including 3/3 partials at 50%. Weekly victories in the year are derived from records and plans, respect privacy, and do not create duplicate saved marks. A short existing SVG/motion effect uses project tokens and honors reduced motion.
2. Kind always: no failure language, no guilt mechanics.
3. Log in under a minute; everything is optional.
4. Visual silence by default; motion is rare and purposeful.
5. The data belongs to the person: local, exportable, restorable.

## Accessibility & Inclusion

WCAG 2.2 AA; full keyboard operation (including sticker placement); reduced-motion honored plus an in-app motion setting (Completas / Suaves / Reducidas / Ninguna); low-distraction design (no claims about treating ADHD).

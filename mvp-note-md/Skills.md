可以，下面就是可直接放进仓库的内容。

路径：  
`.agents/skills/frontend-demo-guardrails/SKILL.md`

````md
---
name: frontend-demo-guardrails
description: Guardrails for working on the ibf-demo iPhone Safari iButterfly-like frontend demo. Use this skill when modifying the static frontend, permissions flow, motion capture flow, geolocation, geofence test logic, result page UX, or related README updates.
---

# frontend-demo-guardrails

## Purpose
This skill defines the working boundaries for Codex when editing the **ibf-demo** repository.

This project is a **lightweight static frontend demo** intended to validate an **iButterfly-like experience loop on iPhone Safari**:

- camera preview
- motion-based or swipe-based capture
- success / fail feedback
- later: geolocation and a simple geofence

This is **not** a full product, **not** a heavy AR project, and **not** a backend system.

Use this skill whenever the task involves frontend behavior, UX flow, iPhone Safari compatibility, demo stability, or small structural improvements within the current static project.

---

## When to use this skill
Use this skill if the task includes any of the following:

- editing `index.html`
- editing `styles.css`
- editing `app.js`
- improving camera permission flow
- improving motion / orientation permission flow
- adding geolocation support
- adding a simple geofence test
- improving mobile Safari behavior
- improving result page UX
- improving error messages or fallback behavior
- updating `README.md` to reflect frontend changes
- making small safe refactors in the static demo

---

## When NOT to use this skill
Do **not** use this skill for tasks that primarily involve:

- backend development
- database design
- merchant systems
- auth systems beyond minimal demo needs
- complex build tooling
- introducing a framework rewrite
- turning the demo into a large-scale product architecture
- defining product strategy or business model
- heavy AR / VPS / SLAM work
- multi-platform expansion planning

If a task asks for these, do not force this skill. Use a more appropriate workflow or wait for a dedicated skill.

---

## Project reality
This repository is a **small static demo** intended to run on **iPhone Safari**.

Current expected structure is simple:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- lightweight project docs such as `PROJECT.md` and `TASKS.md`

The project should remain easy to deploy as plain static files on:

- GitHub Pages
- Netlify
- Vercel
- other HTTPS static hosting

---

## Primary goals
Protect the project from drifting into unnecessary complexity.

The main goals are:

1. keep the demo runnable
2. keep the permission flow understandable
3. keep the capture loop intact
4. keep the code readable
5. keep the architecture lightweight
6. support iPhone Safari first
7. support incremental progress toward geolocation and geofence testing

---

## Non-goals
The following are explicit non-goals unless the user clearly changes scope:

- no heavy AR stack
- no native AR anchoring
- no backend
- no account system
- no complex admin tooling
- no merchant dashboard
- no large animation framework
- no React/Vue/Next rewrite
- no bundler migration unless explicitly requested
- no multi-page app redesign unless required by the task
- no large CSS architecture rewrite without need
- no speculative product expansion

---

## Core development principles

### 1. Prefer small diffs
Make the smallest effective change that solves the task.

### 2. Preserve the current loop
Do not break the current experience loop:

- open page
- request permissions
- show camera / interaction state
- capture attempt
- success / fail feedback
- result display

### 3. Respect the static architecture
Prefer plain HTML, CSS, and JavaScript.

Do not introduce:
- React
- Vue
- TypeScript
- build tools
- package managers
- bundlers
unless explicitly requested by the user.

### 4. Optimize for iPhone Safari
Assume iPhone Safari is the primary runtime target.

Be careful about:
- permission timing
- motion permission requiring user gesture
- camera permission flow
- autoplay / media restrictions
- mobile viewport layout
- touch interactions
- safe areas
- secure context assumptions

### 5. Use relative asset paths
Because this project is deployed to GitHub Pages under a repository path, avoid root-absolute asset references like:

```html id="yychiy"
<script src="/app.js"></script>
<link rel="stylesheet" href="/styles.css">
````

Prefer relative references like:

```html
<script src="app.js"></script>
<link rel="stylesheet" href="styles.css">
```

### 6. Fail clearly

If permissions fail, geolocation fails, or browser support is missing, expose clear user-facing messages and do not leave the UI in a broken ambiguous state.

### 7. Keep visual changes lightweight

UI improvements are welcome, but should remain lightweight and maintainable.

---

## File-specific guidance

## `index.html`

Use this file for:

- semantic structure
    
- UI containers
    
- buttons
    
- permission prompts
    
- debug panels
    
- result panels
    

Avoid:

- stuffing excessive inline logic here
    
- duplicating large behavior that belongs in `app.js`
    

## `styles.css`

Use this file for:

- layout
    
- mobile responsiveness
    
- result state styling
    
- visual hierarchy
    
- permission/error panel clarity
    

Avoid:

- overengineering CSS architecture
    
- adding very large style systems
    
- adding unnecessary animation complexity
    

## `app.js`

Use this file for:

- permission flow
    
- camera setup
    
- motion handling
    
- swipe / shake logic
    
- geolocation support
    
- geofence checks
    
- state transitions
    
- result rendering behavior
    

Avoid:

- rewriting the entire file unless necessary
    
- introducing abstractions that are bigger than the repo needs
    
- creating a mini framework inside the file
    

## `README.md`

Update when behavior changes in a way a human tester needs to know.

Add or update:

- what the demo does
    
- how to run it
    
- why HTTPS is needed
    
- Safari-specific permission notes
    
- what changed in testing instructions
    

---

## Preferred task types

### Good task examples

- Fix iPhone Safari permission sequence for camera and motion
    
- Add geolocation permission flow and debug display
    
- Add a simple single-point geofence test
    
- Improve result card styling for success vs fail
    
- Add better error messaging for unsupported browser states
    
- Refactor app.js slightly to make state handling clearer
    
- Update README to match current behavior
    

### Bad task examples

- Rebuild the project in React
    
- Add a backend and user accounts
    
- Convert the demo into a complete location platform
    
- Add a merchant campaign management system
    
- Add a heavy 3D engine
    
- Replace the entire architecture “for scalability”
    
- Introduce unrelated product features
    

---

## Expected workflow for Codex

When working under this skill, follow this workflow:

1. Read the current repository structure
    
2. Read `PROJECT.md`
    
3. Read `TASKS.md`
    
4. Identify the smallest files that need changes
    
5. Implement only the requested task
    
6. Preserve existing behavior unless the task explicitly changes it
    
7. Update `README.md` if user-facing behavior changes
    
8. Explain what changed and how to test it
    

---

## Output expectations

When completing a task, provide:

1. files changed
    
2. summary of changes
    
3. why this approach was chosen
    
4. any Safari-specific caveats
    
5. manual test steps
    
6. any unresolved risks or follow-ups
    

---

## Safety and compatibility notes

### Camera

- camera access requires a secure context in normal browser usage
    
- do not assume `getUserMedia` will always succeed
    
- surface clear fallback messaging
    

### Motion / orientation

- iPhone Safari may require explicit permission requests after user interaction
    
- do not request these permissions automatically on page load
    
- permission requests should be user-driven when possible
    

### Geolocation

- permission may be denied or unavailable
    
- show status clearly
    
- handle timeout and error branches explicitly
    

### GitHub Pages

- the app may be hosted under a repository subpath
    
- avoid root-relative resource links
    
- avoid assumptions that the app runs at domain root
    

---

## Refactor policy

Small refactors are allowed when they directly support the requested task.

Allowed:

- extracting small helper functions
    
- clarifying state transitions
    
- renaming confusing variables locally
    
- removing dead code if clearly safe
    

Not allowed unless explicitly requested:

- full file rewrites
    
- large architectural reorganization
    
- directory reshuffling
    
- tooling migration
    

---

## Decision rule

When uncertain between:

- a lightweight direct change
    
- and a more abstract “future-proof” redesign
    

choose the **lightweight direct change**.

This repository is a **demo-first project**, not a platform rewrite target.

---

## One-line reminder

Keep this repo as a **small, readable, iPhone Safari-first static demo** that validates the capture loop first, then geolocation, then simple geofence behavior.
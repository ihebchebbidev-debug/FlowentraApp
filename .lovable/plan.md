# Workflow Module — Self-Driving Auto-Demo + Full Interactive Tour

## Goal
When a user opens the Workflow module for the first time, the app **drives itself**: a virtual cursor appears, opens the builder, drags real nodes from the palette onto the real canvas, connects them, opens the real configuration modal, fills the fields, adds branches, saves, activates, and runs a test — all while captions explain each move. It's a live screencast performed inside the actual UI, not a mocked animation and not just tooltips. After (or instead of) the auto-demo, users can take a hands-on joyride tour. Replayable anytime. EN/FR.

## The Core Idea — "Autopilot Mode"
We add an **Autopilot engine** that programmatically performs every action a real user would, against the real `WorkflowBuilder` (ReactFlow) and real components. A synthetic cursor sprite is overlaid on top so users see *where* it's clicking and dragging. Each step is scripted, deterministic, and pausable.

This is the difference from a normal joyride: joyride points at things; autopilot **does the things**.

## Auto-Demo Script (≈90s, performed live)

1. Land on `/workflow` → cursor moves to "+ Create Workflow" → click. Real builder opens with empty canvas. Caption: "Let's build a workflow together."
2. Cursor moves to palette → expands "Triggers" category. Caption: "Triggers start workflows."
3. Cursor grabs `Status Change Trigger` chip, drags across canvas, drops at (200, 160). A real ReactFlow node appears. Caption: "Drop a trigger on the canvas."
4. Cursor double-clicks the node → real `NodeConfigurationModal` opens. Caption: "Configure it."
5. Cursor selects Entity = Offer, From = draft, To = sent (real selects animate). Cursor clicks Save.
6. Cursor opens "Actions" palette category, drags `Send Email` node to (520, 160). Caption: "Add an action."
7. Cursor moves from the trigger's right handle to the email node's left handle — real edge is created via ReactFlow's `addEdge`. Caption: "Connect them."
8. Cursor opens email config; types into To = `{{customer.email}}`, Subject = `Your offer {{offer.number}}`, short body. Saves. Caption: "Use {{variables}} from the trigger entity."
9. Cursor drags a `Condition` node to (520, 320), connects trigger → condition. Caption: "Branch with a condition."
10. Drags `Send SMS` on the true path, `Notification` on false path, connects both. Caption: "Different outcomes per branch."
11. Drags an `Approval` node, sets role = Manager, timeout = 24h. Caption: "Pause for human approval."
12. Drags a `Delay` node (2h), then a `Scheduled Trigger` (every 15 min) on a side branch. Caption: "Wait or run on a schedule."
13. Cursor clicks Save → toast appears. Cursor toggles Activate. Caption: "Activate to go live."
14. Cursor clicks Test Run → switches to Executions tab → a row animates in → cursor opens the per-node log drawer. Caption: "Watch it execute."

Controls (overlay HUD, bottom-center): ◀ Prev step · ⏸/▶ · ▶▶ Skip · Speed 0.5×/1×/2× · 🔁 Replay · 🎯 Switch to hands-on tour · ✕ Don't show again. Progress bar + step counter (e.g. "Step 7 of 14"). Captions appear in a non-blocking bottom-sheet so the canvas stays visible.

## Technical Plan — How Autopilot Works

### 1. Autopilot Engine
`src/modules/workflow/components/onboarding/autopilot/AutopilotEngine.tsx`
- React component that mounts a `<VirtualCursor/>` (absolutely-positioned SVG sprite) and runs a queue of `Step` objects.
- Step types: `move`, `click`, `dragFrom→to`, `type`, `select`, `wait`, `caption`, `navigate`, `assert`.
- Movement uses `requestAnimationFrame` to tween cursor along Bezier paths with easing — looks human, not robotic.
- All timing centralized so QA can tune pace; respects the user's Speed setting.

### 2. Driving the Real UI (not synthetic DOM events)
Because ReactFlow uses pointer events + internal state, simulating raw `mousedown/mousemove/mouseup` is fragile across browsers. Instead, autopilot uses **two cooperating layers**:

- **Imperative API on the builder.** `WorkflowBuilder` already owns nodes/edges state. We expose an `useWorkflowBuilderApi()` hook with `addNode(type, position, data)`, `connect(sourceId, targetId)`, `openNodeConfig(id)`, `updateNodeData(id, patch)`, `save()`, `activate()`, `testRun()`, `selectTab(name)`. Autopilot calls these to mutate real state — exactly what user actions would produce.
- **Virtual cursor + ghost.** Purely visual: the cursor sprite moves from the palette item's bounding rect to the drop point; a translucent "ghost" of the node follows under the cursor. When the cursor "drops", the imperative API call fires and the real node renders at that position. Result: visually it looks like the cursor performed a real drag-and-drop; functionally the state mutation is guaranteed correct.

This hybrid avoids brittleness while still showing the *physical* gesture users will perform themselves.

### 3. Sandbox Draft
- Autopilot operates on a dedicated **sandbox draft workflow** (id = `__demo_sandbox__`) so it never pollutes the user's real workflows. Created in memory only; never persisted unless user clicks "Keep this".
- On exit/skip, the sandbox is wiped and the user is returned to the dashboard.

### 4. Synthetic Cursor & Ghost
`autopilot/VirtualCursor.tsx`, `autopilot/DragGhost.tsx`
- SVG cursor with subtle drop shadow + click pulse.
- Ghost = miniature of the palette chip with 60% opacity that follows the cursor during a `dragFrom→to` step.

### 5. Captions HUD
`autopilot/AutopilotHUD.tsx` — bottom bar with caption, progress, controls. Uses Framer Motion for slide-in/out.

### 6. Step Scripts
`autopilot/scripts/buildOfferEmailWorkflow.ts` — exports the 14-step array for the demo above.
Extensible: more scripts can be added later (e.g. "Build a dispatch workflow", "Build a job approval workflow") and surfaced in the Help menu as "Watch demo: …".

### 7. Pause/Resume/Skip
- Engine maintains `currentStepIndex` and `playState`. Pause halts the cursor mid-tween; Skip jumps directly to the post-state of the current step (state mutation runs immediately, cursor teleports).

### 8. Hands-On Joyride Tour (complementary)
`src/modules/workflow/components/onboarding/WorkflowFeatureTour.tsx` — 25-step react-joyride covering dashboard tabs, palette categories, drag hints, every node type, save/activate/test, executions, logs. Two modes:
- **Guided**: seeds the same sandbox draft so spotlights always have a target.
- **Free**: detects real `onNodesChange`/`onEdgesChange` to auto-advance after the user actually drags/connects.

### 9. Help Button
`WorkflowHelpButton.tsx` floating bottom-right:
- ▶ Watch auto-demo
- 🤖 Re-run autopilot from step…
- 🎯 Interactive tour (Guided)
- 🖐 Interactive tour (Free, real drag-drop)
- 📖 Docs
- 🔄 Reset onboarding

### 10. Onboarding Hook
`hooks/useWorkflowOnboarding.ts` — manages `localStorage` (`wf-autopilot-seen-v1`, `wf-tour-done-v1`), exposes `shouldAutoPlay`, `playAutopilot(scriptId)`, `startTour(mode)`, `reset`.

## Files

### New
- `components/onboarding/autopilot/AutopilotEngine.tsx`
- `components/onboarding/autopilot/VirtualCursor.tsx`
- `components/onboarding/autopilot/DragGhost.tsx`
- `components/onboarding/autopilot/AutopilotHUD.tsx`
- `components/onboarding/autopilot/scripts/buildOfferEmailWorkflow.ts`
- `components/onboarding/autopilot/types.ts`
- `components/onboarding/WorkflowFeatureTour.tsx`
- `components/onboarding/WorkflowHelpButton.tsx`
- `hooks/useWorkflowOnboarding.ts`
- `hooks/useWorkflowBuilderApi.ts` (imperative API exposed by the builder)
- `utils/demoSandbox.ts` (sandbox draft lifecycle)
- Locale: `locale/en.json`, `locale/fr.json` — `onboarding.autopilot.*` + `onboarding.tour.*`

### Edited (presentation + tiny refactor to expose imperative API)
- `WorkflowModule.tsx` — mount HelpButton, AutopilotEngine host, FeatureTour; auto-play on first visit.
- `WorkflowBuilder.tsx` — wrap state setters with `useWorkflowBuilderApi` provider; add refs to palette, canvas, save/activate/test buttons (used both by autopilot to read positions and by joyride for spotlights). Add `data-tour` attributes.
- `WorkflowDashboard.tsx` — `data-tour` on header, tabs, Create button, execution row.
- `components/panels/*` (palette) — `data-tour` per category, expose item bounding rects via refs registered on a `PaletteRegistry` context that autopilot reads.
- `NodeConfigurationModal.tsx` — `data-tour` attributes + an `autopilotControlled` prop that lets the engine drive form fields through the imperative API without violating controlled-input invariants.
- `WorkflowExecutionHistory.tsx` — `data-tour` on first row and log drawer.

### No backend changes. Migration 32 and engine code untouched.

## Animation / Tech
- Framer Motion + plain RAF tweens. No new dependencies.
- `react-joyride` (already in repo) for the spotlight tour layer.
- Lazy-loaded so the workflow module's initial bundle is unchanged.

## Reset & Analytics
- `Preferences → Onboarding`: "Replay workflow autopilot demo" → `useWorkflowOnboarding().reset()`.
- Optional `useActionLogger` events: `workflow.autopilot.completed/skipped/paused`, `workflow.tour.completed/skipped`.

## i18n
Every caption, control label, and tour step under `onboarding.*` in EN/FR.

## Out of Scope
- Recording an MP4 (we perform it live in-app — better, always up to date with the UI).
- Backend / engine / DB changes.
- Multi-script library beyond the first "Offer → Email + branches" script (scaffolded to add more later).

## Deliverable
First visit to `/workflow` triggers Autopilot: a virtual cursor performs the entire workflow-creation flow inside the real builder — drags real nodes from the real palette, draws real edges, fills the real config modal, saves, activates, runs a test, and shows executions — with synced captions, pause/skip/speed controls. A `?` button lets users replay autopilot or run a 25-step hands-on joyride tour (guided or free). EN/FR. No backend touched.

// Shared types for the in-app documentation ("real docs" layer).
// Content in ./guides/* is derived from a code audit of each module —
// every rule should be traceable to a file in src/modules/* or Backend/Modules/*.

export type GuideWorkflow = {
  /** Short imperative name, e.g. "Quote → Sale conversion" */
  name: string;
  /** Ordered, user-facing steps. Keep each step one sentence. */
  steps: string[];
};

export type GuideRule = {
  title: string;
  detail: string;
};

export type GuideStatus = {
  name: string;
  meaning: string;
};

export type ModuleGuide = {
  key: string;
  /** 2-4 sentence plain-language explanation of what the module is for. */
  purpose: string;
  /** Concrete end-to-end flows a user performs in this module. */
  workflows: GuideWorkflow[];
  /** Real, code-enforced business rules, guards and calculations. */
  rules: GuideRule[];
  /** Status/stage vocabulary used by the module, if any. */
  statuses?: GuideStatus[];
  /** How this module talks to other modules. */
  integrations?: string[];
  /** Known limitations, stubs and traps. */
  gotchas?: string[];
  /** Source files the documentation was derived from. */
  sources?: string[];
};

export type ModuleGuideMap = Record<string, ModuleGuide>;

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type PromptKey = "lead-analyzer" | "sdr" | "objections" | "scheduler" | "proposal-builder";

export interface PromptDescriptor {
  key: PromptKey;
  path: string;
  schema: string;
  purpose: string;
}

export interface LoadedPrompt extends PromptDescriptor {
  content: string;
}

export interface LoadPromptOptions {
  rootDir?: string;
  readFile?: (path: string) => string;
}

export const promptRegistry: Record<PromptKey, PromptDescriptor> = {
  "lead-analyzer": {
    key: "lead-analyzer",
    path: "/prompts/lead-analyzer.md",
    schema: "LeadAnalysis",
    purpose: "Diagnostico e leitura de aderencia ao ICP"
  },
  sdr: {
    key: "sdr",
    path: "/prompts/sdr.md",
    schema: "ConversationState",
    purpose: "Resposta SDR consultiva e proxima acao"
  },
  objections: {
    key: "objections",
    path: "/prompts/objections.md",
    schema: "ConversationState",
    purpose: "Tratamento de objecoes comerciais"
  },
  scheduler: {
    key: "scheduler",
    path: "/prompts/scheduler.md",
    schema: "MeetingDecision",
    purpose: "Decisao de agendamento"
  },
  "proposal-builder": {
    key: "proposal-builder",
    path: "/prompts/proposal-builder.md",
    schema: "ProposalBrief",
    purpose: "Brief de proposta para revisao humana"
  }
};

export function getPromptDescriptor(key: PromptKey) {
  return promptRegistry[key];
}

function resolvePromptPath(path: string, rootDir: string) {
  return join(rootDir, path.replace(/^\//, ""));
}

export function loadPrompt(key: PromptKey, options: LoadPromptOptions = {}): LoadedPrompt {
  const descriptor = getPromptDescriptor(key);
  if (!descriptor) throw new Error(`Prompt not registered: ${key}`);

  const rootDir = options.rootDir ?? /* turbopackIgnore: true */ process.cwd();
  const primaryPath = resolvePromptPath(descriptor.path, rootDir);
  const parentPath = resolvePromptPath(descriptor.path, join(rootDir, ".."));
  const readFile = options.readFile ?? ((path: string) => readFileSync(path, "utf8"));
  const promptPath = options.readFile
    ? primaryPath
    : existsSync(primaryPath) ? primaryPath : parentPath;

  return {
    ...descriptor,
    content: readFile(promptPath)
  };
}

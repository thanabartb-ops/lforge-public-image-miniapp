/* LFORGE LLM Command UI contract. Runtime calls are server-side only. */
window.LFORGECommandEngine = {
  endpoint: "https://gkzyymcxjgpuflnnbocd.supabase.co/functions/v1/lforge-command",
  flow: ["REFERENCE", "BRIEF", "APPROVAL", "RENDER"],
  compilePayload({ request, references = [], identity = "", color = "", output = "image", backgroundStudio = "" }) {
    return { user_request: request, references, identity, color, output, background_studio: backgroundStudio };
  }
};

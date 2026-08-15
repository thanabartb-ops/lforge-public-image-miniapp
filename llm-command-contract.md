# LFORGE LLM Command Contract

User-facing flow: REFERENCE → BRIEF → APPROVAL → RENDER.

The LLM is a Command Compiler, not the creative authority. It converts natural-language intent plus references into a structured production command. The command is versioned with the approved brief and must not replace supplied identity.

Video references are treated as Background Studio inputs unless the requested output is explicitly video.

Required command fields:
- intent
- subject
- identity
- references
- composition
- environment
- visual_style
- color
- lighting
- typography
- materials
- camera
- motion
- negative_constraints
- output_format
- quality_requirements
- command_text

Production flow:
REFERENCE → LLM COMMAND → BRIEF → APPROVAL → RENDER → ARTIFACT → QC → LINEAGE → AUDIT

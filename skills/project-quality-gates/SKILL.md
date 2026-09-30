---
name: project-quality-gates
description: Discover and run a project's existing build, test, typecheck, lint, formatting, and verification commands without globally installing or silently changing dependencies.
---

# Project quality gates

1. Detect the project ecosystem from manifests, lockfiles, workspace files, CI configuration, and documented commands.
2. Prefer repository-defined scripts and the package manager selected by the lockfile.
3. Run the smallest relevant focused check while editing, then the project's applicable test, typecheck, lint, and build gates before completion.
4. Do not invent passing results. Report commands, exit status, skipped gates, and the first actionable failure.
5. Distinguish failures caused by the change from pre-existing or environment failures using evidence.

Never install global tools, update lockfiles, run mutable `latest` packages, rewrite formatting broadly, or weaken tests without explicit authorization.

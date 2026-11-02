# Project instructions

- Keep the five course identities and their separate folders (`child`, `teen`, `college`, `post-college`, `expert`). Do not make one course depend on another course’s content or runtime files.
- The repository root is the latest working version. Completed versions are published at `iterations/iteration-NN/` and listed at `iterations/`.
- Treat existing `iterations/iteration-NN/` directories as read-only snapshots. Do not edit, regenerate, replace, remove, or repoint a previous iteration when changing the latest version. Copy all required runtime assets into each new snapshot; do not refer back to changing root assets.
- After a requested iteration is finished and validated, save it under the next unused iteration number with `scripts/freeze-iteration.mjs`, recording the actual source commit. The command refuses to overwrite existing versions and isolates browser-local progress for each one.
- Run `npm test` before committing an update. The snapshot integrity checks must continue to pass for every preserved version. Never update old snapshot hashes to conceal a change.
- Keep GitHub Pages publishing from `main` at the repository root. Preserve existing iteration URLs.
- Karen wants to propose her own improvements for the assignment. Document delivered changes and actual verification; do not add an unsolicited improvement list or invent learner-testing results.

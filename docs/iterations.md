# Preserving published iterations

The root website is the latest working version. Each completed iteration receives a stable copy under `iterations/iteration-NN/`. The archive landing page lists those numbered copies.

## What is preserved

The copy contains its own entrance page, sources page, five course folders, JavaScript, styles, JSON content, illustrations, and favicon. No runtime asset depends on the changing root app. Browser-storage keys are scoped to the iteration; an update to the latest version cannot replace the saved version’s learning notes or progress.

The only snapshot transformations isolate storage keys and, when present, make the global archive link point to the surrounding archive page. Teaching content and appearance are copied from the recorded source commit.

## Workflow for a later iteration

1. Make Karen’s requested changes to the root app and relevant audience folders. Leave all existing numbered snapshot folders alone.
2. Run the tests and check the requested behavior. Commit the finished working version to GitHub and retain its actual commit SHA.
3. Verify that the runtime files being copied match that source commit, then create the next unused snapshot:

   ```sh
   npm run freeze -- iteration-02 --source-commit <actual-40-character-commit-sha> --label "Iteration 02" --description "Description of the changes actually made"
   ```

4. Run `npm test`. It verifies that every archived file still matches its recorded SHA-256 digest, along with the financial models and local links. Do not change a prior manifest to conceal edits.
5. Commit the new snapshot, updated registry, and archive index to `main`. GitHub Pages will publish the added version at its own URL. Verify the new public page and one course before handing it over.

The snapshot command refuses to overwrite an existing iteration number. The first version remains at `iterations/iteration-01/` even after later versions are added. The source commit in each snapshot’s `snapshot.json` provides a second record of where it came from.

Karen’s proposed improvements and observations remain her own. This workflow records the versions she chooses to create; it does not supply a list of changes.

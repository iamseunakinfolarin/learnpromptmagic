import path from "node:path";
import { reportFailures, runContentChecks } from "./content-checks";
import { runReleaseChecks } from "./release-checks";

/**
 * Runs as `npm run check:release`. It is the content check plus the launch
 * rules, and it is expected to fail until the launch phase, so it is kept out
 * of prebuild on purpose.
 */
const root = process.cwd();
const contentDir = path.join(root, "content");

const failures = [
  ...runContentChecks({
    contentDir,
    codeDirs: [
      path.join(root, "app"),
      path.join(root, "components"),
      path.join(root, "lib"),
    ],
  }),
  ...runReleaseChecks({ contentDir }),
];

reportFailures(failures, "Release check");
process.exit(failures.length > 0 ? 1 : 0);

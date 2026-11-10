import path from "node:path";
import { reportFailures, runContentChecks } from "./content-checks";

/**
 * Runs as `npm run check:content`, and as `prebuild`, so a deploy stops
 * before it serves content that breaks the contract.
 */
const root = process.cwd();

const failures = runContentChecks({
  contentDir: path.join(root, "content"),
  codeDirs: [
    path.join(root, "app"),
    path.join(root, "components"),
    path.join(root, "lib"),
  ],
});

reportFailures(failures, "Content check");
process.exit(failures.length > 0 ? 1 : 0);

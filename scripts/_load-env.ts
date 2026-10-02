// Side-effect-only module: loads .env.local before anything else. Must be
// the very first import in every benchmark script (not a later statement)
// — sibling imports in an ES module evaluate in order, each one's body
// fully running before the next starts, so importing this first guarantees
// process.env is populated before lib/scoring.ts's module-level Anthropic
// client gets constructed.
import { config } from "dotenv";
import path from "path";

config({ path: path.join(__dirname, "../.env.local") });

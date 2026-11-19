import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(
  new URL("../src/app/api/ai/assistant/route.ts", import.meta.url),
  "utf8"
);

test("AI conversations are bound to the authenticated user", () => {
  assert.match(route, /\.eq\(['"]user_id['"],\s*user\.id\)/);
  assert.match(route, /\.from\(['"]ai_conversations['"]\)\s*\.insert\(\{\s*user_id:\s*user\.id\s*\}\)/s);
  assert.match(route, /Conversation not found/);
  assert.doesNotMatch(route, /body\.customer_id/);
});

test("AI conversation ownership is checked before history is loaded", () => {
  const ownershipIndex = route.indexOf("ownershipError");
  const historyIndex = route.indexOf("getConversationHistory(supabase, conversationId)");
  assert.notEqual(ownershipIndex, -1);
  assert.notEqual(historyIndex, -1);
  assert.ok(ownershipIndex < historyIndex);
});

test("assistant quotes only the published starting prices, no invented prices", () => {
  // No hardcoded price list in the route — prices come from the published
  // catalog in src/lib/services.ts via servicePriceLines().
  assert.doesNotMatch(route, /from \$\d/i);
  assert.match(route, /servicePriceLines\(["']en["']\)/);
  assert.match(route, /Quote ONLY the published starting prices/i);
  assert.match(route, /Never invent other prices/i);
  assert.doesNotMatch(route, /Chemical engineering solutions/i);
  assert.doesNotMatch(route, /\+1\s*\(917\)\s*818-3426/);
});

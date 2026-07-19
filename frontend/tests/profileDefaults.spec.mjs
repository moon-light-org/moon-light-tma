import assert from "node:assert/strict";
import {
  createDefaultNickname,
  isGeneratedNickname,
  isProfileComplete,
} from "../.tmp-tests/profileDefaults.js";

assert.equal(createDefaultNickname(123456789), "moon_456789");
assert.equal(createDefaultNickname(42), "moon_42");
assert.equal(isGeneratedNickname("moon_456789"), true);
assert.equal(isGeneratedNickname("Moon_456789"), true);
assert.equal(isGeneratedNickname("Alice"), false);
assert.equal(isProfileComplete({ nickname: "Alice" }), true);
assert.equal(isProfileComplete({ nickname: "moon_456789" }), true);
assert.equal(isProfileComplete({ nickname: "" }), false);

console.log("profileDefaults tests passed");

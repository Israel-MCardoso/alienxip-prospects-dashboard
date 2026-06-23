import assert from "node:assert/strict";
import test from "node:test";

import {
  findActiveNavigation,
  flattenNavigation,
  navigationGroups
} from "../app-next/src/components/layout/os-navigation.mjs";

test("groups OS navigation into operational hubs", () => {
  assert.deepEqual(
    navigationGroups.map((group) => group.label),
    ["Início", "CRM", "Outreach", "Operação", "Conhecimento", "Tecnologia", "Configurações"]
  );
});

test("keeps every requested route visible in the flattened navigation", () => {
  const hrefs = flattenNavigation().map((item) => item.href);

  assert.ok(hrefs.includes("/os/outreach"));
  assert.ok(hrefs.includes("/os/tech/decisions"));
  assert.ok(hrefs.includes("/os/settings"));
});

test("matches nested routes to the most specific navigation item", () => {
  assert.equal(findActiveNavigation("/os/prospects/abc")?.item.label, "Prospects");
  assert.equal(findActiveNavigation("/os/prospects/pipeline")?.item.label, "Funil");
  assert.equal(findActiveNavigation("/os/tech/bugs")?.item.label, "Bugs");
  assert.equal(findActiveNavigation("/os")?.item.label, "Controle de Missão");
});

import fs from "fs";
import path from "path";
import { Store } from "../store/json-data-store.js";
import { config_schema, default_config } from "../../schema/test/config-schema.js";

(async function () {
  // wipe test data and bootstrap
  const cwd = path.dirname(import.meta.url.replace(`file:///`, ``));
  const storePath = path.join(cwd, `..`, `..`, `json-data-store`);
  await fs.promises.rm(storePath, {
    recursive: true,
    force: true,
  });

  let store = new Store("test");

  // create the store with an explicit schema for the "config" namespace
  store.load(`config`, config_schema);
  store.put(`test`, default_config);

  // load the store anew, this time using the stored schema.
  store = new Store("test");
  store.load(`config`);

  const { name, version } = store.schema.__meta;
  console.log(`using schema [${name} v${version}]`);

  // "put" testing
  let testConfig = default_config;
  console.log(`\n\n[store default_config]\n`);
  try {
    store.put(`test2`, default_config);
    console.log(`stored default config`);
  } catch (e) {
    console.error(e);
  }

  // "get" testing
  console.log(`\n\n[testing store.get(\`test2\`)]\n`);
  try {
    testConfig = store.get(`test2`);
    console.log(`test2:`, testConfig);
  } catch (e) {
    console.error(e);
  }

  // "bad edits" testing
  console.log(`\n\n[testing store.put("test2.ruleset", "random string")]\n`);
  try {
    store.put(`test2.ruleset`, `random string`);
  } catch (e) {
    console.log(`${e}`);
  }

  console.log(`\n\n[testing store.put("test2") after a bad value update]\n`);
  try {
    testConfig.ruleset = `nonsense`;
    store.put(`test2`, testConfig);
  } catch (e) {
    console.log(`${e}`);
  }

  // Schema migration testing.
  const changed_schema = JSON.parse(JSON.stringify(config_schema));
  changed_schema.wind_rotation.__meta.required = true;
  changed_schema.wind_rotation.choices = [0, 1, 2, 3];
  const nested_name = changed_schema.nested_property.shape.name;
  nested_name.default = nested_name.choices[2];
  changed_schema.wallhack2 = changed_schema.wallhack;
  delete changed_schema.wallhack;
  changed_schema.updated_property = {
    __meta: {
      description: "testing subtree relocation",
      required: true,
    },
    shape: {
      test_nested_move: changed_schema.movable_nested_property,
    },
  };
  delete changed_schema.movable_nested_property;
  delete changed_schema.ruleset;

  console.log(`\n\n[testing migrating to schema v${version + 1}]`);
  store.migrate(changed_schema);
})();

import { Store } from "../store/json-data-store.js";
import { config_schema } from "../../test/config-schema.js";

(async function () {
  const store = new Store("test");
  await store.load(`config`);

  const { name, version } = store.schema.__meta;
  console.log(`using schema [${name} ${version}]`);

  let testConfig = default_config;

  console.log(`\n[store default_config]\n`);
  try {
    await store.put(`testConfig`, default_config);
    console.log(`stored default config`);
  } catch (e) {
    console.error(e);
  }

  console.log(`\n[testing store.get(\`testConfig\`)]\n`);
  try {
    testConfig = await store.get(`testConfig`);
    console.log(`testConfig:`, testConfig);
  } catch (e) {
    console.error(e);
  }

  console.log(`\n[testing store.put("testConfig.ruleset", "random string")]\n`);
  try {
    await store.put(`testConfig.ruleset`, `random string`);
  } catch (e) {
    console.error(e);
  }

  console.log(`\n]testing store.put("testConfig") after a bad value update]\n`);
  try {
    testConfig.ruleset = `nonsense`;
    await store.put(`testConfig`, testConfig);
  } catch (e) {
    console.error(e);
  }
})();

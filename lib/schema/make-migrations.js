import fs from "fs";
import { makeSchemaChangeHandler } from "./basic-js-schema.js";
import { createDiff, applyDiff } from "../diff/diff.js";

/**
 * Determine the series of operation transforms to turn schema1 into
 * schema2, and then turn that into a self-executing .js file that
 * users can edit before running, in case they need to fill in any of
 * the operational hooks.
 */
export function makeMigration(
  schema1,
  schema2,
  schemaChangeHandler = makeSchemaChangeHandler()
) {
  const operations = createDiff(schema1, schema2);

  const script = `
const filename = process.argv[2];

let data = fs.readFileSync(filename);
if (!fs.existsSync(filename)) {
console.error(\`Could not find \${filename}\`);
process.exit(1);
}
data = data.toString("utf-8");

const operations = JSON.parse(\`${JSON.stringify(operations)}\`);

const ignoreKey = ${schemaChangeHandler.ignoreKey.toString()};

const filterKeyString = ${schemaChangeHandler.filterKeyString.toString()};

const getObjectLevel = ${schemaChangeHandler.getObjectLevel.toString()};

const schemaChangeHandler = ${schemaChangeHandler.toString()};

${operations
  .map((op) => {
    if (!op.fn) return ``;
    return `schemaChangeHandler.${op.fn} = function (data, op) {
// Your code goes here
};`;
  })
  .join(`\n\n`)}

${applyDiff.toString()}

const updated = applyDiff(operations, data, schemaChangeHandler);

console.log(updated);`;

  const m1 = schema1.__meta;
  const m2 = schema2.__meta;

  fs.writeFileSync(
    `${m1.name}-${m1.version}-${m2.name}-${m2.version}.esm.js`,
    `import fs from "fs";\n${script}`,
    `utf-8`
  );
  fs.writeFileSync(
    `${m1.name}-${m1.version}-${m2.name}-${m2.version}.cjs.js`,
    `const fs = require("fs");\n${script}`,
    `utf-8`
  );
}

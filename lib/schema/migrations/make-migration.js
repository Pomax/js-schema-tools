import { makeSchemaChangeHandler } from "../basic-js-schema.js";
import { createDiff, applyDiff } from "../../diff/diff.js";

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

  // TODO: make this capable of processing a dir.

  return `
const filename = process.argv[2];

let data = fs.readFileSync(filename);

if (!fs.existsSync(filename)) {
  console.error(\`Could not find \${filename}\`);
  process.exit(1);
}

try {
  data = JSON.parse(data.toString("utf-8"));
} catch (e) {
  console.error(\`Could not parse \${filename} as JSON\`);
  process.exit(1);
}

const operations = ${JSON.stringify(operations, false, 2)};

${schemaChangeHandler.ignoreKey.toString()};

${schemaChangeHandler.filterKeyString.toString()};

${schemaChangeHandler.getObjectLevel.toString()};

${schemaChangeHandler.toString()};

${operations
  .map((op) => {
    if (!op.fn) return ``;
    return `changeHandler.${op.fn} = function (data, op) {
  // Your update code goes here
};`;
  })
  .join(`\n\n`)}

${applyDiff.toString()}

const updated = applyDiff(operations, data, changeHandler);

console.log(JSON.stringify(updated, false, 2));`;
}

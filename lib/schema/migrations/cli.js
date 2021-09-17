#! /usr/bin/env node

import fs from "../../fs.js";
import { loadSchema } from "../basic-js-schema.js";
import { makeMigration } from "./make-migration.js";

const [_node, _script, file1, file2, type] = process.argv;
makeMigrations(file1, file2, type);

export function makeMigrations(file1, file2, type = `module`) {
  if (!file1 || !file2) {
    console.error(`
  error: schema files not specified.
  usage: jss-makemigrations file1.json file2.json [module|commonjs]
  `);
    process.exit(1);
  }

  if (![undefined, `module`, `commonjs`].includes(type)) {
    console.error(`
  error: unknown optional type specified.
  usage: jss-makemigrations file1.json file2.json [module|commonjs]
  `);
    process.exit(2);
  }

  let schema1;
  try {
    schema1 = loadSchema(file1);
  } catch (e) {
    console.error(`error: could not load ${file1}.`);
    process.exit(3);
  }

  let schema2;
  try {
    schema2 = loadSchema(file2);
  } catch (e) {
    console.error(`error: could not load ${file2}.`);
    process.exit(3);
  }

  makeMigrationFile(schema1, schema2, type);
}

export function makeMigrationFile(schema1, schema2, type=`module`) {
  const script = makeMigration(schema1, schema2);
  const m1 = schema1.__meta;
  const m2 = schema2.__meta;
  const filename = `${m1.name}-${m1.version}-${m2.name}-${m2.version}`;
  const filepath = `${filename}${
    !type || type === `module` ? `.js` : `.common.js`
  }`;

  // We default to ESM because we all use modern JS by now, right?
  if (!type || type === `module`) {
    fs.writeFileSync(filepath, `import fs from "fs";\n${script}`, `utf-8`);
  }

  // But if someone really needs legacy require() code, accommodate them.
  else if (type === `commonjs`) {
    fs.writeFileSync(filepath, `import fs from "fs";\n${script}`, `utf-8`);
  }

  console.log(`
  Generated migration script: ${filepath}
  Migrate your data using:

    node ${filepath} your-data-file-json

  *** Remember to implement any migration functions required before migrating data ***
  `);
}

import fs from "fs";
import { User } from "./user.model.2.js";

// Figure out where the test store dir can be found based on the module "url"
import path from "path";
const moduleURL = new URL(import.meta.url);
const moduleDir = path.dirname(
  moduleURL.href.replace(`file:///`, process.platform === `win32` ? `` : `/`)
);

const keepFiles = process.argv.includes(`--keep`);

// Then, try to load our model data, which will flag a schema mismatch
// and result in a new stored schema, as well as a migration file.
const storeLocation = `${moduleDir}/store`;
try {
  User.load(`TestUser`, storeLocation);
} catch (e) {
  console.log();

  const schemaPath = `${storeLocation}/users/.schema/User.2.json`;
  const newSchema = fs.existsSync(schemaPath);

  if (newSchema) {
    console.log(`- new schema got created.`);
    if (!keepFiles) fs.unlinkSync(schemaPath);
  }

  const migrationPath = `${storeLocation}/users/User.v1.to.v2.js`;
  const migrationRunner = fs.existsSync(migrationPath);

  if (migrationRunner) {
    console.log(`- migration runner got created.`);
    if (!keepFiles) fs.unlinkSync(migrationPath);
  }
}

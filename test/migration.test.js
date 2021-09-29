import fs from "fs";
import path from "path";
import { Models } from "../index.js";
import { User as OriginalUser } from "./user.model.js";
import { User } from "./user.model.v2.js";
import { User as IndirectedUser } from "./user.model.v3.js";
import { Config } from "./config.model.v2.js";

// determine our store path
const moduleURL = new URL(import.meta.url);
const moduleDir = path.dirname(
  moduleURL.href.replace(`file:///`, process.platform === `win32` ? `` : `/`)
);

/**
 * Our battery of User tests
 */
describe(`Testing User model`, () => {
  const keepFiles = process.argv.includes(`--keep`);

  const storePath = `${moduleDir}/store`;

  afterEach(() => {
    Models.resetRegistrations();
    if (keepFiles) return;
    fs.rmSync(Models.store.storePath, { recursive: true });
  });

  // ╔══════════════════════╗
  // ║ THE TESTS START HERE ║
  // ╚══════════════════════╝

  test(`A direct User schema update leads to correct migration behaviour`, async () => {
    // Register the original user model, then try to register the
    // updated user model, causing a schema mismatch.
    await Models.useDefaultStore(storePath);
    Models.register(OriginalUser);
    expect(() => Models.register(User)).toThrow();

    const schemaPath = `${storePath}/users/.schema/User.2.json`;
    expect(fs.existsSync(schemaPath)).toBe(true);

    const migrationPath = `${storePath}/users/User.v1.to.v2.js`;
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  test(`A direct Config schema update leads to correct migration behaviour`, async () => {
    // Register the original user model, which saves the config schema,
    // and then try to register the updated config model, which should
    // cause a schema mismatch to get flagged.
    await Models.useDefaultStore(storePath);
    Models.register(OriginalUser);
    expect(() => Models.register(Config)).toThrow();

    const schemaPath = `${storePath}/config/.schema/Config.2.json`;
    expect(fs.existsSync(schemaPath)).toBe(true);

    const migrationPath = `${storePath}/config/Config.v1.to.v2.js`;
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  test(`An indirect User schema update by changing Config leads to correct migration behaviour`, async () => {
    // Same as before
    await Models.useDefaultStore(storePath);
    Models.register(OriginalUser);
    expect(() => Models.register(IndirectedUser)).toThrow();

    // except now the schema that triggers the mismatch is User, but the
    // schema that _causes_ the mismatch is Config, and so we expect to
    // see a new config schema file, with both a user migration file,
    // and a config migration file.
    const schemaPath = `${storePath}/config/.schema/Config.2.json`;
    expect(fs.existsSync(schemaPath)).toBe(true);

    let migrationPath = `${storePath}/config/Config.v1.to.v2.js`;
    expect(fs.existsSync(migrationPath)).toBe(true);

    migrationPath = `${storePath}/users/User.v1.to.v2.js`;
    expect(fs.existsSync(migrationPath)).toBe(true);
  });
});

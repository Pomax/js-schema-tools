import fs from "fs";
import {
  loadSchemaFromFilePath,
  createValidator,
  validate,
  migrate,
} from "../schema/basic-js-schema.js";
import { equals } from "../equals/equals.js";
import { createDiff } from "../diff/diff.js";

const DEBUG = false;

function debug(...args) {
  if (DEBUG) console.log(...args);
}

/**
 * Specific file "view".
 */
class JSONDataStoreView {
  constructor(store, primaryKey) {
    this.store = store;
    this.primaryKey = primaryKey;
  }

  get(key) {
    return this.store.get(`${this.primaryKey}.${key}`);
  }

  put(key, value) {
    let fullKey = `${this.primaryKey}`;
    if (value !== undefined) {
      fullKey = `${fullKey}.${key}`;
    } else {
      value = key;
    }
    return this.store.put(fullKey, value);
  }

  remove(key) {
    return this.store.remove(`${this.primaryKey}.${key}`);
  }
}

function findLatestSchema(path, schemaName) {
  try {
    const files = fs.readdirSync(`${path}`);
    return files
      .filter((v) => v.startsWith(schemaName) && v.endsWith(`.json`))
      .map((s) => {
        const version = s.match(/[^.]+\.(\d+?)\.json/);
        const versionNumber = parseInt(version[1]);
        return { filename: s, versionNumber };
      })
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
  } catch (e) {
    return false;
  }
}

/**
 * File based data store, reading/writing json files.
 */
class JSONDataStore {
  static DEFAULT_PATH = `./json-data-store`;

  constructor(dataPath) {
    this.dataPath = JSONDataStore.DEFAULT_PATH;
    if (dataPath) {
      this.dataPath = `${this.dataPath}/${dataPath}`;
    }
    this.load();
  }

  // synchronous operation
  load(namespace, schema) {
    const dataPath = `${this.dataPath}${
      namespace ? `/${namespace.replaceAll(`.`, `/`)}` : ``
    }`;
    !fs.existsSync(dataPath) && fs.mkdirSync(dataPath, { recursive: true });
    this.namespacedDataPath = dataPath;

    if (namespace) {
      this.namespace = namespace;
      const terms = dataPath.split(`/`);
      const ns = terms.pop();

      // find the schema that our data supposedly conforms to
      const schemaDir = `${dataPath}/.schema/`;
      const latestSchemaFile = findLatestSchema(schemaDir, ns);
      let schemaPath = ``;

      // If there is a schema'd store already, load the latest schema.
      if (latestSchemaFile) {
        schemaPath = `${dataPath}/.schema/${latestSchemaFile.filename}`;
        const latestSchema = loadSchemaFromFilePath(schemaPath);
        if (schema) {
          // if we were also passed a schema, verify that it's the same one.
          const same = equals(latestSchema, schema);
          if (!same) {
            throw new Error(
              `Schema mismatch for ${namespace}, please migrate your data first.`
            );
          }
        }
        this.schema = latestSchema;
      }

      // not yet schema'd, but a schema was passed.
      else if (schema) {
        // step 1: does our data pass schema validation?
        const validation = fs.readdirSync(dataPath).map((fn) => {
          if (!fn.endsWith(`.json`)) return true;
          const filePath = `${dataPath}/${fn}`;
          let obj = {};
          try {
            obj = JSON.parse(fs.readFileSync(filePath).toString(`utf-8`));
          } catch (e) {
            throw new Error(`Cannot parse ${filePath}, invalid JSON!`);
          }
          return validate(schema, obj);
        });

        // step 2a: it does not, so that's a user error.
        if (validation.some((v) => !v.passed)) {
          throw new Error(`Cannot apply provided schema to pre-existing data.`);
        }

        // step 2b: it does, bind and save this schema as the one to use, going forward.
        fs.mkdirSync(schemaDir, { recursive: true });

        schemaPath = `${schemaDir}/${ns}.${schema.__meta.version}.json`;
        fs.writeFileSync(schemaPath, JSON.stringify(schema, false, 2), `utf-8`);
        this.schema = schema;
      }

      // we're running schema'd
      if (this.schema) {
        debug(
          `Loaded namespace [${namespace}] using the schema from [${schemaPath}]`
        );
        this.schemaValidator = createValidator(this.schema);
      }
    }

    return this;
  }

  migrate(newSchema) {
    if (!this.schema) {
      if (this.namespace) {
        throw new Error(
          `Cannot migrate the ${this.namespace} namespace, as it does not currently use a schema.`
        );
      }
      throw new Error(
        `Cannot migrate an entire store, please load a specific namespace to migrate.`
      );
    }

    // First off, this will be "the next schema", so ensure its __meta is correct.
    const { name, version } = this.schema.__meta;
    const nextVersion = version + 1;
    newSchema.__meta.name = name;
    newSchema.__meta.version = nextVersion;

    // Then, determine the schema transform.
    const transforms = createDiff(this.schema, newSchema);

    // If this is a clean transform, write it to disk and apply it to our data.
    const dataPath = this.namespacedDataPath;
    const schemaPath = `${dataPath}/.schema/${name}.${nextVersion}.json`;
    fs.writeFileSync(schemaPath, JSON.stringify(newSchema, false, 2), `utf-8`);

    const processed = [];
    fs.readdirSync(dataPath).forEach((fn) => {
      if (!fn.endsWith(`.json`)) return;

      const filePath = `${dataPath}/${fn}`;
      let object;
      try {
        object = JSON.parse(fs.readFileSync(filePath).toString(`utf-8`));
      } catch (e) {
        throw new Error(`Cannot parse ${filePath}, invalid JSON!`);
      }

      migrate(object, transforms);
      const test = validate(newSchema, object);

      // Was this a good migration?
      if (test.passed) {
        const files = {
          old: `${filePath}.${version}`,
          new: filePath,
        };
        fs.renameSync(files.new, files.old);
        fs.writeFileSync(files.new, JSON.stringify(object, false, 2), `utf-8`);
        processed.push(files);
      }

      // Or do we need to roll back all changes made so far?
      else {
        fs.unlinkSync(schemaPath);
        processed.forEach((files) => {
          fs.unlinkSync(files.new);
          fs.renameSync(files.old, files.new);
        });
        throw new Error(`Migrated data failed validation for new schema: rolled back all changes!`);
      }
    });

    this.schema = newSchema;
  }

  // synchronous operation
  exists(key) {
    const terms = key.split(`.`);
    const filePath = `${this.namespacedDataPath}/${terms.shift()}.json`;
    return fs.existsSync(filePath);
  }

  // internal helper function to keep file loading DRY
  __loadFile(filePath) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `{}`);
    }
    const json = fs.readFileSync(filePath, { encoding: `utf-8` });
    try {
      return JSON.parse(json);
    } catch (e) {
      throw new Error(`Could not parse ${filePath} as JSON.`);
    }
  }

  /**
   * Rather than work with the entire data store, you may want your code
   * to work only with "that one object it should be read/writing". You
   * can use the instance function to achieve that, so that rather than:
   *
   *   const propVal = store.get(`primary.property`)
   *   if (propVal === something) {
   *     store.put(`primary.property2`, someval);
   *   }
   *
   * you can use:
   *
   *   const view = store.getView(`primary`);
   *   const propVal = view.get(`property`)
   *   if (propVal === something) {
   *     view.put(`property2`, someval);
   *   }
   */
  view(primaryKey) {
    return new JSONDataStoreView(this, primaryKey);
  }

  /**
   * ... docs go here ...
   */
  get(key) {
    const terms = key.split(`.`);
    const filePath = `${this.namespacedDataPath}/${terms.shift()}.json`;
    let data = this.__loadFile(filePath);

    if (this.schema) {
      const { name, version } = this.schema.__meta;
      debug(`validating against [${name} v${version}]`);
      const { passed, errors } = this.schemaValidator(data);
      if (!passed) {
        // console.error(errors);
        throw new Error(
          `Data for ${key} does not conform to schema [${name} v${version}]!`
        );
      }
    }

    if (terms.length) {
      while (terms.length) {
        data = data[terms.shift()];
      }
    }

    return data;
  }

  /**
   * ... docs go here ...
   */
  put(key, value, strict = true) {
    debug(key);

    const terms = key.split(`.`);
    const filePath = `${this.namespacedDataPath}/${terms.shift()}.json`;

    const top = this.__loadFile(filePath);
    const parents = [top];
    let data = top;
    let schema = this.schema;

    if (terms.length) {
      while (terms.length > 1) {
        const propName = terms.shift();
        if (!data[propName]) data[propName] = {};
        data = data[propName];
        parents.push(data);

        if (schema) {
          if (!schema[propName].shape) {
            const { name, id } = this.schema.__meta;
            throw new Error(
              `Schema error: cannot extract subtree for ${key} from ${name} ${id}`
            );
          }
          schema = schema[propName].shape;
        }
      }

      const propName = terms.shift();
      if (value === undefined) {
        delete data[propName];
      } else {
        data[propName] = value;
      }

      // In order to store only what we need,
      // do we need to prune back up?
      {
        const terms = key.split(`.`);
        terms.pop();
        let term = terms.pop();
        let parent = parents.pop();
        while (!Object.keys(parent).length) {
          parent = parents.pop();
          delete parent[term];
          term = terms.pop();
        }
      }
    } else {
      data = value;
    }

    const writeBack = () => {
      return fs.writeFileSync(
        filePath,
        JSON.stringify(data === value ? value : top, false, 2),
        `utf-8`
      );
    };

    if (schema) {
      const { passed, errors } = validate(schema, data, strict);
      if (!passed) {
        // console.error(errors);
        throw new Error(`Update for ${key} fails schema validation.`);
      } else return writeBack();
    } else return writeBack();
  }

  /**
   * ... docs go here ...
   */
  remove(key) {
    if (key.includes(`.`)) {
      return this.put(key, undefined);
    }

    const filePath = `${this.namespacedDataPath}/${key}.json`;
    fs.unlinkSync(filePath);
  }
}

const store = new JSONDataStore();

export { JSONDataStore, JSONDataStore as Store, store };

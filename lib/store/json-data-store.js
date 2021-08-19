import fs from "fs";
import {
  loadSchema,
  createValidator,
  validate,
} from "../schema/basic-js-schema.js";
import { equals } from "../equals/equals.js";

const DEBUG = true;

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

function findSchema(path, schemaName) {
  const files = fs.readdirSync(path);
  return files
    .filter((v) => v.startsWith(schemaName) && v.endsWith(`.json`))
    .map((s) => {
      const version = s.match(/[^.]+\.(\d+?)\.json/);
      const versionNumber = parseInt(version[1]);
      return { filename: s, versionNumber };
    })
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];
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
      const terms = dataPath.split(`/`);
      const ns = terms.pop();

      // find the schema that our data supposedly conforms to
      const schema = findSchema(terms.join(`/`), ns);
      const schemaPath = `${terms.join(`/`)}/${schema.filename}`;

      debug(
        `loading namespace [${namespace}] using the schema from [${schemaPath}]`
      );

      // do we need to load a schema?
      if (fs.existsSync(schemaPath)) {
        // check to make sure the schemas match
        this.schema = loadSchema(schemaPath);

        if (this.schema && schema) {
          const same = equals(this.schema, schema, true, true);
          if (!same) {
            console.error(`Schema mismatch for ${namespace}!`);
            this.schema = undefined;
            // ...and then do something...
          }
        }
      }

      // do we need to write a schema?
      else {
        if (schema) {
          fs.writeFileSync(
            schemaPath,
            JSON.stringify(schema, false, 2),
            `utf-8`
          );
          this.schema = schema;
        }
      }

      if (this.schema) {
        this.schemaValidator = createValidator(this.schema);
      }
    }

    return this;
  }

  migrate(newShema) {}

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
      const { name, id } = this.schema.__meta;
      debug(`validating against [${name} ${id}]`);
      const { passed, errors } = this.schemaValidator(data);
      if (!passed) {
        console.error(errors);
        throw new Error(
          `Data for ${key} does not conform to schema [${name} ${id}]!`
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
        console.error(errors);
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

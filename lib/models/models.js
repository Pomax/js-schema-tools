import fs from "fs";

import {
  MODEL_SCHEMA,
  instantiateModel,
  recordModelClass,
} from "./model-store.js";
import { setDataFrom } from "./utils.js";
import { Model } from "./model.js";
import { Fields } from "./fields.js";

/**
 *
 */
class Models {
  static fields = Fields;

  // used by save/load functions.
  static storePath = false;

  /**
   * Used by save/load functions.
   */
  static setStoreLocation = function (storePath) {
    this.storePath = storePath;
    return this;
  };

  /**
   * register all model classes so that we know whether or not
   * they still match their previously stored schema. If not,
   * this will throw and you should run a schema migration before
   * your model-related code will run without errors.
   */
  static register(...models) {
    if (!this.storePath) {
      throw new Error(
        `Please issue Models.setStoreLocation(<path string>) before registering models.`
      );
    }
    models.forEach((Model) => recordModelClass(Model));
  }

  /**
   * Create a model instance, making sure its schema is known.
   */
  static create = function (Model, data = undefined, storePath = Models.storePath) {
    const model = instantiateModel(Model, storePath);
    if (data !== undefined) setDataFrom(data, model);
    return model;
  };

  /**
   * Load a model from file (i.e. create a model, then assign values to it based on
   * stored data. We do it in this order to ensure data validation runs)
   */
  static load = function (Model, recordName, storePath = Models.storePath) {
    recordModelClass(Model, storePath);
    const { name } = Model;
    const schema = MODEL_SCHEMA[name];

    // Preallocate our data variable, and see if we can assign and use it.
    // Which can fail. In quite a few ways. All of them will throw =)
    let fileData = undefined;

    if (recordName) {
      const filepath = `${storePath}/${schema.__meta.name}/${recordName}.json`;

      // Can we read this file?
      try {
        fileData = fs.readFileSync(filepath);
      } catch (e) {
        throw new Error(`Could not read file ${filepath}.`);
      }

      // Can we *parse* this file?
      try {
        fileData = JSON.parse(fileData);
      } catch (e) {
        throw new Error(`Could not parse ${filepath}.`);
      }

      // The final test is whether the data is schema-compliant,
      // which is tested during create(), which throws is it's not.
    }

    try {
      return this.create(Model, fileData, storePath);
    } catch (e) {
      // And this is where things get interesting: schema mismatch, what do we do?
      console.error(
        `Data for stored record ${recordName} is not schema-conformant.`
      );
      throw e;
    }
  };

  /**
   * Save a model to file, but skip any default values because models are
   * bootstrapped with the model's default values before data gets loaded in.
   */
  static saveModel = function (
    instance,
    filename = undefined,
    removeDefaults = true
  ) {
    const storePath = instance.storePath ?? Models.storePath;
    const name = instance.__proto__.constructor.name;
    const schema = MODEL_SCHEMA[name];

    if (filename === undefined) {
      const indicator = schema.__meta.filename;
      if (!indicator) {
        throw new Error(
          `Models can only be saved with an explicit filename, or if their schema has a .__meta.filename key set.`
        );
      }

      // traverse the instance object to find the key whose value should act as filename
      filename = instance;
      const terms = indicator.split(`.`);
      let t;
      while ((t = terms.shift())) filename = filename[t];
    }

    const filepath = `${storePath}/${schema.__meta.name}/${filename}.json`;

    if (removeDefaults) {
      instance = instance.removeDefaults();
    }

    fs.writeFileSync(filepath, instance.toString());
  };
}

export { Model, Models };

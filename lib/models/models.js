import fs from "fs";

import {
  MODEL_SCHEMA,
  instantiateModel,
  recordModelClass,
} from "./model-store.js";
import { setDataFrom } from "./utils.js";
import { Fields } from "./fields.js";
import { validate } from "../schema/basic-js-schema.js";

/**
 *
 */
export class Models {

  static fields = Fields;

  // used by save/load functions.
  static storePath = false;

  /**
   * Used by save/load functions.
   */
  static setStorePath = function (storePath) {
    this.storePath = storePath;
    return this;
  };

  static verifyStorePath() {
    if (!this.storePath) {
      throw new Error(
        `Please issue Models.setStorePath(<path string>) before registering models.`
      );
    }
  }

  /**
   * register all model classes so that we know whether or not
   * they still match their previously stored schema. If not,
   * this will throw and you should run a schema migration before
   * your model-related code will run without errors.
   */
  static register(...models) {
    this.verifyStorePath();
    models.forEach((Model) => recordModelClass(Model));
  }

  /**
   * Create a model instance, making sure its schema is known.
   */
  static create = function (
    Model,
    data = undefined,
    storePath = Models.storePath
  ) {
    this.verifyStorePath();
    const instance = instantiateModel(Model, storePath);
    const { name, schema } = Model;

    // Assign this model's initial data. This will throw if any values do not
    // conform to the model's schema.
    if (data !== undefined) setDataFrom(data, instance);

    // Then, post-validate the instance.
    const result = validate(schema, instance, false);
    if (!result.passed) {
      const err = new Error(
        `Cannot create ${name}: missing required fields (without schema-defined default).`
      );
      err.errors = result.errors;
      throw err;
    }

    return instance;
  };

  /**
   * Load a model from file (i.e. create a model, then assign values to it based on
   * stored data. We do it in this order to ensure data validation runs)
   */
  static load = function (Model, recordName, storePath = Models.storePath) {
    this.verifyStorePath();
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
    removeDefaults = true,
    storePath = Models.storePath
  ) {
    this.verifyStorePath();
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

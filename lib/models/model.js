import { Models } from "./models.js";
import { setDataFrom, sortedObjectKeys, removeModelDefaults } from "./utils.js";
import { validate } from "../schema/basic-js-schema.js";
import * as html from "../schema/forms/create-html.js";
import * as tree from "../schema/forms/create-tree.js";

/**
 * For the most part this is initially a js-schema object,
 * which gets transformed into a validation-controlled
 * data object.
 *
 * This conversion has to happen after the constructor
 * finishes, which means we can't do this as part of the
 * Model class's constructor, because that finishes before
 * the full class hierarchy instantiation has finished.
 *
 * As such, you never want to instantiate a model manually,
 * and always want to use either Models.create, or Models.load
 */
export class Model {
  /**
   * Create an instance of this model, with an optional
   * data object that will be used to bootstrap the model's
   * fields.
   *
   * Note that this data must be schema-conformant or the
   * create function will throw.
   *
   * @param {*} data
   * @returns
   * @throws
   */
  static create = function (data = undefined) {
    return Models.create(this, data);
  };

  /**
   * Load a stored record that uses this model.
   *
   * Note that this will throw if:
   *
   *  - there is no stored record to load
   *  - the stored record is not valid JSON
   *  - the stored record is not schema-conformant
   *
   * The storeLocation parameter is optional, but
   * if unspecified, you need to have called the
   * Models.setStoreLocation() function already,
   * to ensure there is a globally known store
   * location from which to load models.
   *
   * @param {*} recordName
   * @param {*} storeLocation
   * @returns
   * @throws
   */
  static load = function (recordName, storeLocation = undefined) {
    return Models.load(this, recordName, storeLocation);
  };

  /**
   * Save this model to file, either by explicitly specifying
   * a filename, or by relying on the Model's __meta.filename
   * attribute, which must indicate which key path to use as
   * "primary key" equivalent.
   *
   * Note that the filename is just the name, without any
   * directory or extension information. The directory will
   * be automatically determined based on the model name,
   * and all models are saved as json, using the .json extension.
   *
   * @param {*} filename
   * @param {*} removeDefaults
   * @returns
   */
  save(filename = undefined, removeDefaults = true) {
    return Models.saveModel(this, filename, removeDefaults);
  }

  /**
   * Get a derived model instance with all key:value pairs
   * that match the schema defaults removed. Since loading
   * a model always yields a fully specified model with all
   * values initialised to their defaults, there is no reason
   * to save default values. The schema-conformance mechanism
   * will make sure that data is what it should be.
   *
   * @returns Model instance with default values removed
   * @throws
   */
  removeDefaults() {
    return removeModelDefaults(this);
  }

  // Form builders: plain HTML

  /**
   * Generate a <form> element for viewing/updating this model
   *
   * @param {*} options
   * @returns
   */
  toHTMLForm(options) {
    const schema = this.__proto__.constructor.schema;
    return html.createFormHTML(schema, this, options);
  }

  /**
   * Generate a <table> with form fields for this model.
   *
   * @param {*} options
   * @returns
   */
  toHTMLTable(options) {
    const schema = this.__proto__.constructor.schema;
    return html.createTableHTML(schema, this, options);
  }

  /**
   * Geneate an array of <tr> elements with form fields for this model.
   *
   * @param {*} options
   * @returns
   */
  toHTMLTableRows(options) {
    const schema = this.__proto__.constructor.schema;
    return html.createTableRowHTML(schema, this, options);
  }

  // Form builders: Tree based data

  /**
   * Generate a node tree for working with this model's data
   * in some non-HTML context. By default, this yields the
   * (P)React equivalent of a <form>, with options.onSubmit
   * being used for submission handling.
   *
   * @param {*} options
   * @returns
   */
  toTreeForm(options = {}) {
    const schema = this.__proto__.constructor.schema;
    return tree.createFormTree(schema, this, options);
  }

  /**
   * Generate a node tree for working with this model's data
   * in some non-HTML context. By default, this yields the
   * (P)React equivalent of a <table> for templating into a
   * component render.
   *
   * @param {*} options
   * @returns
   */
  toTreeTable(options = {}) {
    const schema = this.__proto__.constructor.schema;
    return tree.createTableTree(schema, this, options);
  }

  /**
   * Generate an array of table rows for working with this
   * model's data in some non-HTML context. By default, this
   * yields an array of the (P)React equivalent of <tr>,
   * for templating into a component render.
   *
   * @param {*} options
   * @returns
   */
  toTreeForm(options = {}) {
    const schema = this.__proto__.constructor.schema;
    return tree.createTableTreeRows(schema, this, options);
  }

  // Update this model from a (form) submission

  /**
   * Update this model from a form submission, or any data payload
   * that encodes the model data using a flat <keypath>:<string>
   * format, e.g. a format which encodes this object:
   *
   *    {
   *      prop1: val1,
   *      prop2: {
   *        prop3: val2,
   *        prop4: {
   *          prop5: val3
   *        }
   *      }
   *    }
   *
   * as this flat object:
   *
   *   {
   *     "prop1": "val1",
   *     "prop2.prop3": "val2",
   *     "prop2.prop4.prop5": "val3",
   *   }
   *
   * @param {*} data
   * @returns
   */
  updateFromSubmission(data) {
    const Model = this.__proto__.constructor;
    const schema = Model.schema;
    const strictValidation = false; // we want the data to be coerced during validation
    const result = validate(schema, data, strictValidation);
    if (result.passed) return setDataFrom(data, this);

    // If we get here, there were problems, so let's be super clear about that and throw.
    const msg = `Submitted data did not pass validation for ${Model.name} schema`;
    const err = new Error(msg);
    err.errors = result.errors;
    throw err;
  }

  valueOf() {
    return JSON.parse(JSON.stringify(this));
  }

  toString() {
    return JSON.stringify(this, sortedObjectKeys, 2);
  }
}

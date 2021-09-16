import { setDataFrom } from "./utils.js";

/**
 * Generate correctly typed model fields, in the sense
 * that they are of a form that js-schema can work with.
 */
class ModelField {
  constructor(options = {}) {
    const dflt = options.default;
    const { type, choices, shape, ...rest } = options;
    delete rest.default;

    this.__meta = {};
    if (shape?.__meta) {
      this.__meta = shape.__meta;
      delete shape.__meta;
    }
    setDataFrom(rest, this.__meta);

    if (type !== undefined) this.type = type;
    if (dflt !== undefined) this.default = dflt;
    if (choices !== undefined) this.choices = choices;
    if (shape !== undefined) this.shape = shape;
  }
}

/**
 * Static field builder
 */
export class Fields {
  static boolean = function (options = {}) {
    return new ModelField({ type: `boolean`, ...options });
  };

  static string = function (options = {}) {
    return new ModelField({ type: `string`, ...options });
  };

  static number = function (options = {}) {
    return new ModelField({ type: `number`, ...options });
  };

  static model = function (model) {
    return new ModelField({ shape: model });
  };
}

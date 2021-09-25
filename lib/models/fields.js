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
    const type = `string`;
    testChoiceDefault(type, options);
    return new ModelField({ type, ...options });
  };

  static number = function (options = {}) {
    const type = `number`;
    testChoiceDefault(type, options);
    return new ModelField({ type, ...options });
  };

  static model = function (model) {
    return new ModelField({ shape: model });
  };
}

function testChoiceDefault(type, options) {
  const v = options.default;
  if (v !== undefined && options.choices) {
    if (typeof v !== type && !options.choices.includes(v)) {
      throw new Error(`Cannot declare ${type} field with non-${type} value unless that value is exists in options.choices`);
    }
  }
}

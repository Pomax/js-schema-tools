import labelFunction from "./label-function.js";
import { getCreateFunction, __appendChildNode } from "./tree-helpers.js";

/**
 * similar to createFormHTML, except we're not building an HTML string,
 * we're building DOM or (P)React content.
 */
export function createFormTree(schema, object, options) {
  const create = getCreateFunction(options);

  const root = create(`form`, {
    id: schema.__meta.name,
    onSubmit: options.onSubmit,
    children: [
      ...createFormTreeComponents(schema, object, options),
      options.footer,
    ],
  });

  return root;
}

function createFormTreeComponents(schema, object, options) {
  const create = getCreateFunction(options);
  const label = options.label ?? labelFunction;

  return Object.keys(schema)
    .filter((v) => v !== `__meta`)
    .map((field_name) => {
      const ref = object[field_name];
      const schemaEntry = schema[field_name];
      const { type, choices, shape } = schemaEntry;
      const { required, debug, configurable, description } = schemaEntry.__meta;

      if (configurable === false) return;
      if (debug === true && options.skipDebug !== false) return;

      const id = `${
        schema.__meta.prefix ? `${schema.__meta.prefix}.` : ``
      }${field_name}`;

      if (shape) {
        if (!shape.__meta) {
          shape.__meta = {};
        }
        shape.__meta.prefix = id;
        // DIFF COMPARED TO createTableTreeRows STARTS HERE
        return create(`fieldset`, {
          id: id,
          children: [createFormTree(shape, ref, { create, label })],
        });
      }

      const children = [create(`label`, { children: [label(field_name)] })];

      __appendChildNode(
        children,
        create,
        id,
        choices,
        type,
        ref,
        required,
        options.disabled,
        options.inputHandler
      );

      children.push(create(`p`, { children: [description] }));

      const div = create(`div`, { children });

      // END DIFF
      return div;
    })
    .filter(Boolean);
}

export function createTableTree(schema, object, options) {
  const create = getCreateFunction(options);
  return create(`table`, {
    id: schema.__meta?.name,
    children: [...createTableTreeRows(schema, object, options), options.footer],
  });
}

export function createTableTreeRows(schema, object, options) {
  const create = getCreateFunction(options);
  const label = options.label ?? labelFunction;

  return Object.keys(schema)
    .filter((v) => v !== `__meta`)
    .map((field_name) => {
      const ref = object ? object[field_name] : undefined;
      const schemaEntry = schema[field_name];
      const { type, choices, shape } = schemaEntry;
      const { required, debug, configurable, description } = schemaEntry.__meta;

      if (configurable === false) return;
      if (debug === true && options.skipDebug !== false) return;

      const id = `${
        schema.__meta?.prefix ? `${schema.__meta.prefix}.` : ``
      }${field_name}`;

      if (shape) {
        if (!shape.__meta) {
          shape.__meta = {};
        }
        shape.__meta.prefix = id;
        return createTableTreeRows(shape, ref, {
          ...options,
          create,
        });
      }

      const row = create(`tr`, {
        children: [
          create(`td`, { title: description, children: [label(field_name)] }),
          create(`td`, {
            children: __appendChildNode(
              [],
              create,
              id,
              choices,
              type,
              ref !== undefined ? ref : schemaEntry.default,
              required,
              options.disabled,
              options.inputHandler
            ),
          }),
        ],
      });

      return row;
    })
    .filter(Boolean);
}

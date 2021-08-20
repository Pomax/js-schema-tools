import {
  loadSchema,
  // validation
  validate,
  createValidator,
  // Migrations
  makeMigration,
  migrate,
} from "../basic-js-schema.js";

import { createFormHTML, createTableRowHTML } from "../lib/schema/webui/create-html.js";
import { createFormTree } from "../lib/schema/webui/create-tree.js";

import { Store } from "../../store/json-data-store.js";
import { config_schema, default_config } from "./test/config-schema.js";

/*
const strict = false;
const validator = createValidator(config_schema, strict);
const errors = validator(default_config);
console.log(errors);

let configHTML = createFormHTML(config_schema, default_config, {
    formAction: "javascript:void(0)",
    submitLabel: "Save",
});
// console.log(configHTML);


configHTML = createTableRowHTML(config_schema, default_config);
// console.log(configHTML);


const configTree = createFormTree(config_schema, default_config, {
    create: (tag, props) => ({ tag, ...props }),
});
// console.log(configTree);

*/

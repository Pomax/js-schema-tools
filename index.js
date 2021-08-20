import * as diff from "./lib/diff/diff.js";
import * as equals from "./lib/equals/equals.js";
import * as schema from "./lib/schema/basic-js-schema.js";
import * as store from "./lib/store/json-data-store.js";

import * as html from "./lib/schema/forms/create-html.js";
import * as tree from "./lib/schema/forms/create-tree.js";

const TOOLS = { diff, equals, schema, store, forms: { html, tree } };

export default TOOLS;

import * as diff from "./lib/diff/diff.js";
import * as equals from "./lib/equals/equals.js";
import * as schema from "./lib/schema/basic-js-schema.js";
import * as models from "./lib/models/models.js";

import * as html from "./lib/schema/forms/create-html.js";
import * as tree from "./lib/schema/forms/create-tree.js";
import labelFunction from "./lib/schema/forms/label-function.js";

const forms = { html, tree, labelFunction };

export { diff, equals, schema, models, forms };

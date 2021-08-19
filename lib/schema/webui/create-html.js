import {
  createFormTree,
  createTableTree,
  createTableTreeRows,
} from "./create-tree.js";

import { document, htmlProps } from "./fake-dom/document.js";

function create(tag, props) {
  const element = document.createElement(tag);
  if (props.children) {
    props.children.forEach((c) => element.appendChild(c));
  }
  htmlProps.forEach((prop) => {
    if (props[prop] !== undefined) {
      element[prop] = props[prop];
    }
  });
  return element;
}

/**
 * create the <form> code for updating a schema-conformal object
 */
export function createFormHTML(schema, object, options = {}) {
  return createFormTree(schema, object, { create, ...options }).outerHTML;
}

/**
 * For when you need table content, not a form. Note that nesting
 * is not preserved using this call because you don't nest tables.
 */
export function createTableHTML(schema, object, options = {}) {
  return createTableTree(schema, object, { create, ...options }).outerHTML;
}

/**
 * For when you need table row content only.
 */
export function createTableRowHTML(schema, object, options = {}) {
  return createTableTreeRows(schema, object, { create, ...options })
    .map((tr) => tr.outerHTML)
    .join(`\n`);
}

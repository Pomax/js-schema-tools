const htmlProps = [
  `id`,
  `name`,
  `class`,
  `title`,
  `alt`,
  `value`,
  `src`,
  `href`,
  `placeholder`,
  `disabled`,
  `selected`,
];

class HTMLElement {
  constructor(tag) {
    this.tag = tag;
    this.attributes = [];
    this.children = [];
  }
  setAttribute(name, value) {
    this.attributes.push([name, value]);
  }
  appendChild(element) {
    this.children.push(element);
  }
  get innerHTML() {
    return this.children
      .filter(Boolean)
      .map((e) => (e instanceof HTMLElement ? e.outerHTML : e))
      .join(`\n`);
  }
  get outerHTML() {
    const { tag, attributes } = this;
    let attrs = Object.entries(attributes)
      .map(([key, value]) => `${key}=${value}`)
      .join(` `);
    htmlProps.forEach((prop) => {
      const val = this[prop];
      if (val !== undefined) {
        attrs = `${attrs} ${prop}="${val}"`;
      }
    });
    attrs = attrs.trim();
    const inner = this.innerHTML;
    return `<${tag}${attrs ? ` ${attrs}` : ``}>${
      inner ? `\n${this.innerHTML}\n` : ``
    }</${tag}>`;
  }
}

class Document {
  constructor() {
    this.body = new HTMLElement(`body`);
  }
  createElement(tag) {
    return new HTMLElement(tag);
  }
}

const document = new Document();

export { document, htmlProps };

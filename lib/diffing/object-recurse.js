import { distance } from "./fastest-levenshtein/index.js";

function iterable(v) {
  if (v instanceof String) return false;
  return !!v.__proto__.constructor?.prototype[Symbol.iterator];
}

function primitiveForHashing(v) {
  if (typeof v === `boolean`) return true;
  if (typeof v === `number`) return true;
  if (typeof v === `bigint`) return true;
  if (typeof v === `string` || v instanceof String) return true;
  if (iterable(v)) return true;
  return false;
}

export function findSubtree(t1, t2) {
  const subtree = t1;
  const tree = t2;
  const roots = getRoots("", tree);
  const matches = roots.map((node) => computeMatch(node, subtree));
  return matches.sort((a, b) => a.match - b.match)[0];
}

function getRoots(prop, tree, nodes = []) {
  if (!!prop) nodes.push([prop, tree]);
  Object.entries(tree).forEach(([k, v]) => {
    if (!primitiveForHashing(v)) {
      getRoots(`${prop}.${k}`, v, nodes);
    }
  });
  return nodes;
}

function computeMatch(node, subtree) {
  const nodeString = JSON.stringify(node[1]);
  const subtreeString = JSON.stringify(subtree);
  const match = distance(subtreeString, nodeString);
  return { node, match };
}

/*
findSubtree(
  // subtree
  {
    best_cake: {
      cake: "lol2",
    }
  },
  // full tree
  {
    cake: "lol",
    moreCake: {
      cake: "lol",
    },
    wall_hack: {
      who: "is",
      cake: "lol",
      more_cake: {
        cake: "lol2",
      },
    },
  }
);
*/

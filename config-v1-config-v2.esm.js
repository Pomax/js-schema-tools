import fs from "fs";

const filename = process.argv[2];

let data = fs.readFileSync(filename);
if (!fs.existsSync(filename)) {
  console.error(`Could not find ${filename}`);
  process.exit(1);
}
data = data.toString("utf-8");

const operations = JSON.parse(`[{"type":"remove","key":"ruleset","stable":false,"value":{"__meta":{"description":"The ruleset to use to score a game.","icon":"📜"},"type":"string","choices":["Cantonese","Chinese Classical","Chinese Classical for Bots"],"default":"Chinese Classical"},"valueHash":"98e5804f04901d5d19c158dc59092c52","fn":"removeRuleset","rollback":"rollbackRuleset"},{"type":"rename","oldKey":"wallhack","newKey":"wallhack2","fn":"renameWallhackWallhack2","rollback":"rollbackWallhackWallhack2"},{"type":"update","key":"__meta.id","oldValue":"v1","newValue":"v2","fn":"updateMetaId","rollback":"rollbackMetaId"},{"type":"update","key":"nested_property.shape.name.default","oldValue":"alice","newValue":"carol","fn":"updateNestedPropertyShapeNameDefault","rollback":"rollbackNestedPropertyShapeNameDefault"},{"type":"add","key":"wind_rotation.__meta.required","value":true,"fn":"addWindRotationMetaRequired","rollback":"rollbackWindRotationMetaRequired"},{"type":"update","key":"wind_rotation.choices","oldValue":[-1,1],"newValue":[0,1,2,3],"fn":"updateWindRotationChoices","rollback":"rollbackWindRotationChoices"},{"type":"move","oldKey":"movable_nested_property","newKey":"updated_property.shape.test_nested_move","fn":"moveMovableNestedPropertyToUpdatedPropertyShapeTestNestedMove","rollback":"rollbackMovableNestedPropertyToUpdatedPropertyShapeTestNestedMove"}]`);

const activeKey = (key, type) => true;

const filterKeyString = key => key;

const getObjectLevel = function getObjectLevel(object, key, filterKeyString) {
  key = filterKeyString(key);
  const nesting = key.split(`.`);
  const propName = nesting.pop();
  let level = object;
  while (nesting.length > 0) {
    let term = nesting.shift();
    if (level[term] === undefined) level[term] = {};
    level = level[term];
  }
  return { level: level ?? object, propName };
};

const schemaChangeHandler = function change_handler(object, operation) {
    const { type, key, value, fn, rollback } = operation;
    if (type === `add` && activeKey(key, type)) {
      const { level, propName } = getObjectLevel(object, key, filterKeyString);
      level[propName] = value;
      // then call the add hook
    }
    if (type === `remove` && activeKey(key, type)) {
      const { level, propName } = getObjectLevel(object, key, filterKeyString);
      delete level[propName];
      // then call the remove hook
    }
    if (type === `update` && activeKey(key, type)) {
      const { level, propName } = getObjectLevel(object, key, filterKeyString);
      const { oldValue, newValue, rollback } = operation;
      level[propName] = newValue;
      // then call the update hook
    }
    if (type === `move` || type === `rename`) {
      const { oldKey, newKey } = operation;
      const oldPosition = getObjectLevel(object, oldKey, filterKeyString);
      const newPosition = getObjectLevel(object, newKey, filterKeyString);
      newPosition.level[newPosition.propName] =
        oldPosition.level[oldPosition.propName];
      delete oldPosition.level[oldPosition.propName];
      // then call the move hook or rename hook
    }
  };

schemaChangeHandler.removeRuleset = function (data, op) {
  // Your code goes here
};

schemaChangeHandler.renameWallhackWallhack2 = function (data, op) {
  // Your code goes here
};

schemaChangeHandler.updateMetaId = function (data, op) {
  // Your code goes here
};

schemaChangeHandler.updateNestedPropertyShapeNameDefault = function (data, op) {
  // Your code goes here
};

schemaChangeHandler.addWindRotationMetaRequired = function (data, op) {
  // Your code goes here
};

schemaChangeHandler.updateWindRotationChoices = function (data, op) {
  // Your code goes here
};

schemaChangeHandler.moveMovableNestedPropertyToUpdatedPropertyShapeTestNestedMove = function (data, op) {
  // Your code goes here
};

function applyDiff(
  changeOperations,
  object,
  changeHandler = schemaChangeHandler
) {
  changeOperations.forEach((operation) => {
    changeHandler(object, operation);
    if (changeHandler[operation.fn] !== undefined) {
      changeHandler[operation.fn](object, operation);
    }
  });
  return object;
}

const updated = applyDiff(operations, data, schemaChangeHandler);

console.log(updated);

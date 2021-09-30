const testIf = (condition, ...args) => {
  if (condition) return test(...args);
  return test.skip(...args);
};

describe(`a mix of tests and conditional tests`, () => {
  test(`this will always run`, () => {
    expect("1").toBe("1");
  });

  testIf(Math.random() > 0.5, `this will only run half the time`, () => {
    console.log(`running`);
    expect("2").toBe("2");
  });
});

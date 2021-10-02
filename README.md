### Testing

Due to dynamic imports, Jest tests cannot run "as a single suite" based on a target dir.
Instead, every test has its own npm script, with `npm-run-all` being used to run them sequentially.
See https://github.com/facebook/jest/issues/11438#issuecomment-923835189 for more details


### NOTES

- define a model to work with, using simple JS class syntax
- automatic schema-backing and validation

- tell the model manager which storage system to use (required)
- Either create new models, or load them from storage
- values are automatically validated during creation/assignment
- simple save mechanism (data is by definition valid, default values are not stored)

- [TASK] come up with a way to say "read-only" in addition to "configurable" (for form purposes)

- [TESTING] add form tests
- [TESTING] add diff tests
- [TESTING] add equals tests?
- [TESTING] add schema tests
- [TESTING] add conformance tests

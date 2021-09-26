- define a model to work with, using simple JS class syntax
- automatic schema-backing and validation

- tell the model manager which storage system to use (required)
- Either create new models, or load them from storage
- values are automatically validated during creation/assignment
- simple save mechanism (data is by definition valid, default values are not stored)


- [TEST] successive migrations should use successive files.
- [BUG] for compound schema, only migrate the one(s) that changed, and create a migration that covers "all schema".

- restructure:
    - Model (instance)
        - Models (factory)
            - Fields

    - Schema (utils for working with schema objects)
        - conformance
        - diffing
        - migrations

    - Store (fs based)
        - save/load models
        - save/load schemas

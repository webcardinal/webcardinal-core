# webc-component



<!-- Auto Generated Below -->


## Properties

| Property              | Attribute              | Description                                                                                                                                                                                          | Type          | Default     |
| --------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------- |
| `controller`          | `controller`           | This property is a string that will permit the developer to choose his own controller. If no value is set then the null default value will be taken and the component will use the basic Controller. | `string`      | `''`        |
| `disableTranslations` | `disable-translations` | If this flag is specified, when translations are enabled, it will disable binding and loading of translations.                                                                                       | `boolean`     | `false`     |
| `element`             | --                     | The reference to actual CustomElement / Component that is created.                                                                                                                                   | `HTMLElement` | `undefined` |
| `template`            | `template`             | The name of the template that will be loaded. The generated path will have the format <code>${basePath + skinPath}/elements/${template}.html</code>.                                                 | `string`      | `undefined` |


## Events

| Event                              | Description                                           | Type               |
| ---------------------------------- | ----------------------------------------------------- | ------------------ |
| `webcardinal:model:get`            | Through this event the model is received.             | `CustomEvent<any>` |
| `webcardinal:translationModel:get` | Through this event the translation model is received. | `CustomEvent<any>` |


## Methods

### `getModel() => Promise<any>`

The model from controller is exposed by this method.

#### Returns

Type: `Promise<any>`



### `getTranslationModel() => Promise<any>`

The translation model from controller is exposed by this method.

#### Returns

Type: `Promise<any>`




## Dependencies

### Used by

 - [webc-app-root](../webc-app/webc-app-root)

### Depends on

- [webc-container](../webc-container)

### Graph
```mermaid
graph TD;
  webc-component --> webc-container
  webc-app-root --> webc-component
  style webc-component fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

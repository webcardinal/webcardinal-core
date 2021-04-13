# webc-template



<!-- Auto Generated Below -->


## Properties

| Property           | Attribute           | Description                                                                                                                                                                                                               | Type      | Default     |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `disableContainer` | `disable-container` | If it is not specified, all the markup coming <code>template</code> attribute will be placed inside innerHTML after the unnamed slot. Otherwise the content will replace the <code>webc-template</code> element form DOM. | `boolean` | `false`     |
| `template`         | `template`          | The name of the template that will be loaded. The generated path will have the format <code>${basePath + skinPath}/templates/${template}.html</code>.                                                                     | `string`  | `undefined` |
| `translations`     | `translations`      | If this flag is set it will override the <strong>translations</strong> from <code>webcardinal.json</code>.                                                                                                                | `boolean` | `false`     |


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




----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

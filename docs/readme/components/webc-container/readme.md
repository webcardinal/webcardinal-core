# webc-container



<!-- Auto Generated Below -->


## Properties

| Property           | Attribute           | Description                                                                                                                                                                                          | Type      | Default |
| ------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `controller`       | `controller`        | This property is a string that will permit the developer to choose his own controller. If no value is set then the null default value will be taken and the component will use the basic Controller. | `string`  | `''`    |
| `disableContainer` | `disable-container` | If it is not specified, all the innerHTML will be placed inside the unnamed slot. Otherwise the content will replace the <code>webc-container</code> element form DOM.                               | `boolean` | `false` |


## Events

| Event                              | Description                                           | Type               |
| ---------------------------------- | ----------------------------------------------------- | ------------------ |
| `webcardinal:model:get`            | Through this event the model is received.             | `CustomEvent<any>` |
| `webcardinal:parentChain:get`      |                                                       | `CustomEvent<any>` |
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

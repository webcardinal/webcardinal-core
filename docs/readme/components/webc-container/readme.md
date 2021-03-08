# webc-container



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute             | Description                                                                                                                                                                                          | Type            | Default     |
| -------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------- |
| `controllerName`     | `controller`          | This property is a string that will permit the developer to choose his own controller. If no value is set then the null default value will be taken and the component will use the basic Controller. | `string`        | `undefined` |
| `enableTranslations` | `enable-translations` | If this property is true, internationalization (i18n) will be enabled.                                                                                                                               | `boolean`       | `false`     |
| `history`            | --                    |                                                                                                                                                                                                      | `RouterHistory` | `undefined` |


## Events

| Event                     | Description                                                       | Type               |
| ------------------------- | ----------------------------------------------------------------- | ------------------ |
| `webcardinal:routing:get` | Routing configuration received from <code>webc-app-router</code>. | `CustomEvent<any>` |


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

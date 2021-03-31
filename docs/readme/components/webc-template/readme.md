# webc-template



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute             | Description                                                                                                                                                                                                               | Type      | Default     |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `chain`              | `data-model`          |                                                                                                                                                                                                                           | `string`  | `''`        |
| `disableContainer`   | `disable-container`   | If it is not specified, all the markup coming <code>template</code> attribute will be placed inside innerHTML after the unnamed slot. Otherwise the content will replace the <code>webc-template</code> element form DOM. | `boolean` | `false`     |
| `enableTranslations` | `enable-translations` |                                                                                                                                                                                                                           | `boolean` | `false`     |
| `templateName`       | `template`            | The name of the template that will be loaded. The generated path will have the format <code>${basePath}/templates/${templateName}.html</code>.                                                                            | `string`  | `undefined` |


## Events

| Event                                | Description                                                                                                                | Type               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `webcardinal:config:getTranslations` | Enable translations event received from configuration.                                                                     | `CustomEvent<any>` |
| `webcardinal:model:get`              | Through this event model is received (from webc-container, webc-for, webc-if or any component that supports a controller). | `CustomEvent<any>` |
| `webcardinal:translationModel:get`   | Through this event translation model is received.                                                                          | `CustomEvent<any>` |


----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

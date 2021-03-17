# webc-template



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description                                                                                                                                                                     | Type      | Default     |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `chain`          | `data-model`      |                                                                                                                                                                                 | `string`  | `''`        |
| `overrideParent` | `override-parent` | If true, parent element of webc-template will have the content of if (webc-template will disappear) Otherwise webc-template will have all the content inside hist unnamed slot. | `boolean` | `undefined` |
| `templateName`   | `template`        | The name of the template that will be loaded. The generated path will have the format <code>${basePath}/templates/${templateName}.html</code>.                                  | `string`  | `undefined` |


## Events

| Event                              | Description                                                                                                                | Type               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `webcardinal:model:get`            | Through this event model is received (from webc-container, webc-for, webc-if or any component that supports a controller). | `CustomEvent<any>` |
| `webcardinal:translationModel:get` | Through this event translation model is received.                                                                          | `CustomEvent<any>` |


----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

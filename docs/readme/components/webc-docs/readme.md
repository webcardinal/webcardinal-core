# webc-docs



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description                                                                                                                                                                                                                 | Type      | Default     |
| -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `for`    | `for`     | Component tag name (in lowercase) for which documentation is desired.                                                                                                                                                       | `string`  | `undefined` |
| `local`  | `local`   | If this prop is set to <code>true</code> the source of fetched docs for current webc-docs component must be on your local workspace. Otherwise the source is <small><code>https://raw.githubusercontent.com</code></small>. | `boolean` | `false`     |


## Events

| Event                              | Description                                                                                                                                                                                                                                                                                            | Type               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| `webcardinal:config:getDocsSource` | Gets the docs source for current component.<br> In <code>webcardinal.json</code>, if there is a key named <code>docsSource</code> with value <code>'local'</code>, all webc-docs components will be configured for local docs.<br> Default value for <code>docsSource</code> is <code>'github'</code>. | `CustomEvent<any>` |


## Slots

| Slot | Description                                                                        |
| ---- | ---------------------------------------------------------------------------------- |
|      | Content that goes immediately after "Tag" section and before "Properties" section. |


----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

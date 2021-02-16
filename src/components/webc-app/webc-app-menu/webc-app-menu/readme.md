# webc-app-menu



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute          | Description | Type            | Default            |
| ----------------- | ------------------ | ----------- | --------------- | ------------------ |
| `basePath`        | `base-path`        |             | `string`        | `''`               |
| `disableIdentity` | `disable-identity` |             | `boolean`       | `false`            |
| `history`         | --                 |             | `RouterHistory` | `undefined`        |
| `items`           | --                 |             | `any[]`         | `[]`               |
| `mode`            | `mode`             |             | `string`        | `this.defaultMode` |


## Events

| Event                           | Description | Type               |
| ------------------------------- | ----------- | ------------------ |
| `webcardinal:config:getRouting` |             | `CustomEvent<any>` |


## Dependencies

### Used by

 - [webc-app-root](../../webc-app-root)

### Depends on

- [webc-app-menu-item](../webc-app-menu-item)
- [webc-app-identity](../../webc-app-identity)

### Graph
```mermaid
graph TD;
  webc-app-menu --> webc-app-menu-item
  webc-app-menu --> webc-app-identity
  webc-app-menu-item --> webc-app-menu-item
  webc-app-menu-item --> stencil-route-link
  webc-app-root --> webc-app-menu
  style webc-app-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

# wcc-app-menu



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute          | Description | Type      | Default            |
| ----------------- | ------------------ | ----------- | --------- | ------------------ |
| `basePath`        | `base-path`        |             | `string`  | `''`               |
| `disableIdentity` | `disable-identity` |             | `boolean` | `false`            |
| `items`           | --                 |             | `any[]`   | `[]`               |
| `mode`            | `mode`             |             | `string`  | `this.defaultMode` |


## Events

| Event                           | Description | Type               |
| ------------------------------- | ----------- | ------------------ |
| `webcardinal:config:getRouting` |             | `CustomEvent<any>` |


## Dependencies

### Used by

 - [wcc-app-root](../../wcc-app-root)

### Depends on

- [wcc-app-menu-item](../wcc-app-menu-item)
- [wcc-app-identity](../../wcc-app-identity)

### Graph
```mermaid
graph TD;
  wcc-app-menu --> wcc-app-menu-item
  wcc-app-menu --> wcc-app-identity
  wcc-app-menu-item --> wcc-app-menu-item
  wcc-app-menu-item --> stencil-route-link
  wcc-app-root --> wcc-app-menu
  style wcc-app-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

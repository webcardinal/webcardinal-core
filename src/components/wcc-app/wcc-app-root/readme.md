# wcc-app-root



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute | Description | Type            | Default         |
| ------------ | --------- | ----------- | --------------- | --------------- |
| `history`    | --        |             | `RouterHistory` | `undefined`     |
| `loaderName` | `loader`  |             | `string`        | `"wcc-spinner"` |


## Events

| Event                            | Description | Type               |
| -------------------------------- | ----------- | ------------------ |
| `webcardinal:config:getLogLevel` |             | `CustomEvent<any>` |


## Dependencies

### Depends on

- [wcc-app-container](../wcc-app-container)
- [wcc-app-menu](../wcc-app-menu/wcc-app-menu)
- [wcc-app-error-toast](../wcc-app-error-toast)

### Graph
```mermaid
graph TD;
  wcc-app-root --> wcc-app-container
  wcc-app-root --> wcc-app-menu
  wcc-app-root --> wcc-app-error-toast
  wcc-app-container --> wcc-app-router
  wcc-app-router --> stencil-route
  wcc-app-router --> stencil-router
  wcc-app-router --> stencil-route-switch
  wcc-app-menu --> wcc-app-menu-item
  wcc-app-menu --> wcc-app-identity
  wcc-app-menu-item --> wcc-app-menu-item
  wcc-app-menu-item --> stencil-route-link
  style wcc-app-root fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

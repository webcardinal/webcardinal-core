# wcc-app-root



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute    | Description | Type            | Default         |
| ---------------- | ------------ | ----------- | --------------- | --------------- |
| `controllerName` | `controller` |             | `string`        | `undefined`     |
| `history`        | --           |             | `RouterHistory` | `undefined`     |
| `loaderName`     | `loader`     |             | `string`        | `'wcc-spinner'` |


## Dependencies

### Depends on

- [wcc-app-menu](../wcc-app-menu)
- [wcc-app-container](../wcc-app-container)

### Graph
```mermaid
graph TD;
  wcc-app-root --> wcc-app-menu
  wcc-app-root --> wcc-app-container
  wcc-app-menu --> wcc-app-menu-item
  wcc-app-menu-item --> wcc-app-menu-item
  wcc-app-menu-item --> stencil-route-link
  wcc-app-container --> wcc-app-router
  wcc-app-router --> stencil-route
  wcc-app-router --> stencil-router
  wcc-app-router --> stencil-route-switch
  style wcc-app-root fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

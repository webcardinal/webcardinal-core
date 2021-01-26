# wcc-app-router



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute    | Description | Type     | Default     |
| -------------- | ------------ | ----------- | -------- | ----------- |
| `basePath`     | `base-path`  |             | `string` | `''`        |
| `fallbackPage` | --           |             | `null`   | `undefined` |
| `pagesPath`    | `pages-path` |             | `string` | `''`        |
| `routes`       | --           |             | `any[]`  | `[]`        |


## Events

| Event                           | Description | Type               |
| ------------------------------- | ----------- | ------------------ |
| `webcardinal:config:getRouting` |             | `CustomEvent<any>` |


## Dependencies

### Used by

 - [wcc-app-container](../wcc-app-container)

### Depends on

- stencil-route
- stencil-router
- stencil-route-switch

### Graph
```mermaid
graph TD;
  wcc-app-router --> stencil-route
  wcc-app-router --> stencil-router
  wcc-app-router --> stencil-route-switch
  wcc-app-container --> wcc-app-router
  style wcc-app-router fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

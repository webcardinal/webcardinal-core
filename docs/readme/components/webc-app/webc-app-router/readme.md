# webc-app-router



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

 - [webc-app-container](../webc-app-container)

### Depends on

- stencil-route
- stencil-router
- stencil-route-switch

### Graph
```mermaid
graph TD;
  webc-app-router --> stencil-route
  webc-app-router --> stencil-router
  webc-app-router --> stencil-route-switch
  webc-app-container --> webc-app-router
  style webc-app-router fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

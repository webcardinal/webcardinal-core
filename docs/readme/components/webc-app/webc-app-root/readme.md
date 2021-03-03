# webc-app-root



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute | Description                                        | Type            | Default          |
| ------------ | --------- | -------------------------------------------------- | --------------- | ---------------- |
| `history`    | --        |                                                    | `RouterHistory` | `undefined`      |
| `loaderName` | `loader`  | Component tag name (in lowercase) for a UI loader. | `string`        | `'webc-spinner'` |


## Events

| Event                            | Description                                                                                              | Type               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------ |
| `webcardinal:config:getLogLevel` | LogLevel configuration is received from <code>ApplicationController</code> when this event is fired.<br> | `CustomEvent<any>` |


## Dependencies

### Depends on

- [webc-app-container](../webc-app-container)
- [webc-app-menu](../webc-app-menu/webc-app-menu)
- [webc-app-error-toast](../webc-app-error-toast)

### Graph
```mermaid
graph TD;
  webc-app-root --> webc-app-container
  webc-app-root --> webc-app-menu
  webc-app-root --> webc-app-error-toast
  webc-app-container --> webc-app-router
  webc-app-router --> stencil-route
  webc-app-router --> stencil-router
  webc-app-router --> stencil-route-switch
  webc-app-menu --> webc-app-menu-item
  webc-app-menu --> webc-app-identity
  webc-app-menu-item --> webc-app-menu-item
  webc-app-menu-item --> stencil-route-link
  style webc-app-root fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

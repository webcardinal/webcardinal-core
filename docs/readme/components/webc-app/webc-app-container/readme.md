# webc-app-container



<!-- Auto Generated Below -->


## Slots

| Slot       | Description                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
|            | Your content or if nothing, your routing point <code>webc-app-router</code>.<br>   Using this slot you can wrap all pages with a custom component; |
| `"after"`  | Place for final content.<br>         A "footer" can be easily implemented using this slot;                                                         |
| `"before"` | Content that goes behind this component in the DOM.<br>          A "header" can be easily implemented using this slot;                             |


## CSS Custom Properties

| Name           | Description                    |
| -------------- | ------------------------------ |
| `--background` | Background for all your pages. |
| `--gap`        | Gap between slots.             |


## Dependencies

### Used by

 - [webc-app-root](../webc-app-root)

### Depends on

- [webc-app-router](../webc-app-router)

### Graph
```mermaid
graph TD;
  webc-app-container --> webc-app-router
  webc-app-router --> stencil-route
  webc-app-router --> stencil-router
  webc-app-router --> stencil-route-switch
  webc-app-root --> webc-app-container
  style webc-app-container fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

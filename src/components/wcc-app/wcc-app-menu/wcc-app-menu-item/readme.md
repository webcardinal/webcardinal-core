# wcc-app-menu-item



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute   | Description | Type                               | Default                                  |
| ------------- | ----------- | ----------- | ---------------------------------- | ---------------------------------------- |
| `basePath`    | `base-path` |             | `string`                           | `''`                                     |
| `item`        | --          |             | `{ path: string; children: any; }` | `{     path: '',     children: null   }` |
| `level`       | `level`     |             | `number`                           | `0`                                      |
| `menuElement` | --          |             | `HTMLElement`                      | `null`                                   |
| `mode`        | `mode`      |             | `string`                           | `undefined`                              |
| `name`        | `name`      |             | `string`                           | `''`                                     |
| `url`         | `url`       |             | `string`                           | `null`                                   |


## Methods

### `activate() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `deactivate() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [wcc-app-menu](../wcc-app-menu)
 - [wcc-app-menu-item](.)

### Depends on

- [wcc-app-menu-item](.)
- stencil-route-link

### Graph
```mermaid
graph TD;
  wcc-app-menu-item --> wcc-app-menu-item
  wcc-app-menu --> wcc-app-menu-item
  style wcc-app-menu-item fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
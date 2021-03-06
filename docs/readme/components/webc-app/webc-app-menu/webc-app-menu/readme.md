# webc-app-menu



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute          | Description                                                                                                                                                                                                                                                                                                          | Type                                     | Default            |
| ----------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------ |
| `basePath`        | `base-path`        | There is the possibility to change the base path of your application, using <code>base</code> HTML Element: <psk-example>    <psk-code>     <base href="/my-custom-base">    </psk-code> </psk-example>  Both <code>webc-app-menu</code> and <code>webc-app-router</code> must share the same <code>basePath</code>. | `string`                                 | `''`               |
| `disableIdentity` | `disable-identity` | Decides if <code>webc-app-identity</code> is rendered.<br> This property is set by Custom Variable <code>--disable-identity</code>.                                                                                                                                                                                  | `boolean`                                | `false`            |
| `items`           | --                 | This Array is received from <code>ApplicationController</code>.                                                                                                                                                                                                                                                      | `any[]`                                  | `[]`               |
| `mode`            | `mode`             |                                                                                                                                                                                                                                                                                                                      | `"horizontal" \| "mobile" \| "vertical"` | `this.defaultMode` |


## Events

| Event                           | Description                                                                                                                                                | Type               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `webcardinal:config:getRouting` | Routing configuration received from <code>ApplicationController</code>.<br> This configuration includes different settings for pages, skins, modals, etc.; | `CustomEvent<any>` |


## CSS Custom Properties

| Name                     | Description                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `--disable-identity`     | Default value is <code>false</code>.<br> Other values: <small><code>true</code>.   |
| `--gap`                  | Space between slots.                                                               |
| `--items-gap`            | Space between <code>webc-app-menu-item</code>s.                                    |
| `--z-index Other values` | <small><code>none</code>, <code>horizontal</code> and <code>mobile</code>.</small> |


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

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

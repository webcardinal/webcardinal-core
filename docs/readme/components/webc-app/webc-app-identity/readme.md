# webc-app-identity



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description                          | Type     | Default     |
| -------- | --------- | ------------------------------------ | -------- | ----------- |
| `avatar` | `avatar`  | Path or URL to an image.             | `string` | `undefined` |
| `email`  | `email`   | Email of your brand or organization. | `string` | `undefined` |
| `name`   | `name`    | Name of your brand or organization.  | `string` | `undefined` |


## Events

| Event                            | Description                                                                                                                                      | Type               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| `webcardinal:config:getIdentity` | All properties enumerated before are automatically filled by webc-app-identity when this event is fired from <code>ApplicationController</code>. | `CustomEvent<any>` |


## CSS Custom Properties

| Name                                  | Description                                |
| ------------------------------------- | ------------------------------------------ |
| `--webc-app-identity-avatar-radius`   | Picture radius.                            |
| `--webc-app-identity-avatar-width`    | Size of the picture.                       |
| `--webc-app-identity-color`           | Color of all text elements.                |
| `--webc-app-identity-column-gap`      | Horizontal space.                          |
| `--webc-app-identity-email-font-size` | Size of font for "email".                  |
| `--webc-app-identity-name-font-size`  | Size of font for "name".                   |
| `--webc-app-identity-row-gap`         | Vertical space between "name" and "email". |


## Dependencies

### Used by

 - [webc-app-menu](../webc-app-menu/webc-app-menu)

### Graph
```mermaid
graph TD;
  webc-app-menu --> webc-app-identity
  style webc-app-identity fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

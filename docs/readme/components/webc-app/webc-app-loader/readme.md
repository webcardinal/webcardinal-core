# webc-app-loader



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description                                                                                           | Type                                                      | Default     |
| ---------------- | ------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------- |
| `basePath`       | `base-path`        | Source path is prefixed with this path.                                                               | `string`                                                  | `'/'`       |
| `isFallbackPage` | `is-fallback-page` | A webc-app-loader for a page or for a fallback page This information is required for translations     | `boolean`                                                 | `false`     |
| `loader`         | `loader`           | Fetch a HTML file and loads inside as normal children or in a wrapper.                                | `"default" \| "iframe" \| "none" \| "object" \| "parser"` | `'default'` |
| `saveState`      | `save-state`       | If this property is set, WebCardinal.state.page will be saved for current page session.               | `boolean`                                                 | `false`     |
| `skin`           | `skin`             | If a skin is set for this page, this property will be set according to <code>webcardinal.json</code>. | `string`                                                  | `'default'` |
| `src`            | `src`              | Source path for a HTML page.                                                                          | `string`                                                  | `undefined` |
| `tag`            | `tag`              | Tag of the page set in <code>webcardinal.json</code>.                                                 | `string`                                                  | `undefined` |


## Events

| Event                     | Description                                                       | Type                        |
| ------------------------- | ----------------------------------------------------------------- | --------------------------- |
| `webcardinal:routing:get` | Routing configuration received from <code>webc-app-router</code>. | `CustomEvent<RoutingState>` |


----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*

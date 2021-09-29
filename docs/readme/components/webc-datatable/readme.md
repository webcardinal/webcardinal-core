# webc-datatable



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute           | Description | Type      | Default     |
| ----------------- | ------------------- | ----------- | --------- | ----------- |
| `chain`           | `datasource`        |             | `string`  | `undefined` |
| `curentPageIndex` | `curent-page-index` |             | `number`  | `0`         |
| `dataSize`        | `data-size`         |             | `number`  | `undefined` |
| `hidePagination`  | `hide-pagination`   |             | `boolean` | `false`     |
| `pageSize`        | `page-size`         |             | `number`  | `20`        |


## Events

| Event                   | Description                               | Type               |
| ----------------------- | ----------------------------------------- | ------------------ |
| `webcardinal:model:get` | Through this event the model is received. | `CustomEvent<any>` |


## Methods

### `clearCurrentPage() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `fillCurrentPage(data: any) => Promise<void>`



#### Returns

Type: `Promise<void>`




## Slots

| Slot         | Description |
| ------------ | ----------- |
| `"-"`        |             |
| `"after -"`  |             |
| `"before -"` |             |
| `"footer -"` |             |
| `"header -"` |             |


## Shadow Parts

| Part                            | Description |
| ------------------------------- | ----------- |
| `"pagination"`                  |             |
| `"pagination-button"`           |             |
| `"pagination-button--active"`   |             |
| `"pagination-button--next"`     |             |
| `"pagination-button--previous"` |             |


## CSS Custom Properties

| Name                             | Description |
| -------------------------------- | ----------- |
| `--pagination-button-background` |             |
| `--pagination-button-border`     |             |
| `--pagination-gap`               |             |


----------------------------------------------

*Made by [WebCardinal](https://github.com/webcardinal) contributors.*
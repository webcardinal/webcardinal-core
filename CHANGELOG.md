
## 1.0.1 (2021-08-03)
#### Bug fixing:

*  clearing model change event listeners when elements are removed from **data-for** loops elements
*  fixed array removal in a nested **data-for** context
* providing parent chain for components that are responsibile of their own model binding (**webc-component**, **webc-container**, **webc-template**)
* controllers shoul have always a model, even if it is an empty object
* fixed expressions for **data-if** elements


#### Features:
* implemented a mechanism that will cleanup the model change events handlers when controllers are destroyed or no strong references on them are available 
* added css variables for width and max-width in **webc-modal**

# Getting Started

### Important Notice
In the upcoming months, we are planning to change the IDs of, line items, metrics, fields, components, datatables, assemblies, component groups, and field groups. The IDs will switch to an alpha-numerical format. Project and Bid IDs are expected to remain as an integer and unchanged. All legacy bid data in our system will be updated. Breaking changes will be minimal, but are expected.

### Concepts
A [Project] contains multiple [Bids] and summations of the bid results. Projects also have statuses (ie. open/closed/win/loss), and can have assigned users.

[Bids] are self-contained, self-assessing instances that have many types of bid entities. [Line Items], [Metrics], [Fields], [Assemblies], and [Components] are the most common. A bid sums up the line items' values.

A [Line Item] is a bid entity that represents a specific cost. The line item contain basic information like cost, markup, tax, and price. Line items compute their values based on the fields, metrics, and other bid entities it depends on.

[Metrics] are another type of bid entity the represent only numerical values. Metrics can be configured to depend on any other bid entity and apply a mathmatical formula.

[Fields] have multiple type of inputs: number, boolean, list, and text. They are the primary way to manipulate a bid, though other bid entities can have their values overridden.

[Components] help organize line items in a nested format.  Components sum the nested line items' values. Changing a component value, for example `component.cost = 5000.00`, will proportionally apply the value to the nested line items.

An [Assembly] is a special type of bid entity, that represents a package of Fields, Line Items, and Metrics. Assemblies can be inserted into a bid, adding new bid entities.

[Datatables] are simple object stores, typically used for pricing tables and other structured data.  [Fields] can reference datatables to generate a selectable list with associated values.


### Code Examples
The following demonstrates how to set up an authorized context, loading a project, making changes, and saving.

**Create a context with an authorization token**
```javascript
const config = { token: "Bearer auth_token" };
const pvbid = PVBid.createContext(config);
```

*Important Note: the token string passed to the `config.token` property should include `Bearer` prefix.*

**Load a self assessing Project instance**
```javascript 
let project = await pvbid.getProject(projectId);
```
**Setup autosave**
```javascript
project.onDelay("changed", 1500, "requesterId", () => project.save());
```

**Create a new project (w/bid)**
```javascript
const newProject = await pvbid.repositories.projects.create({ title: "New Project" }); // initializes the new project
const project = await pvbid.getProject(newProject.id); // gets the self assessing project instance
```

**Create a new bid in a project**
```javascript
const newBid = await project.createBid("Bid Title");
```

**Choose a bid to modify**

Project instances contain a list of their child bids.
```javascript 
let bid = project.bids[bidId];
```
**Making changes to the bid's properties**

Many properties will trigger the bid to self assess. For example setting the `bid.cost` property will fire its `assessing` event.  `bid.title` will not assess, but will flag the bid as dirty.
```javascript 
bid.title = "New Title";
bid.cost = 155555.99;
```
**Find a Field by its title and modify its value**

The type of bid entities include: `line_item`, `metric`, `field`, `component`, `assembly`, `datatable`, `component_group`, and `field_group`.
```javascript 
let fields = bid.entities.searchByTitle("field", "Customer Name");
if(fields.length > 0){
    fields[0].value = "John Doe";
}
``` 
**Find a Metric by its id and modify its value**
```javascript 
let metric = bid.entities.metrics(metricId);
if (metric) metric.value = 123.45;
```
**Manually assessing the bid**

It is a good idea to assess (calculate) the bid after making changes to Metrics, Fields and Variables.
``` javascript
bid.assess();
// OR
bid.reassessAll(true); // forces a full reassessment of ALL entities within the bid
```
**Manually save the bid, underlying bid entities, and parent project**

Saving a project also saves the bids and underlying data. You can immediately save a project any time. However, if an underlying bid is still calculating its results, any futher changes after saving the project will not persist. When a project and bids are finished calculating, the project instance will pass an `assessed` event.
```javascript 
project.save();
// OR
project.once("assessed", () => project.save());
```
**Log a summary of the bid**

``` javascript
console.log(`
    ${bid.title}:
     + ${bid.cost} (cost)
     + ${bid.tax} (tax)
     + ${bid.markup} (markup)
    ------------------
     = ${bid.price} (price)
`);
```
**Log a summary of the bid with a top-level component cost breakdown**

[Components] are organized in [ComponentGroups] such as "Cost Codes" or "PVBid Standard". Looking at the top-level components in a group gives us a general overview of the cost breakdown within a bid.
``` javascript
// First, select a component group (ie. "Cost Codes" or "PVBid Standard")
const groups = bid.entities.componentGroups();
const group = Object.values(groups)
    .find(group => group.title === 'PVBid Standard');

// Next, get the top-level (summary) components for the group
const allComponents = bid.entities.components();
const componentsInGroup = Object.values(allComponents)
    .filter(component => component.componentGroupId === group.id);
const topLevelComponents = componentsInGroup
    .filter(component => !component.config.is_nested);

// Finally, display a cost summary
const componentCostSummary = topLevelComponents
    .map(c => `[$${c.cost}] ${c.title}`)
    .join('\n');
console.log(componentCostSummary);
console.log(`Total: ${bid.cost}`);
```


[Bid]: ../class/src/domain/Bid.js~Bid.html
[Bids]: ../class/src/domain/Bid.js~Bid.html
[Fields]: ../class/src/domain/Field.js~Field.html
[Components]: ../class/src/domain/Component.js~Component.html
[ComponentGroups]: ../class/src/domain/ComponentGroup.js~ComponentGroup.html
[Assemblies]: ../class/src/domain/Assembly.js~Assembly.html
[Assembly]: ../class/src/domain/Assembly.js~Assembly.html
[Metrics]: ../class/src/domain/Metric.js~Metric.html
[Line Items]: ../class/src/domain/LineItem.js~LineItem.html
[Line Item]: ../class/src/domain/LineItem.js~LineItem.html
[Datatables]: ../class/src/domain/Datatable.js~Datatable.html
[Project]: ../class/src/domain/Project.js~Project.html
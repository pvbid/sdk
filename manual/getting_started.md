# Getting Started

### Important Notice
In the upcoming months, we are planning to change the id's of, line items, metrics, fields, components, datatables, assemblies, component groups, and field groups. The id's will switch to UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. Project and Bid id's are expected to remain as an integer and unchanged. All legacy bid data in our system will be updated. Breaking changes will be minimal, but are expected.

### Concepts
Verbaige for Bid, Bid Entities, and Project concepts.

### Code Examples
The following demonstrates how to set up an authorized context, loading a project, making changes, and saving.

**Create a context with an authorization token**

	const config = { token: "your auth token" };
    const context = PVBid.createContext(config);


**Load a self assessing Project instance**
    
    let project = await context.getProject(projectId);

**Setup autosave**

    project.onDelay("changed", 1500, "requesterId", () => project.save());

**Choose a bid to modify**
Project instances contain a list of their child bids.

    let bid = project.bids[bidId];

**Making changes to the bid's properties**
Many properties will trigger the bid to self assesses. For example setting the `bid.cost` property will fire its `assessing` event.  `bid.title` will not assess, but will flag the bid as dirty.

    bid.title = "New Title";
    bid.cost = 155555.99;

**Find a Field by its title and modify its value**

    let fields = bid.entities.searchByTitle("field", "Customer Name");
    if(fields.length > 0){
        fields[0].value = "John Doe";
    }
    
**Find a Metric by its id and modify its value**

    let metric = bid.entities.metrics(metricId);
    if (metric) metric.value = 123.45;

**Manually save the bid, underlying bid entities, and parent project**

    project.save();
    // OR
    project.once("assessed", () => project.save());


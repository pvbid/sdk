PVBid SDK
---------
Version: 1.0.0

Documentation: http://www.pvbid.com/docs/sdk/v1.0.0

### Important Notice
In the upcoming months, we are planning to change the id's of, line items, metrics, fields, components, datatables, assemblies, component groups, and field groups. The id's will switch to UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. Project and Bid id's are expected to remain as an integer and unchanged. All legacy bid data in our system will be updated. Breaking changes will be minimal, but are expected.


### Example
The following demonstrates how to set up an authorized context, loading a project, making changes, and saving.

##### Create a context with an authorization token.

	const config = { token: "your auth token" };
    const context = PVBid.createContext(config);


##### Load a self assessing Project instance. 
    
    let project = await context.getProject(projectId);

##### Setup autosave

    project.onDelay("changed", 1500, "requesterId", () => project.save());

##### Choose a bid to modify.
Project instances contain a list of their child bids.

    let bid = project.bids["bidId"];

##### Making changes to the bid's properties
Many properties will trigger the bid to self assesses. For example setting the `bid.cost` property will fire its `assessing` event.  `bid.title` will not assess, but will flag the bid as dirty.

    bid.title = "New Title";
    bid.cost = 155555.99;

##### Manually save the bid and parent project

    project.save();
    // OR
    project.once("assessed", () => project.save());


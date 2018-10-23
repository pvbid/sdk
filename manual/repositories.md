# Repositories
Included in the SDK are multiple repositories to easily access data from the server. The repositories are initialized within the [PVBidContext].

**Available Repositories**
* `pvbid.repositories.bids` See [BidRepository]
* `pvbid.repositories.projects` See [ProjectRepository]
* `pvbid.repositories.projectStatuses` See [ProjectStatusRepository]
* `pvbid.repositories.tags` See [TagRepository]
* `pvbid.repositories.snapshots` See [SnapshotRepository]
* `pvbid.repositories.assemblies` See [AssemblyRepository]
* `pvbid.repositories.users` See [UserRepository]
* `pvbid.repositories.predictionModels` See [PredictionModelRepository]

### Code Examples

**Retrieving an array of projects**
```javascript
let params = {
    order_by: "created_at",
    sort_order: "asc",
    per_page: 50
}

try {
    let projects = await pvbid.repositories.projects.get(params);
    console.log(projects) //prints an array of project data.
} catch(error) {
    //handle error;
}
```


[BidRepository]: ../class/src/repositories/BidRepository.js~BidRepository.html
[ProjectRepository]: ../class/src/repositories/ProjectRepository.js~ProjectRepository.html
[ProjectStatusRepository]: ../class/src/repositories/ProjectStatusRepository.js~ProjectStatusRepository.html
[TagRepository]: ../class/src/repositories/TagRepository.js~TagRepository.html
[SnapshotRepository]: ../class/src/repositories/SnapshotRepository.js~SnapshotRepository.html
[AssemblyRepository]: ../class/src/repositories/AssemblyRepository.js~AssemblyRepository.html
[UserRepository]: ../class/src/repositories/UserRepository.js~UserRepository.html
[PredictionModelRepository]: ../class/src/repositories/PredictionModelRepository.js~PredictionModelRepository.html
[PVBidContext]: ../class/src/PVBidContext.js~PVBidContext.html

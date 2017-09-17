# Repositories
Included in the SDK are multiple repositories to easily access data from the server. The repositories are initialized within the PVBidContext.

**Available Repositories**
* `context.repositories.bids` See [BidRepository] 
* `context.repositories.projects` See [ProjectRepository]
* `context.repositories.projectStatuses` See [ProjectStatusRepository]
* `context.repositories.tags` See [TagRepository]
* `context.repositories.snapshots` See [SnapshotRepository]
* `context.repositories.assemblies` See [AssemblyRepository]
* `context.repositories.users` See [UserRepository]

### Code Examples

**Retrieving an array of projects**
```javascript
let params = {
    order_by: "created_at",
    sort_order: "asc",
    per_page: 50 
}

try {
    let projects = await context.repositories.projects.get(params);
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
export default class TagRepository extends BaseRepository {
    constructor(baseUri, httpProvider) {
        super(baseUri + "tags/", "tag", "tags", httpProvider);
    }
}

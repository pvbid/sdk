import BaseRepository from "./BaseRepository";

export default class BaseDefinitionRepository extends BaseRepository {
  constructor(endpoint, singleMap, multiMap, httpConfig) {
    super(endpoint, singleMap, multiMap, httpConfig);
  }

  findById(id) {
    return super.findById(id);
  }

  get(params = {}) {
    params.include_config = true;
    return super.get(params);
  }

  save() {
    throw new Error(
      "Saving is not available for definitions. Please use the PVBid application to modify definitions."
    );
  }

  create() {
    throw new Error(
      "Creating is not available for definitions. Please use the PVBid application to create definitions."
    );
  }

  delete() {
    throw new Error(
      "Deleting is not available for definitions. Please use the PVBid application to remove definitions."
    );
  }
}

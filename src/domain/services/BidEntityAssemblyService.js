/**
 * Determine the entity's assembly ref id if it has one
 *
 * @param {BidEntity} entity
 * @return {string|undefined}
 */
const getEntityAssemblyRefId = entity => {
  return entity && entity.config ? entity.config.assembly_id : undefined;
};

/**
 * Determine the assembly's ref_id
 *
 * @param {Assembly} assembly
 * @return {string}
 */
const getAssemblyRefId = assembly => {
  if (assembly.ref_id) {
    return assembly.ref_id;
  }
  return assembly.id;
};

/**
 * Set the assembly ref for the given entity
 *
 * @param {BidEntity} entity
 * @param {string} assemblyRefId
 * @return {BidEntity}
 */
const setEntityAssemblyRefId = (entity, assemblyRefId) => {
  if (entity && entity.config) {
    entity.config.assembly_id = assemblyRefId;
  }
  return entity;
};

/**
 * Determine if the entity has an assembly
 *
 * @param {BidEntity} entity
 * @return {boolean}
 */
export const hasAssembly = entity => {
  return !!getEntityAssemblyRefId(entity);
};

/**
 * Get the entities assembly if it has one
 *
 * @param {BidEntity} entity
 * @return {Assembly|undefined}
 */
export const getAssembly = entity => {
  const assemblyRefId = getEntityAssemblyRefId(entity);

  if (!assemblyRefId) return undefined;

  return entity.bid.entities.assemblies(assemblyRefId);
};

/**
 * Set the entity's assembly reference. Omitting or passing null for the assembly will UNSET the assembly reference
 * @param {BidEntity} entity
 * @param {Assembly|string} [assembly] The assembly reference id OR the assembly entity.
 * @return {BidEntity}
 */
export const setAssembly = (entity, assembly = null) => {
  let ref = null;
  if (typeof assembly === 'string') {
    ref = assembly;
  } else if (assembly !== null) {
    ref = getAssemblyRefId(assembly);
  }

  return setEntityAssemblyRefId(entity, ref);
};

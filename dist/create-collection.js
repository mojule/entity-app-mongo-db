"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollection = void 0;
const mongodb_1 = require("mongodb");
const entity_app_1 = require("@mojule/entity-app");
const log_iisnode_1 = require("@mojule/log-iisnode");
// TODO investigate usages of "as any" here and see why @types/mongo complains
const entityToDbEntity = (entity) => {
    const _id = new mongodb_1.ObjectId();
    const dbEntity = Object.assign({}, entity, { _id });
    return dbEntity;
};
const createCollection = (collection) => {
    const ids = async () => {
        // no longer returns as ObjectId[] but some weird compound type :/
        const objectIds = (await collection.distinct('_id', {}, {}));
        const result = objectIds.map(o => o.toHexString());
        return result;
    };
    const create = async (entity) => {
        const dbEntity = entityToDbEntity(entity);
        await collection.insertOne(dbEntity);
        return dbEntity._id.toHexString();
    };
    const createMany = async (entities) => {
        const dbEntities = entities.map(entityToDbEntity);
        await collection.insertMany(dbEntities);
        return dbEntities.map(d => d._id.toHexString());
    };
    const load = async (id) => {
        try {
            const loadResult = await collection.findOne(idFilter(id));
            if (!loadResult) {
                const { namespace } = collection;
                log_iisnode_1.log.debug('mongo db load', { id, namespace, loadResult });
                throw Error(`expected ${id} in ${namespace}, found ${loadResult}`);
            }
            return normalizeId(loadResult);
        }
        catch (err) {
            log_iisnode_1.log.error(err);
            throw err;
        }
    };
    const loadMany = async (ids) => {
        const objectIds = ids.map(objectId);
        const filter = { _id: { $in: objectIds } };
        const loadResult = await collection.find(filter).toArray();
        return loadResult.map(normalizeId);
    };
    const save = async (document) => {
        const { _id } = document;
        if (typeof _id !== 'string')
            throw Error('Expected document to have _id:string');
        const entity = entity_app_1.dbItemToEntity(document);
        await collection.updateOne(idFilter(_id), { $set: entity });
    };
    // it's not really set up to update many by ID :/
    const saveMany = entity_app_1.defaultSaveMany(save);
    const remove = async (id) => {
        await collection.deleteOne(idFilter(id));
    };
    const removeMany = async (ids) => {
        const objectIds = ids.map(objectId);
        const filter = { _id: { $in: objectIds } };
        await collection.deleteMany(filter);
    };
    const find = async (criteria) => {
        const cursor = collection.find(criteria);
        const result = await cursor.toArray();
        return result.map(normalizeId);
    };
    const findOne = async (criteria) => {
        const result = await collection.findOne(criteria);
        return normalizeId(result);
    };
    const loadPaged = entity_app_1.defaultLoadPaged(ids, loadMany);
    const entityCollection = {
        ids, create, createMany, load, loadMany, save, saveMany, remove, removeMany,
        find, findOne, loadPaged
    };
    return entityCollection;
};
exports.createCollection = createCollection;
const objectId = (id) => new mongodb_1.ObjectId(id);
const idFilter = (id) => ({ _id: objectId(id) });
const normalizeId = (document) => {
    if (!document)
        throw Error('Expected object with _id property');
    const objectId = document['_id'];
    const _id = objectId.toHexString();
    const dbItem = { _id };
    const dbEntity = Object.assign({}, document, dbItem);
    return dbEntity;
};
//# sourceMappingURL=create-collection.js.map
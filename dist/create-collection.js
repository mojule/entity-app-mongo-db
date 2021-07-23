"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeId = exports.createCollection = void 0;
const mongodb_1 = require("mongodb");
const entity_app_1 = require("@mojule/entity-app");
const createCollection = (createDbItem, key, mongoCollection) => {
    const extendCreate = (entity) => {
        const entityD = Object.assign({}, entity, createDbItem());
        const dbEntity = Object.assign(entityD, { _id: new mongodb_1.ObjectId() });
        return dbEntity;
    };
    const ids = async () => {
        const objectIds = (await mongoCollection.distinct('_id', {}, {}));
        const result = objectIds.map(o => o.toHexString());
        return result;
    };
    const create = async (entity) => {
        const dbEntity = extendCreate(entity);
        await mongoCollection.insertOne(dbEntity);
        return dbEntity._id.toHexString();
    };
    const createMany = async (entities) => {
        const dbEntities = entities.map(extendCreate);
        await mongoCollection.insertMany(dbEntities);
        return dbEntities.map(d => d._id.toHexString());
    };
    const load = async (id) => {
        const loadResult = await mongoCollection.findOne(idFilter(id));
        if (!loadResult) {
            const { namespace } = mongoCollection;
            throw Error(`expected ${id} in ${namespace}, found ${loadResult}`);
        }
        return exports.normalizeId(loadResult);
    };
    const loadMany = async (ids) => {
        const objectIds = ids.map(objectId);
        // need to figure out how to type this
        const filter = { _id: { $in: objectIds } };
        const mongoItems = await mongoCollection.find(filter).toArray();
        const loadResult = mongoItems.map(exports.normalizeId);
        for (let i = 0; i < ids.length; i++) {
            const result = loadResult[i];
            if (result === undefined || result._id !== ids[i]) {
                throw Error(`Expected ${key}:${ids[i]}`);
            }
        }
        return loadResult;
    };
    const save = async (document) => {
        const { _id } = document;
        if (typeof _id !== 'string')
            throw Error('Expected document to have _id:string');
        // need to figure out how to type this
        const $set = {};
        for (const key in document) {
            if (key === '_id')
                continue;
            $set[key] = document[key];
        }
        await mongoCollection.updateOne(idFilter(_id), { $set: $set });
    };
    // it's not really set up to update many by ID :/
    const saveMany = entity_app_1.defaultSaveMany(save);
    const remove = async (id) => {
        await mongoCollection.deleteOne(idFilter(id));
    };
    const removeMany = async (ids) => {
        const objectIds = ids.map(objectId);
        // need to figure out how to type this
        const filter = { _id: { $in: objectIds } };
        await mongoCollection.deleteMany(filter);
    };
    const find = async (criteria) => {
        const cursor = mongoCollection.find(criteria);
        const result = await cursor.toArray();
        return result.map(exports.normalizeId);
    };
    const findOne = async (criteria) => {
        const filter = criteria;
        const result = await mongoCollection.findOne(filter);
        if (result !== undefined)
            return exports.normalizeId(result);
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
    if (!document || !document['_id'])
        throw Error('Expected object with _id property');
    const objectId = document['_id'];
    const _id = objectId.toHexString();
    const dbItem = { _id };
    const dbEntity = Object.assign({}, document, dbItem);
    return dbEntity;
};
exports.normalizeId = normalizeId;
//# sourceMappingURL=create-collection.js.map
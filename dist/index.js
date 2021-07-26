"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMongoDb = exports.mongoDbFactory = void 0;
const entity_app_1 = require("@mojule/entity-app");
const mongodb_1 = require("mongodb");
const create_collection_1 = require("./create-collection");
const mongoDbFactory = async (mongoDb, keys, createDbItem, close) => {
    const drop = async () => {
        await mongoDb.dropDatabase();
    };
    const collections = {};
    await entity_app_1.eachEntityKey(keys, async (key) => {
        collections[key] = create_collection_1.createCollection(createDbItem, key, mongoDb.collection(key));
    });
    const db = { drop, close, collections };
    return db;
};
exports.mongoDbFactory = mongoDbFactory;
const createMongoDb = async (name, keys, createDbItem, options) => {
    const { uri, clientOptions, dbOptions } = options;
    const client = await (clientOptions ?
        mongodb_1.MongoClient.connect(uri, clientOptions) :
        mongodb_1.MongoClient.connect(uri));
    const mongoDb = client.db(name, dbOptions);
    return exports.mongoDbFactory(mongoDb, keys, createDbItem, async () => await client.close());
};
exports.createMongoDb = createMongoDb;
//# sourceMappingURL=index.js.map
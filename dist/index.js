"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMongoDb = void 0;
const entity_app_1 = require("@mojule/entity-app");
const mongodb_1 = require("mongodb");
const create_collection_1 = require("./create-collection");
const createMongoDb = async (name, keys, { uri } = { uri: 'mongodb://localhost:27017' }) => {
    const client = await mongodb_1.MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const mongoDb = client.db(name);
    const drop = () => mongoDb.dropDatabase();
    const close = () => client.close();
    const collections = {};
    await entity_app_1.eachEntityKey(keys, async (key) => {
        collections[key] = create_collection_1.createCollection(mongoDb.collection(key));
    });
    const db = { drop, close, collections };
    return db;
};
exports.createMongoDb = createMongoDb;
//# sourceMappingURL=index.js.map
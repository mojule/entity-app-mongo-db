import { DbOptions, MongoClientOptions } from 'mongodb';
export declare type EntityMongoOptions = {
    uri: string;
    clientOptions?: MongoClientOptions;
    dbOptions?: DbOptions;
};

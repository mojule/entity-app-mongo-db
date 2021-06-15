import { EntityDb, EntityKeys } from '@mojule/entity-app';
import { MongoOptions } from './types';
export declare const createMongoDb: <TEntityMap>(name: string, keys: EntityKeys<TEntityMap>, { uri }?: MongoOptions) => Promise<EntityDb<TEntityMap>>;

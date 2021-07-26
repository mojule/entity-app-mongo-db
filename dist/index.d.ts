import { CreateDbItem, DbItem, EntityDb, EntityKeys } from '@mojule/entity-app';
import { Db } from 'mongodb';
import { EntityMongoOptions } from './types';
export declare const mongoDbFactory: <TEntityMap, D extends DbItem = DbItem>(mongoDb: Db, keys: EntityKeys<TEntityMap>, createDbItem: CreateDbItem<D>, close: () => Promise<void>) => Promise<EntityDb<TEntityMap, D>>;
export declare const createMongoDb: <TEntityMap, D extends DbItem = DbItem>(name: string, keys: EntityKeys<TEntityMap>, createDbItem: CreateDbItem<D>, options: EntityMongoOptions) => Promise<EntityDb<TEntityMap, D>>;

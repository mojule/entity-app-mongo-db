import { CreateDbItem, DbItem, EntityDb, EntityKeys } from '@mojule/entity-app';
import { EntityMongoOptions } from './types';
export declare const createMongoDb: <TEntityMap, D extends DbItem = DbItem>(name: string, keys: EntityKeys<TEntityMap>, createDbItem: CreateDbItem<D>, options: EntityMongoOptions) => Promise<EntityDb<TEntityMap, D>>;

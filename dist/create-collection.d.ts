import { Collection, ObjectId } from 'mongodb';
import { DbCollection, DbItem, CreateDbItem } from '@mojule/entity-app';
export declare const createCollection: <TEntity, D extends DbItem>(createDbItem: CreateDbItem<D>, key: string, mongoCollection: Collection<TEntity & D & {
    _id: ObjectId;
}>) => DbCollection<TEntity, D>;
export declare const normalizeId: <TEntity>(document: TEntity) => TEntity & DbItem;

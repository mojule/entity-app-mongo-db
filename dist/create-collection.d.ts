import { Collection } from 'mongodb';
import { DbCollection } from '@mojule/entity-app';
export declare const createCollection: <TEntity>(collection: Collection<TEntity>) => DbCollection<TEntity>;

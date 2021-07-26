import { DbRefFor, EntityKeys } from '@mojule/entity-app';
export declare type Foo = {
    name: string;
    value: number;
};
export declare type DbBar = Foo & {
    foo?: DbRefFor<EntityMap, 'foo'>;
};
export declare type BarModel = Foo & {
    foo?: Foo;
};
export declare type EntityMap = {
    foo: Foo;
    bar: DbBar;
};
export declare type EntityModels = {
    foo: Foo;
    bar: BarModel;
};
export declare const entityKeys: EntityKeys<EntityMap>;

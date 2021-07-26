import { DbRefFor, EntityKeys } from '@mojule/entity-app'

export type Foo = {
  name: string
  value: number
}

export type DbBar = Foo & {
  foo?: DbRefFor<EntityMap, 'foo'>
}

export type BarModel = Foo & {
  foo?: Foo
}

export type EntityMap = {
  foo: Foo
  bar: DbBar
}

export type EntityModels = {
  foo: Foo
  bar: BarModel
}

export const entityKeys: EntityKeys<EntityMap> = {
  foo: 'foo',
  bar: 'bar'
}
import * as assert from 'assert'
import { randId } from '@mojule/util'
import { MongoClientOptions, ObjectId } from 'mongodb'

import { createDefaultDbItem, DbItem, EntityDb } from '@mojule/entity-app'

import { createMongoDb } from '..'
import { normalizeId } from '../create-collection'
import { EntityMongoOptions } from '../types'

import * as configJson from './fixtures/config.json'
import { EntityMap, entityKeys, Foo } from './fixtures/types'

const { uri, clientOptions, dbOptions } = configJson as EntityMongoOptions


const dbName = () => `test-mongo-db-${randId()}`

const testDb = async (
  callback: (db: EntityDb<EntityMap, DbItem>) => Promise<void>
) => {
  const db = await createMongoDb(
    dbName(), entityKeys, createDefaultDbItem, { uri, clientOptions, dbOptions }
  )

  await callback(db)

  await db.drop()
  await db.close()
}

describe('mongo-db', () => {
  it('creates db', () => testDb(
    async db => {
      assert(db)
      assert(db.collections)
    }
  ))

  it( 'db with client options', async () => {
    const clientOptions: MongoClientOptions = { raw: false }

    const db = await createMongoDb(
      dbName(), entityKeys, createDefaultDbItem, { uri, clientOptions }
    )
  
    await db.drop()
    await db.close()
  })

  describe('collections', () => {
    it('create, load', () => testDb(
      async db => {
        const foo: Foo = { name: 'a', value: 0 }

        const _id = await db.collections.foo.create(foo)

        const dbFoo = await db.collections.foo.load(_id)

        assert.strictEqual(dbFoo._id, _id)
        assert.strictEqual(dbFoo.name, foo.name)
        assert.strictEqual(dbFoo.value, foo.value)
      }
    ))

    it('ids, createMany, loadMany', () => testDb(
      async db => {
        const foo0: Foo = { name: 'a', value: 0 }
        const foo1: Foo = { name: 'b', value: 1 }
        const foos = [foo0, foo1]

        const ids = await db.collections.foo.createMany(foos)
        const dbIds = await db.collections.foo.ids()
        const dbFoos = await db.collections.foo.loadMany(dbIds)

        assert.deepStrictEqual(ids, dbIds)

        for (let i = 0; i < foos.length; i++) {
          const _id = ids[i]
          const foo = foos[i]
          const dbFoo = dbFoos[i]

          assert.strictEqual(dbFoo._id, _id)
          assert.strictEqual(dbFoo.name, foo.name)
          assert.strictEqual(dbFoo.value, foo.value)
        }
      }
    ))

    it('load fails', () => testDb(
      async db => {
        await assert.rejects(async () => {
          await db.collections.foo.load(randId())
        })
      }
    ))

    it('loadMany fails', () => testDb(
      async db => {
        await assert.rejects(async () => {
          await db.collections.foo.loadMany([randId()])
        })
      }
    ))

    it('save', () => testDb(
      async db => {
        const foo: Foo = { name: 'a', value: 0 }

        const _id = await db.collections.foo.create(foo)

        await db.collections.foo.save({ _id, value: 1 })

        const dbFoo = await db.collections.foo.load(_id)

        assert.strictEqual(dbFoo._id, _id)
        assert.strictEqual(dbFoo.name, foo.name)
        assert.strictEqual(dbFoo.value, 1)
      }
    ))

    it('save fails', () => testDb(
      async db => {
        await assert.rejects(async () => {
          await db.collections.foo.save({ _id: null as any, value: 1 })
        })
      }
    ))

    it('saveMany', () => testDb(
      async db => {
        const foo0: Foo = { name: 'a', value: 0 }
        const foo1: Foo = { name: 'b', value: 1 }
        const foos = [foo0, foo1]

        const ids = await db.collections.foo.createMany(foos)
        const dbIds = await db.collections.foo.ids()

        const saves: (Partial<Foo> & DbItem)[] = ids.map((_id, i) => ({
          _id, value: i + 2
        }))

        await db.collections.foo.saveMany(saves)

        const dbFoos = await db.collections.foo.loadMany(dbIds)

        for (let i = 0; i < foos.length; i++) {
          const foo = foos[i]
          const dbFoo = dbFoos[i]
          const save = saves[i]

          assert.strictEqual(dbFoo.name, foo.name)
          assert.strictEqual(dbFoo.value, save.value)
        }
      }
    ))

    it('remove', () => testDb(
      async db => {
        const foo: Foo = { name: 'a', value: 0 }

        const _id = await db.collections.foo.create(foo)

        let ids = await db.collections.foo.ids()

        assert.strictEqual(ids.length, 1)

        await db.collections.foo.remove(_id)

        ids = await db.collections.foo.ids()

        assert.strictEqual(ids.length, 0)

        await assert.rejects(async () => {
          await db.collections.foo.load(_id)
        })
      }
    ))

    it('removeMany', () => testDb(
      async db => {
        const foo0: Foo = { name: 'a', value: 0 }
        const foo1: Foo = { name: 'b', value: 1 }
        const foos = [foo0, foo1]

        const preIds = await db.collections.foo.createMany(foos)

        assert.strictEqual(preIds.length, foos.length)

        await db.collections.foo.removeMany(preIds)

        const postIds = await db.collections.foo.ids()

        assert.strictEqual(postIds.length, 0)

        await assert.rejects(async () => {
          await db.collections.foo.loadMany(preIds)
        })
      }
    ))

    it('find', () => testDb(
      async db => {
        const foo0: Foo = { name: 'a', value: 0 }
        const foo1: Foo = { name: 'b', value: 0 }
        const foo2: Foo = { name: 'c', value: 1 }
        const foos = [foo0, foo1, foo2]

        const fooIds = await db.collections.foo.createMany(foos)

        const dbFoos = await db.collections.foo.find({ value: 0 })

        assert.strictEqual(dbFoos.length, 2)

        for (let i = 0; i < dbFoos.length; i++) {
          const dbFoo = dbFoos[i]
          const foo = foos[i]
          const id = fooIds[i]

          assert.strictEqual(dbFoo._id, id)
          assert.strictEqual(dbFoo.name, foo.name)
          assert.strictEqual(dbFoo.value, foo.value)
        }
      }
    ))

    it('findOne', () => testDb(
      async db => {
        const foo0: Foo = { name: 'a', value: 0 }
        const foo1: Foo = { name: 'b', value: 0 }
        const foo2: Foo = { name: 'c', value: 1 }
        const foos = [foo0, foo1, foo2]

        const fooIds = await db.collections.foo.createMany(foos)

        const dbFoo = await db.collections.foo.findOne({ value: 1 })

        assert(dbFoo)

        const foo = foo2
        const id = fooIds[2]

        assert.strictEqual(dbFoo._id, id)
        assert.strictEqual(dbFoo.name, foo.name)
        assert.strictEqual(dbFoo.value, foo.value)

        const dbFoo2 = await db.collections.foo.findOne({ value: 2 })

        assert.strictEqual( dbFoo2, undefined )
      }
    ))
  })

  describe( 'normalizeId', () => {
    const _id = new ObjectId()
    const idString = _id.toHexString()
    const ok = { _id }

    const normalized = normalizeId( ok )

    assert.strictEqual( normalized._id, idString )

    assert.throws( () => normalizeId({}) )
    assert.throws( () => normalizeId(null) )
    assert.throws( () => normalizeId({ _id: idString}) )
  })
})

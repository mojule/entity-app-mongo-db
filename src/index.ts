import { 
  CreateDbItem,
  DbCollections, DbItem, eachEntityKey, EntityDb, EntityKeys 
} from '@mojule/entity-app'

import { Db, MongoClient } from 'mongodb'
import { createCollection } from './create-collection'
import { EntityMongoOptions } from './types'

export const mongoDbFactory =  async <TEntityMap,D extends DbItem = DbItem>(
  mongoDb: Db,
  keys: EntityKeys<TEntityMap>, 
  createDbItem: CreateDbItem<D>,
  close: () => Promise<void>,
) => { 
  const drop = async () => { 
    await mongoDb.dropDatabase()
  }

  const collections: DbCollections<TEntityMap, D> = {} as any

  await eachEntityKey( keys, async key => {
    collections[ key ] = createCollection( 
      createDbItem, key, mongoDb.collection( key ) 
    )
  } )

  const db: EntityDb<TEntityMap, D> = { drop, close, collections }

  return db  
}

export const createMongoDb = async <TEntityMap,D extends DbItem = DbItem>(
  name: string, keys: EntityKeys<TEntityMap>, 
  createDbItem: CreateDbItem<D>,
  options: EntityMongoOptions
) => {
  const { uri, clientOptions, dbOptions } = options
  const client = await (
    clientOptions ?
    MongoClient.connect( uri, clientOptions ) :
    MongoClient.connect( uri )
  )

  const mongoDb = client.db( name, dbOptions )

  return mongoDbFactory( 
    mongoDb, keys, createDbItem, async () => await client.close() 
  )
}

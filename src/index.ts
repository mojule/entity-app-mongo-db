import { 
  CreateDbItem,
  DbCollections, DbItem, eachEntityKey, EntityDb, EntityKeys 
} from '@mojule/entity-app'

import { MongoClient, MongoClientOptions } from 'mongodb'
import { createCollection } from './create-collection'
import { EntityMongoOptions } from './types'

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

  const drop = async () => { 
    await mongoDb.dropDatabase()
  }

  const close = () => client.close()

  const collections: DbCollections<TEntityMap, D> = <any>{}

  await eachEntityKey( keys, async key => {
    collections[ key ] = createCollection( 
      createDbItem, key, mongoDb.collection( key ) 
    )
  } )

  const db: EntityDb<TEntityMap, D> = { drop, close, collections }

  return db
}

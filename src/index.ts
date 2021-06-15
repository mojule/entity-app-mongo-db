import { 
  DbCollections, eachEntityKey, EntityDb, EntityKeys 
} from '@mojule/entity-app'

import { MongoClient } from 'mongodb'
import { createCollection } from './create-collection'
import { MongoOptions } from './types'

export const createMongoDb = async <TEntityMap>(
  name: string, keys: EntityKeys<TEntityMap>,
  { uri }: MongoOptions = { uri: 'mongodb://localhost:27017' }
) => {
  const client = await MongoClient.connect( uri, { useNewUrlParser: true, useUnifiedTopology: true } )
  const mongoDb = client.db( name )

  const drop = () => mongoDb.dropDatabase()
  const close = () => client.close()

  const collections: DbCollections<TEntityMap> = <any>{}

  await eachEntityKey( keys, async key => {
    collections[ key ] = createCollection( mongoDb.collection( key ) )
  } )

  const db: EntityDb<TEntityMap> = { drop, close, collections }

  return db
}

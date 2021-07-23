import { DbOptions, MongoClientOptions } from 'mongodb'

export type EntityMongoOptions = {
  uri: string
  clientOptions?: MongoClientOptions
  dbOptions?: DbOptions
}

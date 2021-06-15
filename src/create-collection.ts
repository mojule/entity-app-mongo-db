import { Collection, ObjectId } from 'mongodb'

import {
  DbCollection, DbCreate, DbLoad, DbSave, DbRemove, DbItem, DbIds, DbLoadMany,
  DbCreateMany, DbRemoveMany, DbFind, DbFindOne, dbItemToEntity, 
  defaultLoadPaged, defaultSaveMany
} from '@mojule/entity-app'

import { log } from '@mojule/log-iisnode'

interface MongoDbItem {
  _id: ObjectId
}

// TODO investigate usages of "as any" here and see why @types/mongo complains

const entityToDbEntity = <TEntity>( entity: TEntity ): TEntity & MongoDbItem => {
  const _id = new ObjectId()
  const dbEntity = Object.assign( {}, entity, { _id } )

  return dbEntity
}

export const createCollection = <TEntity>(
  collection: Collection<TEntity>
) => {
  const ids: DbIds = async () => {  
    // no longer returns as ObjectId[] but some weird compound type :/
    const objectIds = ( 
      await collection.distinct( '_id', {}, {} ) 
    ) as ObjectId[]
    
    const result = objectIds.map( o => o.toHexString() )

    return result
  }

  const create: DbCreate<TEntity> = async entity => {
    const dbEntity = entityToDbEntity( entity )

    await collection.insertOne( dbEntity as any )

    return dbEntity._id.toHexString()
  }

  const createMany: DbCreateMany<TEntity> = async entities => {
    const dbEntities = entities.map( entityToDbEntity )

    await collection.insertMany( dbEntities as any )

    return dbEntities.map( d => d._id.toHexString() )
  }

  const load: DbLoad<TEntity> = async id => {
    try {
      const loadResult = <TEntity & DbItem>await collection.findOne(
        idFilter( id ) as any
      )

      if( !loadResult ){
        const { namespace } = collection

        log.debug( 'mongo db load', { id, namespace, loadResult } )

        throw Error( 
          `expected ${ id } in ${ namespace }, found ${ loadResult }` 
        )
      }
  
      return normalizeId( loadResult ) 
    } catch( err ){
      log.error( err )

      throw err
    }
  }

  const loadMany: DbLoadMany<TEntity> = async ids => {
    const objectIds = ids.map( objectId )
    const filter = { _id: { $in: objectIds } }

    const loadResult = <(TEntity & DbItem)[]>await collection.find(
      filter as any
    ).toArray()

    return loadResult.map( normalizeId )
  }

  const save: DbSave<TEntity> = async document => {
    const { _id } = document

    if ( typeof _id !== 'string' )
      throw Error( 'Expected document to have _id:string' )

    const entity = dbItemToEntity( document )

    await collection.updateOne(
      idFilter( _id ) as any, { $set: entity }
    )
  }

  // it's not really set up to update many by ID :/
  const saveMany = defaultSaveMany( save )

  const remove: DbRemove = async id => {
    await collection.deleteOne( idFilter( id ) as any )
  }

  const removeMany: DbRemoveMany = async ids => {
    const objectIds = ids.map( objectId )
    const filter = { _id: { $in: objectIds } }

    await collection.deleteMany( filter as any )
  }

  const find: DbFind<TEntity> = async criteria => {
    const cursor = collection.find( criteria )
    const result = await cursor.toArray()

    return ( <( TEntity & DbItem )[]>result ).map( normalizeId )
  }

  const findOne: DbFindOne<TEntity> = async criteria => {
    const result = await collection.findOne( criteria )

    return normalizeId( result )
  }

  const loadPaged = defaultLoadPaged( ids, loadMany )

  const entityCollection: DbCollection<TEntity> = {
    ids, create, createMany, load, loadMany, save, saveMany, remove, removeMany,
    find, findOne, loadPaged
  }

  return entityCollection
}

const objectId = ( id: string ) => new ObjectId( id )

const idFilter = ( id: string ) => ( { _id: objectId( id ) } )

const normalizeId = <TEntity>( document: TEntity ) => {
  if( !document ) throw Error( 'Expected object with _id property' )
  const objectId: ObjectId = document[ '_id' ]
  const _id = objectId.toHexString()
  const dbItem: DbItem = { _id }
  const dbEntity = Object.assign( {}, document, dbItem )

  return dbEntity
}

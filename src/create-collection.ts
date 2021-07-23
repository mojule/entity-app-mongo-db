import { Collection, Filter, ObjectId, WithId } from 'mongodb'

import {
  DbCollection, DbCreate, DbLoad, DbSave, DbRemove, DbItem, DbIds, DbLoadMany,
  DbCreateMany, DbRemoveMany, DbFind, DbFindOne, dbItemToEntity, 
  defaultLoadPaged, defaultSaveMany, CreateDbItem
} from '@mojule/entity-app'

export const createCollection = <TEntity, D extends DbItem>(
  createDbItem: CreateDbItem<D>,
  key: string,
  mongoCollection: Collection<TEntity & D & { _id: ObjectId}>
) => {
  const extendCreate = ( entity: TEntity ) => {
    const entityD = Object.assign( {}, entity, createDbItem() )

    const dbEntity = Object.assign(
      entityD, { _id: new ObjectId() }
    )

    return dbEntity as WithId<TEntity & D & { _id: ObjectId}>
  }

  const ids: DbIds = async () => {  
    const objectIds = ( 
      await mongoCollection.distinct( '_id', {}, {} ) 
    ) 
    
    const result = objectIds.map( o => o.toHexString() )

    return result
  }

  const create: DbCreate<TEntity> = async entity => {
    const dbEntity = extendCreate( entity )

    await mongoCollection.insertOne( dbEntity )

    return dbEntity._id.toHexString()
  }

  const createMany: DbCreateMany<TEntity> = async entities => {
    const dbEntities = entities.map( extendCreate )

    await mongoCollection.insertMany( dbEntities )

    return dbEntities.map( d => d._id.toHexString() )
  }

  const load: DbLoad<TEntity,D> = async id => {
    const loadResult = await mongoCollection.findOne(
      idFilter( id ) 
    )

    if( !loadResult ){
      const { namespace } = mongoCollection

      throw Error( 
        `expected ${ id } in ${ namespace }, found ${ loadResult }` 
      )
    }

    return normalizeId( loadResult ) 
  }

  const loadMany: DbLoadMany<TEntity, D> = async ids => {
    const objectIds = ids.map( objectId )

    // need to figure out how to type this
    const filter: Filter<any> = { _id: { $in: objectIds } }

    const mongoItems = await mongoCollection.find( filter ).toArray()

    const loadResult = mongoItems.map( normalizeId ) as (TEntity & D)[]

    for( let i = 0; i < ids.length; i++ ){
      const result = loadResult[ i ]

      if( result === undefined || result._id !== ids[ i ] ){
        throw Error( `Expected ${ key }:${ ids[ i ] }` )
      }
    }

    return loadResult
  }

  const save: DbSave<TEntity> = async document => {
    const { _id } = document

    if ( typeof _id !== 'string' )
      throw Error( 'Expected document to have _id:string' )

    // need to figure out how to type this
    const $set: Partial<TEntity> = {}

    for( const key in document ){
      if( key === '_id' ) continue

      $set[ key ] = document[ key ]
    }
    
    await mongoCollection.updateOne(
      idFilter( _id ), { $set: $set as any }
    )
  }

  // it's not really set up to update many by ID :/
  const saveMany = defaultSaveMany( save )

  const remove: DbRemove = async id => {
    await mongoCollection.deleteOne( idFilter( id ) )
  }

  const removeMany: DbRemoveMany = async ids => {
    const objectIds = ids.map( objectId )
    // need to figure out how to type this
    const filter: Filter<any> = { _id: { $in: objectIds } }

    await mongoCollection.deleteMany( filter )
  }

  const find: DbFind<TEntity, D> = async criteria => {
    const cursor = mongoCollection.find( criteria )
    const result = await cursor.toArray()

    return result.map( normalizeId )
  }

  const findOne: DbFindOne<TEntity, D> = async criteria => {
    const filter = criteria as Filter<TEntity & D>

    const result = await mongoCollection.findOne( filter )

    if( result !== undefined )
      return normalizeId( result )
  }

  const loadPaged = defaultLoadPaged( ids, loadMany )

  const entityCollection: DbCollection<TEntity, D> = {
    ids, create, createMany, load, loadMany, save, saveMany, remove, removeMany,
    find, findOne, loadPaged
  }

  return entityCollection
}

const objectId = ( id: string ) => new ObjectId( id )

const idFilter = ( id: string ) => ( { _id: objectId( id ) } )

export const normalizeId = <TEntity>( document: TEntity ) => {
  if( 
    !document || !document[ '_id' ] 
  ) throw Error( 'Expected object with _id property' )
  
  const objectId: ObjectId = document[ '_id' ]
  const _id = objectId.toHexString()
  const dbItem: DbItem = { _id }
  const dbEntity = Object.assign( {}, document, dbItem )

  return dbEntity
}

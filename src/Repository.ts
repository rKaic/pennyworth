import { uuid } from "./core";
import moment from 'moment';
import { Logger } from 'winston';
import { Db, MongoClient } from 'mongodb';

const DATABASE_NAME = "Pennyworth";

type DatabaseObject = {
  _id?: string
  timestamp?: Date
};

class Repository {
  logger: Logger;
  client: MongoClient;
  database: Db;

  constructor(logger: Logger, connectionString: string) {
    this.logger = logger;
    this.client = new MongoClient(connectionString);
    this.database = this.client.db(DATABASE_NAME);
  }

  _getCollection(collectionName: string) {
    return this.database.collection(collectionName);
  }

  isValid(obj) {
    return (typeof obj["_id"] !== "undefined" && typeof obj.type !== "undefined");
  }

  async findById<T>(collection: string, id: string) {
    return await this._getCollection(collection).findOne({ _id: id }) as T;
  }

  async findAllByType<T>(collection: string, objType) {
    return await this._getCollection(collection).find({ type: objType }).map(o => o as T).toArray();
  }

  async find<T>(collection:string, query) {
    return await this._getCollection(collection).find(query).map(o => o as T).toArray();
  }

  async findFirstOrNull<T>(collection:string, query) {
    const results = await this.find<T>(collection, query);
    return results.length > 0 ? results[0] : null;
  }

  async add<T extends DatabaseObject>(collection: string, obj: T, upsert: boolean = false): Promise<T> {
    if(!obj.hasOwnProperty("timestamp")) {
      obj.timestamp = moment.utc().toDate();
    }
    
    if(!obj.hasOwnProperty("_id")) {
      obj._id = uuid();
    }

    if(!this.isValid(obj)) {
      this.logger.error(`Invalid object attempted to be added to repo: ${JSON.stringify(obj)}`);
      return obj;
    }

    if(upsert) {
      const upserted = await this._getCollection(collection).replaceOne({ _id: obj._id }, obj, { upsert });
      return await this.findById(collection, upserted.upsertedId?.toString());
    } else {
      const inserted = await this._getCollection(collection).insertOne(obj as any);
      return await this.findById(collection, inserted.insertedId?.toString());
    }
  }

  async removeById(collection: string, id: string) {
    return await this._getCollection(collection).deleteOne( { _id: id });
  }

  async removeByUserID(collection: string, userID: string) {
    return await this._getCollection(collection).deleteMany( { userID: userID });
  }

  async removeByQuery(collection: string, query) {
    return await this._getCollection(collection).deleteMany(query);
  }

  async update(collection: string, query, updatedDocument) {
    return await this._getCollection(collection).replaceOne(query, updatedDocument);
  }
}

export default Repository;
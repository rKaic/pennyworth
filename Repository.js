const Datastore = require('nedb');
const core = require("./core.js");
const moment = require('moment');

class Repository {
  constructor(logger) {
    this.logger = logger;
    this.db = new Datastore({ filename: './datastore.db', autoload: true });
  }

  isValid(obj) {
    return (typeof obj["_id"] !== "undefined" && typeof obj.type !== "undefined");
  }

  findById(id, callback) {
    let error = null;
    this.db.findOne({ _id: id }, (err, doc) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof callback === "function" && callback(error, doc);
    });
  }

  findAllByType(objType, callback) {
    let error = null;
    this.db.find({ type: objType }, (err, docs) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof callback === "function" && callback(error, docs);
    });
  }

  find(query, callback) {
    let error = null;
    this.db.find(query, (err, docs) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof callback === "function" && callback(error, docs);
    });
  }

  add(obj, callback) {
    let error = null;

    if(!obj.hasOwnProperty("timestamp")) {
      obj.timestamp = moment.utc().format();
    }
    
    if(!obj.hasOwnProperty("_id")) {
      obj._id = core.uuid();
    }

    if(!this.isValid(obj)) {
      this.logger.error(`Invalid object attempted to be added to repo: ${JSON.stringify(obj)}`);
      return;
    }


    this.db.insert(obj, (err, newDocs) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof callback === "function" && callback(error, newDocs);
    });
  }

  removeById(id, callback) {
    let error = null;
    this.db.remove( { _id: id }, {}, (err, numRemoved) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof callback === "function" && callback(error, numRemoved);
    });
  }

  removeByUserID(userID, callback) {
    let error = null;
    this.db.remove( { userID: userID }, { multi: true }, (err, numRemoved) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof callback === "function" && callback(error, numRemoved);
    });
  }

  removeByQuery(query, callback) {
    let error = null;
    this.db.remove( query, { multi: true }, (err, numRemoved) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof callback === "function" && callback(error, numRemoved);
    });
  }

  update(query, updatedDocument, callback) {
    let error = null;
    this.db.update(query, updatedDocument, {}, (err, numAffected, affectedDocuments, upsert) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof callback === "function" && callback(error, numAffected, affectedDocuments, upsert);
    });
  }
}

module.exports = Repository;
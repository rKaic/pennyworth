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

  findById(id, respond) {
    let error = null;
    this.db.findOne({ _id: id }, (err, doc) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof respond === "function" && respond(error, doc);
    });
  }

  findAllByType(objType, respond) {
    let error = null;
    this.db.find({ type: objType }, (err, docs) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof respond === "function" && respond(error, docs);
    });
  }

  find(query, respond) {
    let error = null;
    this.db.find(query, (err, docs) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof respond === "function" && respond(error, docs);
    });
  }

  add(obj, respond) {
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
      typeof respond === "function" && respond(error, newDocs);
    });
  }

  removeById(id, respond) {
    let error = null;
    this.db.remove( { _id: id }, {}, (err, numRemoved) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof respond === "function" && respond(error, numRemoved);
    });
  }

  removeByUserID(userID, respond) {
    let error = null;
    this.db.remove( { userID: userID }, { multi: true }, (err, numRemoved) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof respond === "function" && respond(error, numRemoved);
    });
  }

  removeByQuery(query, respond) {
    let error = null;
    this.db.remove( query, { multi: true }, (err, numRemoved) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof respond === "function" && respond(error, numRemoved);
    });
  }

  update(query, updatedDocument, respond) {
    let error = null;
    this.db.update(query, updatedDocument, {}, (err, numAffected, affectedDocuments, upsert) => {
      if(err) {
        this.logger.error(err);
        error = err;
      }
      typeof respond === "function" && respond(error, numAffected, affectedDocuments, upsert);
    });
  }
}

module.exports = Repository;
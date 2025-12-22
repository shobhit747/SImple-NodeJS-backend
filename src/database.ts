import { MongoClient } from 'mongodb'

const uri = 'mongodb://mongo:27017/?directConnection=true';
const client = new MongoClient(uri);
let database = client.db('library');
let books = database.collection('books');
let users = database.collection('users');
let userUidIndex = users.createIndex({'uid':1},{unique: true});
let userUsernameIndex = users.createIndex({'username':1},{unique: true});

export { books, users };
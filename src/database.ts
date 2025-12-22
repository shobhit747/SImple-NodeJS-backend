import { MongoClient } from 'mongodb'

const uri = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.9';
const client = new MongoClient(uri);
let database = client.db('library');
let books = database.collection('books');
let users = database.collection('users');
let userIndex = users.createIndex({'uid':1},{unique: true});

export { books, users };
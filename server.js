const express = require('express')
const jwt = require('jsonwebtoken')
const jwtSecret = 'secret_key'; // Change this to your own secret key
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors')
var app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended : true}))

const { MongoClient, Collection } = require('mongodb');

const url = 'mongodb+srv://ice23278:icelove123@contactlist.npcpl0v.mongodb.net/ <ContactList> ?retryWrites=true&w=majority"';
const client = new MongoClient(url);

const dbName = 'ContactList';
let db
let collection

async function dbConnect(){
    await client.connect()
    console.log("Database connection is successfully")

    db = client.db(dbName)
    collection = db.collection('Contacts')
    collectionLogin = db.collection('accounts')
}

dbConnect().catch(console.error)

async function matching(user) { // Match ID and Password
    var query = {$and: [{username: user.username}, {password: user.password}]}
    const findResult = await collectionLogin.find(query).toArray();
    return findResult
}

async function insertContact(contact) { // Add new user
    const insertResult = await collection.insertOne(contact)
    return insertResult
}

async function editContact(contact, userId) { // Update user
    var query = { _id: new ObjectId(userId) }
    var newvalue = {
        $set: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            cid: contact.cid,
            mobile: contact.mobile,
            email: contact.email,
            facebook: contact.facebook,
            imageUrl: contact.imageUrl
        }
    }
    const updateResult = await collection.updateOne(query, newvalue)
    return updateResult
}

async function deleteContact(contact, userId) { // Delete user
    var query = { _id: new ObjectId(userId) }
    const deleteResult = await collection.deleteOne(query)
    return deleteResult
}

async function showAllContact() { // Show all users
    var query = { firstName: 1 }
    const findResult = await collection.find().sort(query).toArray()
    return findResult
}

async function showContact(contact, userId) { // Show specific user
    var query = { _id: new ObjectId(userId) }
    var order = { firstName: 1 }
    const findResult = await collection.find(query).sort(order).toArray()
    return findResult
}

app.post('/login', (req, res) => { // Login
    const user = req.body
    matching(user).then((result) => {
        console.log(result)
        if (result.length > 0) {
            const token = jwt.sign({ user: user.id }, jwtSecret);
            res.json({
                message: 'Authenticated! Use this token in the "Authorization" header',
                token: token
            });
        } else {
            // res.json({
            //     message: 'Invalid username or password',
            // });
            res.sendStatus(404)
        }
    })
})

app.post('/users', ensureToken, (req, res) => { // Add new user
    jwt.verify(req.token, jwtSecret, function(err, data) {
        if (err) {
          res.sendStatus(403);
        } else {
            insertContact(req.body).then((result) => {
                res.json({
                    result
                })
            })
        }
    });
})

app.post('/users/:userId', ensureToken, (req, res) => { // Update user
    jwt.verify(req.token, jwtSecret, function(err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            editContact(req.body, req.params.userId).then((result) => {
                res.json({
                    result
                })
            })
        }
    });
})

app.delete('/users/:userId', ensureToken, (req, res) => { // Delete user
    jwt.verify(req.token, jwtSecret, function(err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            deleteContact(req.body, req.params.userId).then((result) => {
                res.json({
                    result
                })
            })
        }
    });
})

app.get('/users', ensureToken, (req, res) => { // Show all users
    console.log(req.token)
    jwt.verify(req.token, jwtSecret, function(err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            showAllContact().then((result) => {
                res.json({
                    result
                })
            })
        }
    });
})

app.get('/users/:userId', ensureToken, (req, res) => { // Show specific user
    jwt.verify(req.token, jwtSecret, function(err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            showContact(req.body, req.params.userId).then((result) => {
                res.json({
                    result
                })
            })
        }
    });
})

app.listen(5000, function(){ //port
    console.log('Aplication is running on port 5000')
})

function ensureToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}
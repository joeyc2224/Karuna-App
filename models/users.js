const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const userSchema = new Schema({
    username: String,
    password: String,
    loggedin: Boolean,
    allies: [{
        userID: String,
    }],
    followers: [{
        userID: String,
    }],
    following: [{
        userID: String,
    }]
});

const Users = model('Users', userSchema);//users collection in Karuna database


async function newUser(username, password) {
    const user = { username: username, password: password, loggedin: false }
    await Users.create(user)
        .catch(err => {
            console.log('Error:' + err)
        });
}

async function getUsers() {
    let data = [];
    await Users.find({})
        .exec()
        .then(mongoData => {
            data = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return data;
}

async function findUser(username) {
    let user = null
    await Users.findOne({ username: username }).exec()
        .then(mongoData => {
            user = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return user;
}

async function checkPassword(username, password) {
    let user = await findUser(username)
    if (user) {
        // console.log(user, password)
        return user.password == password
    }
    return false
}

async function setLoggedIn(username, state) {
    let user = await findUser(username)
    if (user) {
        user.loggedin = state
        user.save()
    }
}

async function isLoggedIn(username) {
    let user = await findUser(username)
    if (user) {
        return user.loggedin = state
    }
    return false
}

module.exports = { newUser, getUsers, findUser, checkPassword, setLoggedIn,isLoggedIn}
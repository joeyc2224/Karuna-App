const mongoose = require('mongoose');
const { Schema, model } = mongoose;

//bcrypt import
const bcrypt = require('bcrypt')
const saltRounds = 10

const userSchema = new Schema({
    username: String,
    password: String,
    loggedin: Boolean,
    profilePic: String,
    bio: String,
    allies: [{
        username: String,
    }],
    followers: [{
        username: String,
    }],
    following: [{
        username: String,
    }]
});

//create salt and hash when a password is changed
userSchema.pre('save', function (next) {
    let user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(saltRounds, function (err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
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

async function checkPassword(username, password, action) {
    let user = await findUser(username)
    bcrypt.compare(password, user.password)
        .then(isMatch => {
            action(isMatch)
        })
        .catch(err => {
            throw err
        })
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

async function followUser(followee, follower) {

    let newFollower = {
        username: follower,
    }
    let newFollowing = {
        username: followee,
    }

    await Users.findOneAndUpdate({ username: followee }, { $push: { followers: newFollower } }).exec()//add new follower
    await Users.findOneAndUpdate({ username: follower }, { $push: { following: newFollowing } }).exec()//add new following
}

async function editProfile(user, data, imageFile) {

    if (imageFile) {//if pp is changed
        await Users.findOneAndUpdate({ username: user }, { profilePic: imageFile }).exec()
    } else {
        //console.log("pic null")
    }

    if (data.bio) {
        await Users.findOneAndUpdate({ username: user }, { bio: data.bio }).exec()

    } else {
        //console.log("bio null")
    }

    if (data.username) {//if username is changed

        if (await findUser(data.username)) {
            console.log('user exists')
            return false//username already exists - Update failed
        }
        else {
            await Users.findOneAndUpdate({ username: user }, { username: data.username }).exec()
            return true//username changed, tell serve to reload profile with new name
        }

    } else {
        return false//no username change
    }
}

module.exports = { newUser, getUsers, findUser, checkPassword, setLoggedIn, isLoggedIn, followUser, editProfile }
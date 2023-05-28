const mongoose = require('mongoose');
const { Schema, model } = mongoose;

//bcrypt import
const bcrypt = require('bcrypt');
const { changePostUser } = require('./posts');
const { changeJournalUser } = require('./journals');

const userSchema = new Schema({
    username: String,
    password: String,
    loggedin: Boolean,
    profilePic: String,
    bio: String,
    requests: [{
        username: String,
        time: Date,
    }],
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

//BCRYPT PASSWORD FUNCTIONS - adapted from https://stackoverflow.com/a/76279982
userSchema.pre("save", async function (next) {

    if ((this.isModified && this.isModified("password"))) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next()

});

userSchema.pre(["updateOne", "findByIdAndUpdate", "findOneAndUpdate"], async function (next) {//when password is updated, rehash

    const data = this.getUpdate();
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 12);
    }
    next()

});


const Users = model('Users', userSchema);//users collection in Karuna database

//add new user - from class mostly
async function newUser(username, password) {
    const user = {
        username: username,
        password: password,
        loggedin: false,
    }

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

//return just the user object ID
async function getUser_id(username) {
    let user = null
    await Users.findOne({ username: username }).exec()
        .then(mongoData => {
            user = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return user._id;
}

//find one user - from class
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

async function findUserById(id) {
    let user = null
    await Users.findOne({ _id: id }).exec()
        .then(mongoData => {
            user = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return user;
}

// find profile picture based on user search - adapted from findUser above 
async function getProfilePic(username) {
    let user = null
    await Users.findOne({ username: username }).exec()
        .then(mongoData => {
            user = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });

    if (!user.profilePic) {//if no picture, send default user image
        return "/images/user.png"
    } else {
        return user.profilePic
    }
}

//password check - works with Bcrypt, not my code
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

//set user as logged in - from class
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

//FOLLOWER FUNCTIONS - adds usernames to following list and follower lists - my own code
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

async function unfollowUser(followee, follower) {

    let oldFollower = {
        username: follower,
    }
    let oldFollowing = {
        username: followee,
    }

    //console.log(oldFollower, oldFollowing)

    await Users.findOneAndUpdate({ username: followee }, { $pull: { followers: oldFollower } }).exec()
    await Users.findOneAndUpdate({ username: follower }, { $pull: { following: oldFollowing } }).exec()
}



//ALLY FUNCTIONS - my own code, works similar to following above but with additional request feature
async function requestAlly(recipient, sender) {

    let newRequest = {
        username: sender,
        time: Date.now(),
    }

    await Users.findOneAndUpdate({ username: recipient }, { $push: { requests: newRequest } }).exec()
}

async function unrequestAlly(recipient, sender) {

    let oldRequest = {
        username: sender,
    }
    //console.log("remove request")
    await Users.findOneAndUpdate({ username: recipient }, { $pull: { requests: oldRequest } }).exec()//pulls ally request from user
}

async function acceptAlly(sender, recipient) {//accept ally request, removing the request and adding each username to both parties

    let newAlly1 = {
        username: sender,
    }

    let newAlly2 = {
        username: recipient,
    }

    await Users.findOneAndUpdate({ username: recipient }, { $push: { allies: newAlly1 } }).exec()//add ally
    await Users.findOneAndUpdate({ username: sender }, { $push: { allies: newAlly2 } }).exec()
    await Users.findOneAndUpdate({ username: recipient }, { $pull: { requests: newAlly1 } }).exec()//pulls ally request from user
}

async function removeAlly(ally1, ally2) {

    let currentUser = {
        username: ally1,
    }

    let otherUser = {
        username: ally2,
    }

    console.log(currentUser, otherUser)

    await Users.findOneAndUpdate({ username: ally1 }, { $pull: { allies: otherUser } }).exec()//pull users from each others allies array
    await Users.findOneAndUpdate({ username: ally2 }, { $pull: { allies: currentUser } }).exec()
}




//EDIT PROFILE - own code
async function editProfile(user, data, imageFile) {

    if (imageFile) {//if pic is changed
        await Users.findOneAndUpdate({ username: user }, { profilePic: imageFile }).exec()
    } else {
        //console.log("pic null")
    }

    if (data.bio) {//only chnage if data is entered
        await Users.findOneAndUpdate({ username: user }, { bio: data.bio }).exec()

    } else {
        //console.log("bio null")
    }

    if (data.password) {
        await Users.findOneAndUpdate({ username: user }, { password: data.password }).exec()

    } else {
        //console.log("bio null")
    }

    if (data.username) {//if username is changed 

        if (await findUser(data.username)) {
            console.log('user already exists')
            return false//username already exists - Update failed
        }
        else {

            userData = await findUser(user)

            //code below goes through process of changing all occurances of the old username in the allies and followers arrays - should of user IDs more
            for (const ally of userData.allies) {//update allies names

                let oldUsername = {
                    username: user,
                }

                let newUsername = {
                    username: data.username,
                }

                await Users.findOneAndUpdate({ username: ally.username }, { $pull: { allies: oldUsername } }).exec()
                await Users.findOneAndUpdate({ username: ally.username }, { $push: { allies: newUsername } }).exec()
            }

            for (const follower of userData.followers) {//update followers name

                let oldUsername = {
                    username: user,
                }

                let newUsername = {
                    username: data.username,
                }

                await Users.findOneAndUpdate({ username: follower.username }, { $pull: { following: oldUsername } }).exec()
                await Users.findOneAndUpdate({ username: follower.username }, { $push: { following: newUsername } }).exec()
            }

            for (const following of userData.following) {//update following name

                let oldUsername = {
                    username: user,
                }

                let newUsername = {
                    username: data.username,
                }

                await Users.findOneAndUpdate({ username: following.username }, { $pull: { followers: oldUsername } }).exec()
                await Users.findOneAndUpdate({ username: following.username }, { $push: { followers: newUsername } }).exec()
            }

            await changePostUser(user, data.username)//changes the username attached to all posts made by user to avoid errors
            await changeJournalUser(user, data.username)//changes the username attached to all posts made by user to avoid errors

            await Users.findOneAndUpdate({ username: user }, { username: data.username }).exec()
            return true//username changed, tell server to reload profile with new name
        }

    } else {
        return false//no username change
    }
}

module.exports = { newUser, getUsers, getUser_id, findUser, findUserById, getProfilePic, checkPassword, setLoggedIn, isLoggedIn, followUser, unfollowUser, editProfile, requestAlly, unrequestAlly, acceptAlly, removeAlly }
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const journalSchema = new Schema({
    postedBy: String,
    mood: String,
    message: String,
    time: Date,
    reactions: [{
        username: String,
        reaction: String
    }]
})

const Posts = model('Journal', journalSchema);

function addNewPost(userID, post) {
    let myPost = {
        postedBy: userID,
        mood: post.mood,
        message: post.message,
        time: Date.now(),
    }
    //create new collection data in mongo
    Posts.create(myPost)
        .catch(err => {
            console.log("Error: " + err)
        })
}

//return posts
async function getPosts(n = 20) {
    let data = []
    await Posts.find({})
        .sort({ 'time': -1 })
        .limit(n)
        .exec()
        .then(mongoData => {
            data = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return data;
}

async function reactJournal(likedPostID, emoji, likedByID) {

    let newReact = {
        username: likedByID,
        reaction: emoji
    }

    await Posts.findByIdAndUpdate(likedPostID, { $push: { reactions: newReact } }).exec()
}

async function refreshLikes(likedPostID) {

    await Posts.findById(likedPostID)
        .then(mongoData => {
            likes = mongoData.likes;
        })

    return likes;
}

module.exports = { addNewPost, getPosts, reactJournal, refreshLikes }
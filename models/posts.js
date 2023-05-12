const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const postSchema = new Schema({
    postedBy: String,
    mood: String,
    message: String,
    time: Date,
    imagePath: String,
    likes: Number,
    likedBy: [{
        username: String
    }],
    comments: [{
        commentBy: String,
        comment: String,
        likes: Number,
        time: Date,
    }]
})

const Posts = model('Posts', postSchema);

function addNewPost(userID, post, imageFile) {
    let myPost = {
        postedBy: userID,
        mood: post.mood,
        message: post.message,
        likes: 0,
        time: Date.now(),
        imagePath: imageFile,
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

async function likePost(likedPostID, likedByID) {

    await Posts.findByIdAndUpdate(likedPostID, { $inc: { likes: 1 } })

    let newLike = {
        username: likedByID
    }

    await Posts.findByIdAndUpdate(likedPostID, { $push: { likedBy: newLike } }).exec()
}

async function refreshLikes(likedPostID) {

    await Posts.findById(likedPostID)
        .then(mongoData => {
            likes = mongoData.likes;
        })

    return likes;
}

module.exports = { addNewPost, getPosts, likePost, refreshLikes }
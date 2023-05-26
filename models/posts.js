const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const postSchema = new Schema({
    postedBy: String,
    message: String,
    time: Date,
    imagePath: String,
    likes: Number,
    likedBy: [{
        username: String
    }],
    comments: [{
        userObjId: String,
        comment: String,
        likes: Number,
        time: Date,
    }]
})

const Posts = model('Posts', postSchema);

function addNewPost(userID, post, imageFile) {
    let myPost = {
        postedBy: userID,
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
        //.limit(n)
        .exec()
        .then(mongoData => {
            data = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return data;
}

async function getPost(postid) {
    let data = null;
    await Posts.findById(postid)
        .exec()
        .then(mongoData => {
            data = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return data;
}

async function getTrendingPosts() {
    let data = []
    await Posts.find({})
        .sort({ 'likes': -1 })
        .exec()
        .then(mongoData => {
            data = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return data;
}

async function getFollowingPosts(following) {
    let data = []
    //console.log(allies)
    await Posts.find({ postedBy: following })
        .sort({ 'time': -1 })
        .exec()
        .then(mongoData => {
            data = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return data;
}


// LIKING FUNCTIONS
async function likePost(likedPostID, likedByID) {

    await Posts.findByIdAndUpdate(likedPostID, { $inc: { likes: 1 } })

    let newLike = {
        username: likedByID
    }

    await Posts.findByIdAndUpdate(likedPostID, { $push: { likedBy: newLike } }).exec()
}

async function unlikePost(likedPostID, likedByID) {

    await Posts.findByIdAndUpdate(likedPostID, { $inc: { likes: -1 } })

    let liker = {
        username: likedByID
    }

    await Posts.findByIdAndUpdate(likedPostID, { $pull: { likedBy: liker } }).exec()
}

async function refreshLikes(likedPostID) {

    await Posts.findById(likedPostID)
        .then(mongoData => {
            likes = mongoData.likes;
        })

    return likes;
}


async function comment(PostID, user_id, comment) {
    let found

    let newComment = {
        userObjId: user_id,
        comment: comment,
        likes: 0,
        time: Date.now(),
    }

    await Posts.findByIdAndUpdate(PostID, { $push: { comments: newComment } }).exec()
    //.then(foundData => found = foundData)
    // console.log(found)
}

async function changePostUser(currentName, newName) {

    await Posts.updateMany({ postedBy: currentName }, { postedBy: newName }).exec()//finds all older usernames and changes them to the new one

}

module.exports = { addNewPost, getPosts, getPost, getTrendingPosts, getFollowingPosts, likePost, refreshLikes, unlikePost, comment, changePostUser }
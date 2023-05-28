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

//return posts - from class, not longer used
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

//returns specific single post - from class
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

//get all posts, sorted by like count
async function getTrendingPosts() {
    let data = []
    await Posts.find({})
        .sort({ 'likes': -1 })//sort by likes
        .exec()
        .then(mongoData => {
            data = mongoData;
        })
        .catch(err => {
            console.log('Error:' + err)
        });
    return data;
}

//using following list passed as parameter get all posts from people I follow
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

async function userPosts(user) {
    let data = []
    //console.log(allies)
    await Posts.find({ postedBy: user })
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

//for client side JS so that like count is dynamically updated
async function refreshLikes(likedPostID) {

    await Posts.findById(likedPostID)
        .then(mongoData => {
            likes = mongoData.likes;
        })

    return likes;
}

//add a comment - i used the object ID instead of the username here so that a username change wont cause problems in comment rendering
async function comment(PostID, user_id, comment) {

    let newComment = {
        userObjId: user_id,
        comment: comment,
        likes: 0,
        time: Date.now(),
    }

    await Posts.findByIdAndUpdate(PostID, { $push: { comments: newComment } }).exec()
}


async function editPost(PostID, newData, imageFile) {

    if (imageFile) {//if pic is changed
        await Posts.findByIdAndUpdate(PostID, { imagePath: imageFile }).exec()
    } else {
        //console.log("pic null")
    }

    if (newData.caption) {//only chnage if data is entered
        await Posts.findByIdAndUpdate(PostID, { message: newData.caption }).exec()
        console.log(newData)

    } else {
        console.log(newData)
    }

}

//change postedBy username when username is changed - uses updateMany method to find all posts by 'username' - my own code
async function changePostUser(currentName, newName) {

    await Posts.updateMany({ postedBy: currentName }, { postedBy: newName }).exec()//finds all older usernames and changes them to the new one

}

async function deletePost(PostID) {

    await Posts.deleteOne({ _id: PostID })
    console.log("post " + PostID + " deleted")

}

module.exports = { addNewPost, getPosts, getPost, getTrendingPosts, getFollowingPosts, userPosts, likePost, refreshLikes, unlikePost, comment, editPost, changePostUser, deletePost }
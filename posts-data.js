const posts = []

function addNewPost(post) {
    let myPost = {
        mood: post.mood,
        message: post.message,
        likes: 0,
        time: Date.now()
    }
    posts.unshift(myPost)
}

function getPosts() {
    return posts
}

module.exports = { addNewPost, getPosts }
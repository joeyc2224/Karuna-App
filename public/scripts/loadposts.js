let postsContainer = document.getElementById("post-container")

let recentPostData = []

fetch("/getposts")
    .then(response => response.json())
    .then(fetchedData => {
        recentPostData = fetchedData.posts
        updateRecentPosts()
    })

function updateRecentPosts() {
    postsContainer.innerHTML = ''
    recentPostData.forEach(function (post) {
        //console.log(post)

        let postDiv = document.createElement('div')
        postDiv.className = "post"

        let user = document.createElement('p')
        user.className = "user"
        user.innerHTML = "User: " + post.postedBy
        postDiv.appendChild(user)

        let mood = document.createElement('p')
        mood.className = "mood"
        mood.innerHTML = "Current Feeling: " + post.mood
        postDiv.appendChild(mood)

        let image = document.createElement('p')
        image.innerHTML = "<i>(Image here if user chooses to do so...)</i>"
        image.style = "font-size: 18px"
        postDiv.appendChild(image)

        let message = document.createElement('p')
        message.className = "message"
        message.innerHTML = post.message
        postDiv.appendChild(message)

        let likeCount = document.createElement('button')
        likeCount.innerHTML = "Likes: " + post.likes
        postDiv.appendChild(likeCount)

        let line = document.createElement('hr')
        postDiv.appendChild(line)

        postsContainer.appendChild(postDiv)
    })
}

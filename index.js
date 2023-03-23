//express server setup - do node.js in term to run
const express = require('express')
const app = express()
app.listen(3000, () => console.log('listening on port 3000'))

//server html pages from public folder
app.use(express.static('public'))

app.use(express.json())

app.use(express.urlencoded({ extended: false }));

const path = require('path');

const postData = require('./posts-data.js')

app.post('/newpost', (request, response) => {
    console.log(request.body)
    postData.addNewPost(request.body)
    response.redirect('/feed.html')
})

app.get('/getposts', (request, response) => {
    //console.log(postData.getPosts(3))
    response.json({
        posts: postData.getPosts()
    })
})
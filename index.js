require('dotenv').config();
const mongoDBPassword = process.env.MYMONGODBPASSWORD
const sessionSecret = process.env.MYSESSIONSECRET


//express server setup - do node.js in term to run
const express = require('express')
const app = express()
app.listen(3000, () => console.log('listening on port 3000'))

// set the view engine to ejs
app.set('view engine', 'ejs');

//server html pages from public folder
app.use(express.static('public'))

app.use(express.json())

app.use(express.urlencoded({ extended: false }));

const path = require('path');


//consts to hold expiry times in ms
const tensecs = 1000 * 10;
const threeMins = 1000 * 60 * 3;
const oneHour = 1000 * 60 * 60;

//use the sessions module and the cookie parser module
const sessions = require('express-session');
const cookieParser = require("cookie-parser");

//make cookie parser middleware available
app.use(cookieParser());

//load sessions middleware, with some config
app.use(sessions({
    secret: sessionSecret,
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false
}));


//add mongoose(MongoDB) module to connect to DB
const mongoose = require('mongoose');
//password from .env file
mongoose.connect("mongodb+srv://joeyc123:" + mongoDBPassword + "@karunadb.onlhvad.mongodb.net/Karuna?retryWrites=true&w=majority")

//data models import
const users = require('./models/users')
const postData = require('./models/posts.js')

//user check login function
function checkLoggedIn(request, response, nextAction) {
    if (request.session) {
        if (request.session.userid) {
            nextAction()
        } else {
            request.session.destroy()
            return response.redirect('/login')
        }
    }
}

//playing with ejs
app.get('/', checkLoggedIn, function (request, response) {
    response.render('pages/home');
});

app.get('/home', checkLoggedIn, function (request, response) {
    //passing data with ejs?
    var username = request.session.userid

    response.render('pages/home', {
        username: username,//passes loggged in user's name to display as ejs variable
    });

});

//user in app view routes, always checks logged in state
// app.get('/', checkLoggedIn, (request, response) => {
//     res.render('pages/home');
// })

// app.get('/home', checkLoggedIn, (request, response) => {
//     res.render('pages/home');
// })

app.get('/post', checkLoggedIn, (request, response) => {
    response.sendFile(path.resolve(__dirname, 'views/pages/post.html'))
})

//ejs based feed alternative
app.get('/feed', checkLoggedIn, async (request, response) => {

    var posts = await postData.getPosts()//get posts and store

    response.render('pages/feed', {
        posts: posts,
    });

})

// app.get('/feed', checkLoggedIn, (request, response) => {
//     response.sendFile(path.resolve(__dirname, 'views/pages/feed.html'))
// })


//user login routes
app.get('/login', (request, response) => {
    response.sendFile(path.resolve(__dirname, 'views/login/login.html'))
})

app.get('/signup', (request, response) => {
    response.sendFile(path.resolve(__dirname, 'views/login/register.html'))
})

app.get('/loginfailed', (request, response) => {
    response.sendFile(path.resolve(__dirname, 'views/login/failed-login.html'))
})



//routes for account functions
app.get('/logout', async (request, response) => {
    await users.setLoggedIn(request.session.userid, false)
    request.session.destroy()
    await console.log(users.getUsers())
    response.sendFile(path.resolve(__dirname, 'views/login/login.html'))
})

//controller for login
app.post('/login', async (request, response) => {
    let userData = request.body
    console.log(userData)

    if (await users.findUser(userData.username)) {
        console.log('user found')
        if (await users.checkPassword(userData.username, userData.password)) {//if user exists with correct password
            console.log('password matches')
            request.session.userid = userData.username
            await users.setLoggedIn(userData.username, true)
            response.redirect('/home')
        } else {
            console.log('password wrong')
            response.redirect('/loginfailed')
        }
    } else {
        console.log('no such user')
        response.redirect('/loginfailed')
    }
})

//controller for registering a new user
app.post('/register', async (request, response) => {
    console.log(request.body)
    let userData = request.body
    if (await users.findUser(userData.username)) {
        console.log('user exists')
        response.json({
            status: 'failed',
            error: 'user exists'
        })
    } else {
        users.newUser(userData.username, userData.password)
        response.redirect('/loginfailed')
    }
    console.log(users.getUsers())
})



//post functions
app.post('/newpost', async (request, response) => {
    await postData.addNewPost(request.session.userid, request.body)
    response.redirect('/feed')
})

app.get('/getposts', async (request, response) => {
    response.json({
        posts: await postData.getPosts()
    })
})

app.post('/like', async (request, response) => {
    likedPostID = request.body.id
    await postData.likePost(likedPostID)
})


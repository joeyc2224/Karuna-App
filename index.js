require('dotenv').config();
const mongoDBPassword = process.env.MYMONGODBPASSWORD
const sessionSecret = process.env.MYSESSIONSECRET


//express server setup - do node.js in term to run
const express = require('express')
const app = express()
app.listen(3000, () => console.log('listening on port 3000'))

//server html pages from public folder
app.use(express.static('public', { index: 'user-views/login.html' }))

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
            return response.redirect('/user-views/login.html')
        }
    }
}

//controller for the main app view, depends on user logged in state
app.get('/app', checkLoggedIn, (request, response) => {
    // response.redirect('./application.html')
    response.redirect('home.html')
})


app.get('/logout', async (request, response) => {
    await users.setLoggedIn(request.session.userid, false)
    request.session.destroy()
    await console.log(users.getUsers())
    response.redirect('/user-views/login.html')
})

app.post('/pagecheck', async (request, response) => {
    //need some kind of function to check if the user is still logged in when accessing html
})

//controller for login
app.post('/login', async (request, response) => {
    let userData = request.body
    console.log(userData)

    if (await users.findUser(userData.username)) {
        console.log('user found')
        if (await users.checkPassword(userData.username, userData.password)) {
            console.log('password matches')
            request.session.userid = userData.username
            await users.setLoggedIn(userData.username, true)
            response.redirect('home.html')
        } else {
            console.log('password wrong')
            response.redirect('/user-views/failed-login.html')
        }
    } else {
        console.log('no such user')
        response.redirect('/user-views/failed-login.html')
    }
})

//controller for registering a new user
app.post('/register', async (request, response) => {
    console.log(request.body)
    let userData = request.body
    // console.log(userData.username)
    if (await users.findUser(userData.username)) {
        console.log('user exists')
        response.json({
            status: 'failed',
            error: 'user exists'
        })
    } else {
        users.newUser(userData.username, userData.password)
        response.redirect('/home.html')
    }
    console.log(users.getUsers())
})


//posting/posts functions
app.post('/newpost', async (request, response) => {
    await postData.addNewPost(request.session.userid, request.body)
    response.redirect('/feed.html')
})

app.get('/getposts', async (request, response) => {
    response.json({
        posts: await postData.getPosts()
    })
})



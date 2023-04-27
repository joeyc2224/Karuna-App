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
    response.render('pages/home', {
        page: "home"//for setting active class on navbar
    });
});

app.get('/home', checkLoggedIn, function (request, response) {
    //passing data with ejs?
    var username = request.session.userid

    response.render('pages/home', {
        username: username,//passes loggged in user's name to display as ejs variable
        page: "home"
    });

});

app.get('/post', checkLoggedIn, (request, response) => {
    response.render('pages/post', {
        page: "post"//for setting active class on navbar
    });
})

//ejs based feed 
app.get('/feed', checkLoggedIn, async (request, response) => {

    var posts = await postData.getPosts()//get posts and store

    response.render('pages/feed', {
        posts: posts,//post data sent as variable
        page: "feed"//for setting active class on navbar
    });

})

app.get('/profile', checkLoggedIn, async (request, response) => {

    var userData = await users.findUser(request.session.userid)
    console.log(userData)

    response.render('pages/profile', {
        user: userData,
        page: "profile"//for setting active class on navbar
    });

})


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

app.get('/signupfailed', (request, response) => {
    response.sendFile(path.resolve(__dirname, 'views/login/failed-signup.html'))
})



//routes for account functions
app.get('/logout', async (request, response) => {
    console.log('User ' + request.session.userid + " logged out...")
    await users.setLoggedIn(request.session.userid, false)
    request.session.destroy()
    response.redirect('/login')
})

//controller for login
app.post('/login', async (request, response) => {

    let userData = request.body

    if (await users.findUser(userData.username)) {
        if (await users.checkPassword(userData.username, userData.password)) {//if user exists with correct password
            console.log('User ' + userData.username + " logged in...")
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
        response.redirect('/signupfailed')
    } else {
        users.newUser(userData.username, userData.password)//adds user to db
        request.session.userid = userData.username
        await users.setLoggedIn(userData.username, true)//then logs them in
        response.redirect('/home')
    }
    console.log(users.getUsers())
})



//post functions
app.post('/newpost', async (request, response) => {
    await postData.addNewPost(request.session.userid, request.body)
    response.redirect('/feed')
})

app.post('/like', async (request, response) => {
    likedPostID = request.body.id
    await postData.likePost(likedPostID)
    response.redirect('/feed')
})




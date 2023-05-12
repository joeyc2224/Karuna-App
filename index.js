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

const multer = require('multer');

const upload = multer({ dest: './public/uploads/' })

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
const postData = require('./models/posts.js');
const { name } = require('ejs');
const { stringify } = require('querystring');

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

app.get('/home', checkLoggedIn, async (request, response) => {

    var posts = await postData.getPosts()//get posts and store

    response.render('pages/home', {
        posts: posts,//post data sent as variable
        page: "home"//for setting active class on navbar
    });

});

app.get('/post', checkLoggedIn, (request, response) => {
    response.render('pages/post', {
        page: "post"//for setting active class on navbar
    });
})

//ejs based feed 
app.get('/allies', checkLoggedIn, async (request, response) => {

    var posts = await postData.getPosts()//get posts and store

    response.render('pages/allies', {
        posts: posts,//post data sent as variable
        page: "feed"//for setting active class on navbar
    });

})

app.get('/myprofile', checkLoggedIn, async (request, response) => {

    var userData = await users.findUser(request.session.userid)//get user data from users.js

    response.render('profiles/myProfile', {
        user: userData, //user data 
        page: "profile"//for setting active class on navbar
    });

})

app.post('/editprofile', upload.single('profilePic'), async (request, response) => {

    let filename = null

    if (request.file && request.file.filename) { //check that a file was passes with a valid name
        filename = 'uploads/' + request.file.filename
    }

    await users.editProfile(request.session.userid, request.body, filename)
    response.redirect('/myprofile')
})


app.post('/viewprofile', checkLoggedIn, async (request, response) => {

    var userData = await users.findUser(request.body.name)//get user data from users.js
    //console.log(request.body.name)

    response.render('profiles/viewProfile', {
        user: userData, //user data 
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
app.post('/newpost', upload.single('myImage'), async (request, response) => {

    let filename = null
    if (request.file && request.file.filename) { //check that a file was passes with a valid name
        filename = 'uploads/' + request.file.filename
    }

    await postData.addNewPost(request.session.userid, request.body, filename)
    response.redirect('/allies')
})

app.post('/like', async (request, response) => {

    likedPostID = request.body.likedPostID

    await postData.likePost(likedPostID, request.session.userid)

    //stuff that provides new like value but not working without refreshing whole page yet
    // var likes = await postData.refreshLikes(likedPostID)
    // console.log(likes)

    //response.redirect('/feed')

    response.json(
        { likeNum: await postData.refreshLikes(likedPostID) }
    )
})

app.post('/follow', async (request, response) => {
    await users.followUser(request.body.name, request.session.userid)
    response.redirect('/home')
})





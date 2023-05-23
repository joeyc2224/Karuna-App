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
const journalData = require('./models/journals.js');

const { name } = require('ejs');
const { stringify } = require('querystring');
const session = require('express-session');

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

//default page return 
app.get('/', checkLoggedIn, function (request, response) {
    response.render('pages/home', {
        page: "home"//for setting active class on navbar
    });
});

app.get('/home', checkLoggedIn, async (request, response) => {

    var posts = await postData.getPosts()//get posts and store

    response.render('pages/home', {
        posts: posts,//post data sent as variable
        currentUser: request.session.userid,
        page: "home"//for setting active class on navbar
    });

});

app.get('/journal', checkLoggedIn, (request, response) => {

    response.render('pages/journal', {
        page: "journal"//for setting active class on navbar
    });
})


//SHOW JOURNAL LOGS FROM ALLIES
app.get('/allies', checkLoggedIn, async (request, response) => {

    var userData = await users.findUser(request.session.userid)//get user data from users.js

    let allies = []

    userData.allies.forEach(function (ally) {
        allies.push(ally.username)
    })

    allies.push(request.session.userid)//add current user to list so their posts appear too

    var logs = await journalData.getAlliesJournals(allies)//get posts and store

    response.render('pages/allies', {
        posts: logs,//post data sent as variable
        currentUser: request.session.userid,
        page: "feed"//for setting active class on navbar
    });

})

app.get('/inbox', checkLoggedIn, async (request, response) => {

    var userData = await users.findUser(request.session.userid)//get user data from users.js

    response.render('pages/inbox', {
        user: userData, //user data 
        page: "inbox"//for setting active class on navbar
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

    console.log(request.body.username)

    if (request.file && request.file.filename) { //check that a file was passes with a valid name
        filename = 'uploads/' + request.file.filename
    }

    var nameChange = await users.editProfile(request.session.userid, request.body, filename)//var stores bool returned for username change

    if (nameChange === true) {
        request.session.userid = request.body.username//changes the current user session to new username otherwise profile will not load correctly
        response.redirect('/myprofile')

    } else {
        response.redirect('/myprofile')
    }

})


//VIEW OTHER USER PROFILE
app.get('/users/:userId', checkLoggedIn, async (request, response) => {

    var userData = await users.findUser(request.params.userId)//get user data from users.js
    //console.log(request.body.name)

    response.render('profiles/viewProfile', {
        user: userData, //user data 
        currentUser: request.session.userid,
        page: ""//for setting active class on navbar
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


//bcrypt compatible login
app.post('/login', async (request, response) => {

    let userData = request.body

    if (await users.findUser(userData.username)) {
        console.log('User ' + userData.username + " logged in...")
        await users.checkPassword(userData.username, userData.password, async function (isMatch) {//if user exists with correct password
            if (isMatch) {
                console.log('password matches')
                request.session.userid = userData.username
                await users.setLoggedIn(userData.username, true)
                response.redirect('/home')
            } else {
                console.log('password wrong')
                response.redirect('/loginfailed')
            }
        })
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
    //console.log(users.getUsers())
})



//NEW JOURNAL CHECK IN
app.post('/newcheckin', async (request, response) => {

    await journalData.addNewLog(request.session.userid, request.body)
    response.redirect('/allies')

})


//NEW STANDARD
app.post('/newpost', upload.single('myImage'), async (request, response) => {

    let filename = null
    if (request.file && request.file.filename) { //check that a file was passes with a valid name
        filename = 'uploads/' + request.file.filename
    }

    await postData.addNewPost(request.session.userid, request.body, filename)
    response.redirect('/home')
})




//LIKING/UNLIKE ROUTES
app.post('/like', async (request, response) => {

    likedPostID = request.body.likedPostID

    await postData.likePost(likedPostID, request.session.userid)

    response.json(
        { likeNum: await postData.refreshLikes(likedPostID) }
    )
})

app.post('/unlike', async (request, response) => {

    likedPostID = request.body.likedPostID

    await postData.unlikePost(likedPostID, request.session.userid)

    response.json(
        { likeNum: await postData.refreshLikes(likedPostID) }
    )
})


//handles emoji reaction in journal posts
app.post('/reaction', async (request, response) => {

    console.log(request.body)

    reactPostID = request.body.postID
    emoji = request.body.emoji

    await journalData.reactJournal(reactPostID, emoji, request.session.userid)
    response.redirect('/allies')
})



// follow/unfollow routes from profile page buttons
app.post('/follow', async (request, response) => {
    await users.followUser(request.body.name, request.session.userid)
    response.redirect('/users/' + request.body.name)
})

app.post('/unfollow', async (request, response) => {
    await users.unfollowUser(request.body.name, request.session.userid)
    response.redirect('/users/' + request.body.name)
})



//allies
app.post('/requestally', async (request, response) => {
    await users.requestAlly(request.body.name, request.session.userid)
    response.redirect('/users/' + request.body.name)
})

app.post('/unrequestally', async (request, response) => {
    await users.unrequestAlly(request.body.name, request.session.userid)
    response.redirect('/users/' + request.body.name)
})

//accept response
app.post('/acceptally', async (request, response) => {
    await users.acceptAlly(request.body.name, request.session.userid)
    response.redirect('/inbox')
})

//decline response
app.post('/declineally', async (request, response) => {
    await users.unrequestAlly(request.session.userid, request.body.name)
    response.redirect('/inbox')
})

app.post('/removeally', async (request, response) => {
    await users.removeAlly(request.session.userid, request.body.name)
    response.redirect('/home')
})


//get mood data for journal graph
app.get('/getmooddata', async (request, response) => {
    response.json(
        { logs: await journalData.getUserJournals(request.session.userid) }//get just current user's check in data
    )
})










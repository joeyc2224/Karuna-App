const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const journalSchema = new Schema({
    postedBy: String,
    mood: Number,
    message: String,
    time: Date,
    reactions: [{
        username: String,
        reaction: String
    }]
})

const Journal = model('Journal', journalSchema);

function addNewLog(userID, log) {
    let myJournalLog = {
        postedBy: userID,
        mood: log.mood,
        message: log.message,
        time: Date.now(),
    }
    //create new collection data in mongo
    Journal.create(myJournalLog)
        .catch(err => {
            console.log("Error: " + err)
        })
}

//return check in posts - similar to posts.js model - based on classwork
async function getJournals(n = 20) {
    let data = []
    await Journal.find({})
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

//only return mood check in posts from allies
async function getAlliesJournals(allies) {
    let data = []
    //console.log(allies)
    await Journal.find({ postedBy: allies })
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


//return current user journal posts
async function getUserJournals(user) {
    let data = []
    await Journal.find({ postedBy: user })//find journal data with just current username as poster
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

//react to allies posts with fun emojis
async function reactJournal(journalID, emoji, reactByID) {

    let newReact = {
        username: reactByID,
        reaction: emoji
    }

    await Journal.findByIdAndUpdate(journalID, { $push: { reactions: newReact } }).exec()
}

async function changeJournalUser(currentName, newName) {

    await Journal.updateMany({ postedBy: currentName }, { postedBy: newName }).exec()//finds all older usernames and changes them to the new one

}

module.exports = { addNewLog, getJournals, reactJournal, getUserJournals, getAlliesJournals, changeJournalUser }
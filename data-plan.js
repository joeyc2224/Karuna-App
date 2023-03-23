//Data plan for the user's profile
userProfile = {
    userID: 46778,
    username: "joey",
    dateJoined: "26/3/22",
    journalStreak: 12,
    minutesMeditated: 112,
    closeFriends: {//freinds that the user would like to share their daily checkins with
        userIDs: [
            12342,
            67644,
            12577,
            86756,
        ],
        usernames: [
            "claire",
            "dan",
            "bobby",
            "jimbo"
        ]
    }
}

//data that could be present in the daily check in posts
checkInPost = {
    userID: 46778,
    username: "joeyc123",
    jorunalID: 45674,
    share: true,//user can decided whether or not they want to share their check in - data will still be recorded to database for past mood chart regardless
    time: Date.now(),
    moodRating: "Happy",
    journalLog: "A good day......",
    image: "7653.jpg",//images can accompany a journal log
    journalStreak: 12
}

//tradition post format - however users share wellness practices that they have found useful
feedPost = {
    userID: 46778,
    username: "joeyc123",
    postID: 739122,
    time: Date.now(),
    category: "meditation",
    image: "",
    video: "5340.mp4",
    caption: "The importance of sleep....",
    likes: 55,
}
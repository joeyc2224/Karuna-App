const { response } = require('express')
const express = require('express')
const { request } = require('http')
const app = express()

app.listen(3000, () => console.log('listening on port 3000'))

const path = require('path')

app.use(express.static('public'))

app.get('/home', (request, response) => {
    response.sendFile(path.join(__dirname, '/home.html'))
})
"use strict";

const express = require('express')
const app = express()
const port = 3000

// Ajout du middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${req.get('User-Agent')}`)
    next()
})

app.get('/', (req, res) => {
    console.log("Route par défaut");

    res.send('Hello World !')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
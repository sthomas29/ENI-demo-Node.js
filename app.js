"use strict";

const express = require('express')
const app = express()
const port = 3000

const cities = ['Nantes', 'Paris', 'Quimper']


// Ajout du middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${req.get('User-Agent')}`)
    next()
})

app.get('/', (req, res) => {
    console.log("Route par défaut");

    res.send('Hello World !')
})


// Route vers la liste de ville
app.get('/cities', (req, res) => {
    res.send(cities.join(', '))
})

// Route vers une ville spécifique selon son id
app.get('/cities/:id', (req, res, next) => {
    if (1 > req.params.id || req.params.id > cities.length) {
        return res.status(404).send('Error: No city found')
    }
    res.send(cities[req.params.id - 1])
})

// Middleware captant l'erreur et affichant une page 404
app.use((req, res) => {
    res.status(404).send('Error 404: Page not found');
});



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
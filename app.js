"use strict";

const express = require('express')
const app = express()
const port = 3000

// Récupération du path
const path = require("path");

// Définition de l'encodeur JSON ==> Extended=true autorise l'encodage d'objet complexe
app.use(express.urlencoded({ extended: true }))

// Ajout express-validator
const { body, validationResult } = require('express-validator')

// Ajout MongoDB
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');

// Ouverture Connexion à mongodb

// Adresse d'accès à la base de données, si elle n'existe pas, elle est créée
const uri = "mongodb://localhost:27017/cities_app";

// Instanciation d'un client qui exécutera les requêtes
const client = new MongoClient(uri, { useNewUrlParser: true });

// Instanciation de la connexion sur la base de données à partir du client
const db = client.db("cities_app");

// Test de connexion à partir d'une promesse
client.connect()
    .then(() => {
        console.log('Connected successfully to server');
    })
    .catch((err) => {
        console.log('Error connecting to server:', err);
    });



const cities = ['Nantes', 'Paris', 'Quimper']


// Configuration du moteur de vue
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Ajout d'un middleware de démo
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${req.get('User-Agent')}`)
    next()
})

// Ajout middleware CSP pour empêcher le blocage des requêtes par le navigateur web
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        [
            // Tout charger depuis le même domaine (self)
            "default-src 'self'",

            // autorise scripts et les styles locaux + inline (utile en dev) et les CDN
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",

            // Images locales ou en base64
            "img-src 'self' data:",

            // autorise fetch/XHR vers ton API locale (depuis l'extérieur par ex. avec les CDN)
            "connect-src 'self' http://localhost:3000 https://cdn.jsdelivr.net",
        ].join("; ")
    );
    next();
});

// On laisse la route par défaut en 1er
app.get('/', (req, res) => {
    console.log("Route par défaut");
    res.send('Hello World !')
})

// Route vers la liste de villes
app.get('/cities', (req, res) => {
    db.collection('cities')
        .find()
        .toArray()
        .then((cities) => {
            //On redirige vers la page cities/index.ejs en passant en paramètre la liste de villes
            res.render('cities', { cities: cities })
        })
})

// Modification de la méthode pour ajouter les contraintes de validation sur
// le champ 'city'
app.post('/cities',
    body('city')
        .isLength({ min: 3 })
        .withMessage('City name must be at least 3 characters long'),

    // Routage requête en encapsulant les erreurs éventuelles
    (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).render('cities.ejs', {
                errors: errors.array(),
                cities: cities,
                city: req.body.city
            })
        }
        cities.push(req.body.city)
        res.redirect('/cities')
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
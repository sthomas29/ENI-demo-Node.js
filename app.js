"use strict";

const express = require('express')
const app = express()
const port = 3000

// Récupération du path
const path = require("path");

// Définition de l'encodeur JSON ==> Extended=true autorise l'encodage d'objet complexe
app.use(express.urlencoded({ extended: true }))


// Ajout JWT
const checkTokenMiddleware = require('./auth-JWT')

// Ajout express-validator
const { body, validationResult, check } = require('express-validator')

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

// Instanciation de mongoose
const mongoose = require('mongoose');


// Connexion avec MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/test').then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.log('Error connecting to MongoDB:', err);
});

// import de la fonction database()
const { database } = require('./db/database');

// import des modèles
const City = require('./models/City');
const Country = require('./models/Country');
const Mayor = require('./models/Mayor');
const { router } = require('./api/routes/cities-route');

/*********************************************************/
/*           Initialisation de la base MongoDB           */
/*********************************************************/

// Initialisation de la database
database()

/*********************************************************/
/*           Configuration des middlewares                */
/*********************************************************/

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

/*********************************************************/
/*              Définition des routes                    */
/*********************************************************/

// On laisse la route par défaut en 1er
app.get('/', (req, res) => {
    console.log("Route par défaut");
    res.send('Hello World !')
})

// Route vers la liste de villes
// Récupération des villes grâce à Mongoose
app.get('/cities', (req, res) => {
    City.find().then((cities) => {
        res.render('cities.ejs', { cities: cities })
    })
})

app.get('/cities/create', (req, res) => {
    res.render('cities/create')
})

// Modification de la méthode pour ajouter les contraintes de validation sur
// le champ 'city'
app.post('/cities',
    body('city')
        .isLength({ min: 3 })
        .withMessage('City name must be at least 3 characters long'),

    // Routage requête en encapsulant les erreurs éventuelles
    // On transforme en requête asynchrone pour prendre en compte les délais de
    // connexion vers la base de données
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).render('cities/create', {
                errors: errors.array(),
                city: req.body.city
            })
        }

        // On remplace l'ajout par un insert sur la base
        await City.create({
            name: req.body.city,
            uuid: uuidv4()
        })
        res.redirect('/cities')
    }
)

// Route vers une ville spécifique selon son idc
// On modifie la méthode findOneByID pour recevoir les données à partir de lUUID.
app.get('/cities/:uuid', (req, res, next) => {
    City.findOne({ uuid: req.params.uuid }).then((city) => {
        if (city) {
            res.render('cities/city', { city: city })
        } else {
            res.status(404).send('Error: No city found')
        }
    })
})

// Mise à jour d'un UUID ==> formulaire de mise à jour
app.get('/cities/:uuid/update', (req, res) => {
    City.findOne({ uuid: req.params.uuid }).then((city) => {
        if (city) {
            res.render('cities/update.ejs', { city: city })
        } else {
            res.status(404).send('Error: No city found')
        }
    })
})

// Update d'un UUID
app.post('/cities/:uuid/update',
    body('city')
        .isLength({ min: 3 })
        .withMessage('City name must be at least 3 characters long'),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).render('cities/update.ejs', {
                errors: errors.array(),
                city: {
                    name: req.body.city,
                    uuid: req.params.uuid
                }
            })
        }
        await City.findOneAndUpdate({ uuid: req.params.uuid }, { name: req.body.city })
        res.redirect('/cities')
    }
)

app.post('/cities/:uuid/delete', async (req, res, next) => {
    await City.findOneAndDelete({ uuid: req.params.uuid }, { name: req.body.city })
})

/*********************************************************/
/*                 Mise en oeuvre de l'API               */
/*********************************************************/

// Import des routes
const cityRoutes = require('./api/routes/cities-route');

// Utilisation de du middleware HTTP => JSON
app.use(express.json());

//Définition des routes avec le suffixe /api
app.use('/api', cityRoutes);


/*********************************************************/
/*                 Authentification JWT                  */
/*********************************************************/

const jwt = require('jsonwebtoken');
const { SECRET } = require('./env');

const users = [
    {
        id: 1,
        username: 'admin',
        password: 'admin'
    }
]
app.post('/authentication_token',
    check('username').isLength({ min: 2 }).withMessage('must be at least 2 chars long'),
    check('password').isLength({ min: 2 }).withMessage('must be at least 2 chars long'),

    async (req, res, next) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const user = users.find(u => u.username === req.body.username && u.password === req.body.password)
        if (!user) {
            return res.status(400).json({ message: 'Error. Wrong login or password' })
        }

        // Création du token à partir des SECRETS et données fournies
        // dans la requête POST
        const token = jwt.sign(
            { id: user.id, username: user.username },
            SECRET,
            { expiresIn: '3 hours' })

        // Return le TOKEN    
        return res.json({ access_token: token })
    }
)

/********************************************************************/
/*                     Implémentation de Swagger                    */
/********************************************************************/

// implémentation de swagger-autogen pour la génération automatique de
// la documentation à partir de toutes les routes de l'app.
const swaggerAutogen = require('swagger-autogen')()

// Fichier de stockage de la structure du site
const outputFile = './swagger_output.json'

// Implémentation de l'interface graphique de Swagger
const swaggerUi = require('swagger-ui-express');

// Génération de la documentation dans une promessede
swaggerAutogen(outputFile, ['./app.js']).then(() => {

    // On lit le fichier seulement une fois qu'il est généré
    // par swaggerAutogen()
    const swaggerDocument = require('./swagger_output.json');

    // Définit la liste des middleware à charger pour la route '/docs'
    app.use(
        // route pour l'accès à la documentation générée par Swagger
        '/docs',

        // Middleware lançant un serveur de fichiers statiques
        // pour l'interface Swagger
        swaggerUi.serve,

        // Charge dans l'interface statiques le JSON généré auparavant.
        swaggerUi.setup(swaggerDocument));


    /********************************************************************
        On rajoute dans la promesse : 
            
            - Le MiddleWare pour les page 404
            - Le lancement du server node

        L'objectif est d'attendre que le fichier json et la route /docs
        soit bien chargés/générés avant lancement du serveur.
    *********************************************************************/

    /********************************************************************/
    /*      Middleware captant l'erreur et affichant une page 404       */
    /********************************************************************/
    app.use((req, res) => {
        res.status(404).send('Error 404: Page not found');
    });

    /********************************************************************/
    /*                        Lancement du Server                       */
    /********************************************************************/
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
})



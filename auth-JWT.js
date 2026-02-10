
//const { body, validationResult, check } = require('express-validator')
const { check } = require('express-validator')


/******************************************************/
/*          Authentification JsonWebToken JT          */
/******************************************************/
const jwt = require('jsonwebtoken');
const { SECRET } = require('./env.js')

// Fonction de récupération du token dans les headers de la requête
function extractBearerToken(headerValue) {

    if (typeof headerValue !== 'string') {
        return false
    }
    // Regex vérifiant le format attendu ==> "bearer TOKEN"
    const matches = headerValue.match(/(bearer)\s+(\S+)/i)

    // Retourne seulement le token (stocké en 2ème position de 'matches')
    // si et seulement si 'matches' est différent de 'undefined'
    return matches && matches[2]
}

// Fonction middleware de contrôle du token
function checkTokenMiddleware(req, res, next) {

    // Récupère le token de la requête
    // si et seulement si il existe  bien dans la requête (headers.authorization)
    const token = req.headers.authorization && extractBearerToken(req.headers.authorization)

    if (!token) {
        return res.status(401).json({ message: 'Error. Need a token' })
    }

    /* S'il existe, on demande à jwt de vérifier le token généré avec les SECRET
    Selon le client utilisé, le token est stocké :
     - dans le localStorage ou sessionStorage du navigateur
     - dans un cookie
     - dans les headers d'une requête avec PostMan (req.headers/authorization)
    */
    jwt.verify(token, SECRET, (err, decodedToken) => {
        if (err) {
            res.status(401).json({ message: 'Error. Bad token' })
        } else {

            // S'il est valide, le middleware passe la requête au middleware
            // suivant ou au serveur
            return next()
        }
    })
}

// On exporte uniquement la fonction 
module.exports = checkTokenMiddleware;
require('dotenv').config()

const SECRET = process.env.SECRET

if (!SECRET) {
    console.error("SECRET n'est pas défini !");
    process.exit(1); // stoppe le serveur si la clé est absente
}
module.exports = { SECRET };
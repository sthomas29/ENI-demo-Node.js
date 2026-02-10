require('dotenv').config()

const SECRET = process.env.SECRET

if (!SECRET) {
    console.error("SECRET n'est pas défini !");

    // Stoppe le serveur si la clé est absente
    process.exit(1);
}
module.exports = { SECRET };

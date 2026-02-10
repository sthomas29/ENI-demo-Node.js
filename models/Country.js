const mongoose = require("mongoose")

// Création du schéma
const countrySchema = new mongoose.Schema({
    name: String,
    uuid: String,
    cities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    }],
    // Ajout d'un attribut
    europeanUnion: Boolean
});

// Export d'un objet pour intéragir avec la base
module.exports = mongoose.model("Country", countrySchema);
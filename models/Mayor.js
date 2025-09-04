const mongoose = require("mongoose")

// Création du schéma
const mayorSchema = new mongoose.Schema({
    name: String,
    uuid: String,
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    }
});

// Export d'un objet pour intéragir avec la base
module.exports = mongoose.model("Mayor", mayorSchema);


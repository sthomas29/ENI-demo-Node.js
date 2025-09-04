const mongoose = require("mongoose")

const citySchema = new mongoose.Schema({
    name: String,
    uuid: String,
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country'
    },
    mayor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mayor'
    },
    sisterCities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    }],
});

// Export d'un objet pour intéragir avec la base
module.exports = mongoose.model("City", citySchema);
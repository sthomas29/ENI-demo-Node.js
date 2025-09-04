/*
Fonction de réinitialisation de la base de données

*/
const Country = require('../models/Country');
const City = require('../models/City');
const Mayor = require('../models/Mayor');


const { v4: uuidv4 } = require('uuid');


async function database() {
    await Country.deleteMany()
    await City.deleteMany()
    let sp = Country({ name: 'Spain', uuid: uuidv4(), europeanUnion: true });
    await sp.save();
    let fr = Country({ name: 'France', uuid: uuidv4(), europeanUnion: true });
    await fr.save();
    let uk = Country({ name: 'United Kingdom', uuid: uuidv4(), europeanUnion: false });
    await uk.save();
    let london = City({ name: 'London', uuid: uuidv4(), country: uk._id, population: 8900000 });
    await london.save();
    let paris = City({ name: 'Paris', uuid: uuidv4(), country: fr._id, population: 2200000 });
    await paris.save();
    let saintBrevin = City({ name: 'Saint-Brevin-les-Pins', uuid: uuidv4(), country: fr._id, population: 14000 });
    await saintBrevin.save();
    let valencia = City({ name: 'Valencia', uuid: uuidv4(), country: sp._id, population: 800000 });
    await valencia.save();
    sp.cities.push(valencia);
    await sp.save();
    fr.cities.push(paris);
    await fr.save();
    fr.cities.push(saintBrevin);
    await fr.save();
    uk.cities.push(london);
    await uk.save();
    const europeanUnion = await Country.find({ europeanUnion: true })

    // Filtre sur les countries dont europeanUnion est true 
    await City.find({ country: { $in: europeanUnion } })

        //Filtre les données provenant du champ 'country' 
        // - en conservant le name ==> 'name'
        // - en excluant l'_id ==> -_id
        .populate({
            path: 'country',
            select: 'name -_id'
        })

        // On affiche donc seulement name(de city) et le name déjà filtré
        // de 'country'. On n'affiche pas l'_id de city.
        .select({
            _id: 0,
            name: 1,
            country: 1
        })
        // Le résultat est stocké dans city et affiché dans la console.
        .then((cities) => {
            console.log('Cities in EU-$populate:', cities)
        })

    // Select villes de l'Union Européenne
    await City.aggregate([
        // jointure avec la table country entre localField et foreignField
        // alias de la jointure avec as 'country'
        { $lookup: { from: 'countries', localField: 'country', foreignField: '_id', as: 'country' } },

        // Décomposition du tableau $country en autant d'objets qu'il y a de jointures 
        { $unwind: '$country' },

        // Restriction sur le booléen country.europeanUnion
        { $match: { 'country.europeanUnion': true } },

        // Choix des champs à projeter
        { $project: { _id: 0, country: '$country.name', name: 1 } },

        // tri du résultat par ordre décroissant -1 (croissant 1)
        { $sort: { population: -1 } },
    ])
        // Récupère le résultat et l'affiche dans la console
        .then((cities) => {
            console.log('Cities in EU-$lookup:', cities)
        })

    // Filtre sur les population > 1 000 000
    await City.find({ population: { $gt: 1000000 } })

        // On récupère sans restriction l'ensemble des objets 'country' après
        // le filtre sur la population
        .populate('country')

        // On affiche le résultat en filtrant seulement le nom de la country
        //avec le callback. 
        .then((cities) => {
            console.log('Countries having cities with population > 1000000:',
                cities.map((city) => city.country.name))
        }
        )
    // cities having population less than 1000000 and in EU
    await City.find({ population: { $lt: 1000000 }, country: { $in: europeanUnion } })

        //Filtre les données provenant du champ 'country' 
        // - en conservant le name ==> 'name'
        // - en excluant l'_id ==> -_id
        .populate({
            path: 'country',
            select: 'name -_id'
        })

        // On affiche donc seulement name(de city) et le name déjà filtré
        // de 'country'. On n'affiche pas l'_id de city.
        .select({
            _id: 0,
            name: 1,
            country: 1
        })

        // Le résultat est stocké dans city et affiché dans la console.
        .then((cities) => {
            console.log('Cities having population less than 1000000 and in EU:', cities)
        }
        )

    // sort cities by population
    await City.find().sort({ population: -1 })
        // Le résultat est stocké dans city et affiché dans la console.
        .then((cities) => {
            console.log('Cities sorted by population:', cities)
        }
        )
    // count population by country
    await City.aggregate([

        // Fonction d'agrégation
        // On regroupe par country puis on fait une somme sur le champ population
        { $group: { _id: '$country', population: { $sum: '$population' } } },

        // jointure avec la table country entre localField et foreignField
        // alias de la jointure avec as 'country'
        { $lookup: { from: 'countries', localField: '_id', foreignField: '_id', as: 'country' } },

        // Décomposition du tableau $country en autant d'objets qu'il y a de jointures 
        { $unwind: '$country' },


        // Choix des champs à projeter
        { $project: { _id: 0, country: '$country.name', population: 1 } }
    ])
        // Affiche le résultat
        .then((cities) => {
            console.log('Population by country:', cities)
        })


    // count population by country that are over 1000000
    await City.aggregate([

        // Fonction d'agrégation
        // On regroupe par country puis on fait une somme sur le champ population
        { $group: { _id: '$country', population: { $sum: '$population' } } },

        // jointure avec la table country entre localField et foreignField
        // alias de la jointure avec as 'country'
        { $lookup: { from: 'countries', localField: '_id', foreignField: '_id', as: 'country' } },

        // Décomposition du tableau $country en autant d'objets qu'il y a de jointures 
        { $unwind: '$country' },

        // Choix des champs à projeter
        { $project: { _id: 0, country: '$country.name', population: 1 } },

        // Restriction sur la population > à 1 000 000
        { $match: { population: { $gt: 1000000 } } }
    ])
        // Affichage du résultat
        .then((cities) => {
            console.log('Population by country that are over 1000000:', cities)
        }
        )
}

module.exports = { database };
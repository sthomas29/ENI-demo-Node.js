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
    await City.find({ country: { $in: europeanUnion } })
        .populate({
            path: 'country',
            select: 'name -_id'
        })
        .select({
            _id: 0,
            name: 1,
            country: 1
        })
        .then((cities) => {
            console.log('Cities in EU:', cities)
        })
    await City.aggregate([
        { $lookup: { from: 'countries', localField: 'country', foreignField: '_id', as: 'country' } },
        { $unwind: '$country' },
        { $match: { 'country.europeanUnion': true } },
        { $project: { _id: 0, country: '$country.name', name: 1 } },
        { $sort: { population: -1 } },
    ])
        .then((cities) => {
            console.log('Cities in EU:', cities)
        })
    await City.find({ population: { $gt: 1000000 } })
        .populate('country')
        .then((cities) => {
            console.log('Countries having cities with population > 1000000:', cities.map((city) => city.country.name))
        }
        )
    // cities having population less than 1000000 and in EU
    await City.find({ population: { $lt: 1000000 }, country: { $in: europeanUnion } })
        .populate({
            path: 'country',
            select: 'name -_id'
        })
        .select({
            _id: 0,
            name: 1,
            country: 1
        })
        .then((cities) => {
            console.log('Cities having population less than 1000000 and in EU:', cities)
        }
        )
    // sort cities by population
    await City.find().sort({ population: -1 })
        .then((cities) => {
            console.log('Cities sorted by population:', cities)
        }
        )
    // count population by country
    await City.aggregate([
        { $group: { _id: '$country', population: { $sum: '$population' } } },
        { $lookup: { from: 'countries', localField: '_id', foreignField: '_id', as: 'country' } },
        { $unwind: '$country' },
        { $project: { _id: 0, country: '$country.name', population: 1 } }
    ])
        .then((cities) => {
            console.log('Population by country:', cities)
        })
    // count population by country that are over 1000000
    await City.aggregate([
        { $group: { _id: '$country', population: { $sum: '$population' } } },
        { $lookup: { from: 'countries', localField: '_id', foreignField: '_id', as: 'country' } },
        { $unwind: '$country' },
        { $project: { _id: 0, country: '$country.name', population: 1 } },
        { $match: { population: { $gt: 1000000 } } }
    ])
        .then((cities) => {
            console.log('Population by country that are over 1000000:', cities)
        }
        )
}

module.exports = { database };
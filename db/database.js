/*
Fonction de réinitialisation de la base de données

*/
const Country = require('../models/Country');
const City = require('../models/City');
const Mayor = require('../models/Mayor');


const { v4: uuidv4 } = require('uuid');


async function database() {

    // Vidade des tables
    await Country.deleteMany()
    await City.deleteMany()
    await Mayor.deleteMany()

    /** OneToOne */
    const dupont = new Mayor({
        name: 'Jean Dupont',
        uuid: uuidv4()
    })
    await dupont.save()
    const marseille = new City({
        name: 'Marseille',
        uuid: uuidv4(),
        mayor: dupont._id
    })
    await marseille.save()

    await City.findOne({ name: 'Marseille' })
        .populate('mayor')
        .then((city) => {
            console.log('City:', city)
            console.log('Mayor:', city.mayor)
        })
        .catch((error) => {
            console.log('Error:', error)
        })

    dupont.city = marseille._id
    await dupont.save()

    await Mayor.findOne({ name: 'Jean Dupont' })
        .populate('city')
        .then((mayor) => {
            console.log('Mayor:', mayor)
            console.log('City:', mayor.city)
        })
        .catch((error) => {
            console.log('Error:', error)
        })
    /** ManyToOne */
    const france = new Country({
        name: 'France',
        uuid: uuidv4()
    })
    await france.save()
    const niort = new City({
        name: 'Niort',
        uuid: uuidv4(),
        country: france._id
    })
    await niort.save()
    City.findOne({ name: 'Niort' })
        .populate('country')
        .then((city) => {
            console.log('City:', city)
            console.log('Country:', city.country)
        })
        .catch((error) => {
            console.log('Error:', error)
        })
    /** OneToMany */
    const spain = new Country({
        name: 'Spain',
        uuid: uuidv4()
    })
    await spain.save()
    const barcelona = new City({
        name: 'Barcelona',
        uuid: uuidv4(),
    })
    await barcelona.save()
    spain.cities.push(barcelona)
    await spain.save()
    Country.findOne({ name: 'Spain' })
        .populate('cities')
        .then((country) => {
            console.log('Country:', country)
        })
        .catch((error) => {
            console.log('Error:', error)
        })
    /** ManyToMany */
    const rennes = new City({
        name: 'Rennes',
        uuid: uuidv4(),
    })
    await rennes.save()
    const quimper = new City({
        name: 'Quimper',
        uuid: uuidv4(),
    })
    await quimper.save()
    const nantes = new City({
        name: 'Nantes',
        uuid: uuidv4(),
    })
    await nantes.save()
    rennes.sisterCities.push(quimper)
    rennes.sisterCities.push(nantes)
    await rennes.save()
    quimper.sisterCities.push(rennes)
    quimper.sisterCities.push(nantes)
    await quimper.save()
    City.findOne({ name: 'Rennes' })
        .populate('sisterCities')
        .then((city) => {
            console.log('City:', city)
            console.log('Sister cities:', city.sisterCities)
        })
        .catch((error) => {
            console.log('Error:', error)
        }
        )
}

module.exports = { database };
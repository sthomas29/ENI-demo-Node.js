const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const City = require('../../models/City');
const Country = require('../../models/Country');
const Mayor = require('../../models/Mayor');


router.get('/cities', (req, res) => {
    City.find().then((cities) => {
        res.json(cities)
    })
})

router.get('/cities/:uuid', (req, res, next) => {
    City.findOne({ uuid: req.params.uuid }).then((city) => {
        if (city) {
            res.json(city)
        } else {
            res.status(404).json('Error: No city found')
        }
    })
})

router.post('/cities', check('name')
    .isLength({ min: 3 })
    .withMessage('City name must be at least 3 characters long'),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json(errors.array())
        }
        let city = await City.create({
            name: req.body.name,
            uuid: uuidv4()
        })
        return res.status(201).json(city)
    }
)

router.put('/cities/:uuid',
    check('name')
        .isLength({ min: 3 })
        .withMessage('City name must be at least 3 characters long'),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json(errors.array())
        }
        let city = await City.findOneAndUpdate(
            { uuid: req.params.uuid },
            { name: req.body.name },
            { returnOriginal: false }
        )
        if (!city) {
            return res.status(404).json('Error: No city found')
        }
        return res.status(200).json(city)
    }
)
router.delete('/cities/:uuid', async (req, res, next) => {
    let city = await City.findOneAndDelete({ uuid: req.params.uuid })
    if (!city) {
        return res.status(404).json('Error: No city found')
    }
    return res.status(204).send()
})

// Export d'un objet pour intéragir avec la base
module.exports = router;
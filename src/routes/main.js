const { Route } = require('../index')
const { Router } = require('express')

module.exports = class Main extends Route {
  constructor (client) {
    super(client)
    this.name = ''
  }

  load () {
    const router = Router()

    router.get('/', (req, res) => {
      res.status(200).json({
        endpoints: [
          'GET /fun',
          'GET /memes',
          'GET /minecraft'
        ]
      })
    })

    router.get('/ping', (req, res) => {
      res.status(200).json({ message: 'OK' })
    })

    return router
  }
}

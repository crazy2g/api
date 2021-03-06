const express = require('express')
const morgan = require('morgan')
const cluster = require('cluster')
const responseTime = require('response-time')

const app = express()

const { Route, FileUtils } = require('./')
const { MongoDB } = require('./database')

const cpuCores = require('os').cpus().length

module.exports = class API {
  constructor (options = {}) {
    this._options = options
    this.app = app
    this.routes = []
    this.clusters = []
  }

  start (port, url) {
    if (cluster.isMaster) {
      this.log(`Master is running`, process.pid, 'C12N')

      for (let i = 0; i < cpuCores; i++) {
        cluster.fork()
      }

      cluster.on('exit', (worker, code) => {
        this.log(`Worker died with code ${code}. Recreating...`, worker.process.pid, 'C12N')
        cluster.fork()
      })
    } else {
      this.log(`Worker started`, process.pid, 'C12N')

      port = port || this._options.port || 1591
      url = url || this._options.url

      app.use(express.json())
      app.use(responseTime())
      app.use(morgan('combined'))
      app.set('trust proxy', true)

      app.listen(port, () => {
        this.log(`Listening on port ${port}, using URL ${url}`, process.pid, 'API')
        this.app = app
      })
    }

    this.initializeDatabase(MongoDB, { useNewUrlParser: true })
    return this.initializeRoutes('src/routes/')
  }

  log (...args) {
    const message = args[0]
    const tags = args.slice(1).map(t => `[${t}]`)
    console.log(...tags, message)
  }

  logError (...args) {
    const tags = args.length > 1 ? args.slice(0, -1).map(t => `[${t}]`) : []
    console.error('[Error]', ...tags, args[args.length - 1])
  }

  addRoute (route) {
    if (route instanceof Route) {
      route._register(app)
      this.routes.push(route)
    }
  }

  initializeRoutes (dirPath) {
    return FileUtils.requireDirectory(dirPath, (NewRoute) => {
      if (Object.getPrototypeOf(NewRoute) !== Route) return
      this.addRoute(new NewRoute(this))
      this.log(`${NewRoute.name} loaded.`, process.pid, 'Routes')
    }, this.logError)
  }

  initializeDatabase (DBWrapper, options = {}) {
    this.database = new DBWrapper(options)
    this.database.connect()
      .then(() => this.log('Database connection established!', process.pid, 'DB'))
      .catch(e => {
        this.logError(e.message, 'DB')
        this.database = null
      })
  }
}

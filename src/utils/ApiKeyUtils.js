const jwt = require('jsonwebtoken')

module.exports = class ApiKeyUtils {
  constructor (client) {
    this.client = client
  }

  registerApplication (name) {
    return this.client.database.applications.get(name).then(application => {
      const randomVerificationString = this.generateId(5)
      const acceptanceTimestamp = Math.floor(Date.now())
      const token = jwt.sign({ id: name, acceptanceTimestamp, randomVerificationString }, process.env.JWT_SECRET, { algorithm: 'HS256' })

      application.acceptanceTimestamp = acceptanceTimestamp
      application.randomVerificationString = randomVerificationString
      application.token = token
      application.save()

      return token
    })
  }

  verifyApplicationToken (token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err || !decodedToken) return reject(err)
        else resolve(decodedToken)
      })
    })
  }

  generateId (num) {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (var i = 0; i < num; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return text
  }
}

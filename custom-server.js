process.env.HOSTNAME = '0.0.0.0'
process.env.PORT = '8080'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./server.js')
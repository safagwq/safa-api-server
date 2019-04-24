const jsonServer = require('json-server')
const db = require('./db.js')
const server = jsonServer.create()
const router = jsonServer.router(db)

const middlewares = jsonServer.defaults()

server
.use(middlewares)
.use(jsonServer.bodyParser)
.use((req, res, next) => {

    console.log('请求方法 : '+req.method , '请求地址 : '+req.url)

    next()
})
.use(router)
.listen(3000, () => {
    console.log('http://localhost:3000')
})
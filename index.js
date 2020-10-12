const fs=require('fs')
const Path = require('path')
const net=require('net')

const yargs = require('yargs')
const JWT = require('jsonwebtoken')
const JsonServer = require('json-server')
const Express = require('express')

const { argv } = yargs
.option('port', {
    alias: 'p',
    string: true,
    default: '3000',
    describe: "get port number"
})
.option('dir', {
    alias: 'd',
    string: true,
    default: process.cwd(),
    describe: "get dir string"
})



const rootUrl=argv.dir
const serverFilePath = Path.join( rootUrl ,'server.js')
const dbFilePath = Path.join( rootUrl ,'db.json')
const staticPath = Path.join( rootUrl ,'public')
const jsonServer = JsonServer.create()

var router
var JWT_secret

portIsOccupied(argv.port)
.then(()=>{

    jsonServer.all('*',(req,res,next)=>{
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'Content-Type')
        res.header('Access-Control-Allow-Methods', '*')
        next()
    })
    
    
    if(fs.existsSync(serverFilePath)){
        startServer()
    }
    else{
        if(fs.existsSync(dbFilePath)){
            startJsonServer(staticPath)
        }
        else{
            startStaticServer(rootUrl,true)
        }
    }
})
.catch(()=>{

})



function nowStart(){

    jsonServer.listen(argv.port, () => {
        console.log(rootUrl + ' 运行在  http://localhost:'+argv.port)
        console.log(rootUrl + ' 运行在  http://'+ getIPv4() +':'+argv.port+'/\n\n\n\n')
    })
}

function startStaticServer(path,isStart){
    if(!fs.existsSync(path)){
        return
    }

    jsonServer
    .use(Express.static(path))
    .get('*',fileListParser(path))

    if(isStart){
        nowStart()
    }
    
}

function startJsonServer(){
    router = JsonServer.router(dbFilePath)

    startStaticServer(staticPath)

    JWT_secret = 'JWT'

    jsonServer
    .use(JsonServer.bodyParser)
    .post('/login',_login)
    .use(router)

    nowStart()
}

function startServer(){
    const server = require(serverFilePath)
    router = JsonServer.router(server.data)
    const defaults = JsonServer.defaults()
    const login = server.login || _login
    JWT_secret = server.JWT_secret || 'JWT'

    if(typeof server.static=='string'){
        startStaticServer(Path.join(rootUrl, server.static))
    }
    else{
        startStaticServer(staticPath)
    }

    jsonServer
    .use(defaults)
    .use(JsonServer.bodyParser)
    .post('/login',login)
    .use(JWT_Parser)

    setPublicRouters(server.publicRoutes || [] , server.privateRoutes)
    setMiddlewares(server.middlewares)

    jsonServer
    .use(router)
    .use((req,res,next)=>{
        res.end('没有找到资源 (O_O)? ')
    })

    nowStart()
}


function setMiddlewares(serverMiddlewares){

    if(typeof serverMiddlewares=='function'){
        serverMiddlewares = { default : serverMiddlewares }
    }

    if(serverMiddlewares && serverMiddlewares.default){
        jsonServer.use(serverMiddlewares.default)
    }

    if(serverMiddlewares!=null && typeof serverMiddlewares=='object'){
        for(let serverMiddlewaresItemName in serverMiddlewares){
            useServerMiddlewaresItem(serverMiddlewaresItemName)
        }
    }
}


function setPublicRouters(publicRoutes , privateRoutes){

    if(publicRoutes.length){
        publicRoutes.forEach(route => {
            jsonServer.all(route,(req,res,next)=>{
                req._isPublicRoutes = true
                next()
            })
        })

        jsonServer.all('*',(req,res,next)=>{
            if(req._isPublicRoutes || req.JWT_data){
                next()
            }
            else{
                res.send({
                    msg : '您需要登录才可以继续访问'
                })
            }
        })
    }
    else{
        privateRoutes.forEach(route => {
            jsonServer.all(route,(req,res,next)=>{
                if(req.JWT_data){
                    next()
                }
                else{
                    res.send({
                        msg : '您需要登录才可以继续访问'
                    })
                }
            })
        })
    }

}

function _login(req,res,next){
    var users = router.db.getState().users

    if(!users){
        next()
    }

    var targetUser=users.find((user)=>user.username == req.body.username)

    if(!targetUser){
        res.send({
            msg:'该用户不存在'
        })
        return
    }

    if(targetUser.password == req.body.password){
        res.send({
            msg : '登录成功',
            data : createToken(targetUser)
        })
    }
    else{
        res.send({
            msg : '密码不正确'
        })
    }
}

function createToken({id,username}){
    var signData = { id, username }

    return JWT.sign(signData , JWT_secret)
}


function useServerMiddlewaresItem(serverMiddlewaresItemName){

    var serverMiddlewaresItemMatch = serverMiddlewaresItemName.match( /^(get:|post:|put:|delete:|all:)/ )
    if(!serverMiddlewaresItemMatch){
        return
    }

    var method = serverMiddlewaresItemMatch[0].replace(/\W/g,'')
    var path = serverMiddlewaresItemName.slice(serverMiddlewaresItemMatch[0].length)
    jsonServer[method](path,serverMiddlewares[serverMiddlewaresItemName])
}



function portIsOccupied (port){
    const server=net.createServer().listen(port)
    return new Promise((resolve,reject)=>{
        server.on('listening',()=>{
            server.close()
            resolve(port)
        })

        server.on('error',(err)=>{
            if(err.code==='EADDRINUSE'){
                console.log(`${port} 端口已经被使用了 , 请更换一个其他端口继续 . `)
            }else{
                reject(err)
            }
        })
    })

}


function getIPv4(){
    var os = require('os')    
    const networks = os.networkInterfaces()
    const network = networks[Object.keys( networks )[0]]
    
    for(var i=0;i<network.length;i++){
        if(network[i].family=='IPv4'){
            IPv4=network[i].address
        }
    }

    return IPv4 || ''
}

function fileListParser(path){
    return (req,res,next)=>{
        var url=decodeURI(req.url)
        var pathName = Path.join( path , url )

        fs.stat(pathName, (err, stats)=>{
            if(err){
                next()
                return
            }

            if(stats.isDirectory()){
                fs.readdir(pathName,function (err,files){
                    if(url!='/'){
                        files.unshift('../')
                    }

                    var fileList=files
                    .map((name)=>{
                        var fileNameAfter = fs.statSync( Path.join(path , url, name) ).isDirectory() ? '/' : ''
                        if(name=='../'){
                            fileNameAfter=''
                        }

                        return `<li><a href='${ Path.join(url,name) }'>${name}${ fileNameAfter }</a></li>`
                    })
                    .join('\n')

                    res.writeHeader(200,{
                        'content-type' : 'text/html;charset="utf-8"'
                    })

                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset='utf-8'/>
                            <meta name='viewport' content='width=device-width,initial-scale=1.0'/>
                            <title>${ url }</title>
                            <style>
                                a{display:block;  padding:10px;  font-size:14px;  }
                                ul{list-style:none;  padding:0;  margin:0;  }
                            </style>
                        </head>
                        <body>
                            <ul>${ fileList }</ul>
                        </body>
                        </html>
                    `)
                })
            }
        })
    }
}


function JWT_Parser(req,res,next){
    var token = req.body.token || req.query.token || req.headers['x-access-token']
    JWT.verify(token , JWT_secret, (error,decoded)=>{
        if(error) {
            req.JWT_error = error
        }
        else{
            req.JWT_data = decoded

            if(req.body.token){
                delete req.body.token
            }
        }
        next()
    })
}

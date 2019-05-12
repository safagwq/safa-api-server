const fs=require('fs')
const Path = require('path')

const yargs = require('yargs')
const JWT = require('jsonwebtoken')
const JsonServer = require('json-server')
const Express = require('express')

const rootUrl=process.cwd()
const serverFilePath = Path.join( rootUrl ,'server.js')
const dbFilePath = Path.join( rootUrl ,'db.json')
const staticPath = Path.join( rootUrl ,'public')
const jsonServer = JsonServer.create()

const args = yargs.option('port', {
    alias: 'p',
    string: true,
    default: '3000',
    describe: "get port number"
})
.argv

var JWT_secret

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



function nowStart(){

    jsonServer.listen(args.port, () => {
        console.log(rootUrl + ' 运行在  http://localhost:'+args.port)
        console.log(rootUrl + ' 运行在  http://'+ getIPv4() +':'+args.port+'/\n\n\n\n')
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
    const router = JsonServer.router(dbFilePath)

    startStaticServer(staticPath)

    jsonServer.use(router)
    nowStart()
}

function startServer(){

    const server = require(serverFilePath)
    const router = JsonServer.router(server.data)
    const middlewares = JsonServer.defaults()
    const login = server.login || _login

    JWT_secret = server.JWT_secret || 'JWT'



    var serverMiddlewares = server.middlewares

    if(typeof serverMiddlewares=='function'){
        serverMiddlewares = { default : serverMiddlewares }
    }

    if(typeof server.static=='string'){
        startStaticServer(Path.join(rootUrl, server.static))
    }
    else{
        startStaticServer(staticPath)
    }

    jsonServer
    .use(middlewares)
    .use(JsonServer.bodyParser)
    .use(JWT_Parser)

    if(serverMiddlewares.default){
        jsonServer.use(serverMiddlewares.default)
    }

    if(serverMiddlewares!=null && typeof serverMiddlewares=='object'){
        for(let serverMiddlewaresItemName in serverMiddlewares){
            useServerMiddlewaresItem(serverMiddlewaresItemName)
        }
    }

    jsonServer
    .post('/login',login)
    .use(router)
    .use((req,res,next)=>{
        res.end('没有找到资源 (O_O)? ')
    })

    nowStart()
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



function getIPv4(){
    var os = require('os')    

    for(var i=0;i<os.networkInterfaces().en0.length;i++){
        if(os.networkInterfaces().en0[i].family=='IPv4'){
            IPv4=os.networkInterfaces().en0[i].address
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
    JWT.verify(req.body.token , JWT_secret, (error,decoded)=>{
        if(error) {
            req.JWT_error = error
        }
        else{
            req.JWT_data = decoded
        }
        next()
    })
}
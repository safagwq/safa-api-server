# web-api-server
简易的web api服务

# 安装
```
git clone https://github.com/safagwq/safa-api-server.git
cd safa-api-server
npm install
```

# 使用之前
您需要使用
```
alias api-server="~/git/safa-api-server/api-server"
```
或者
```
ln -s /Users/safa/git/safa-api-server/api-server /usr/local/bin/api-server
```
等命令将命令设置为全局模式 , 目前暂未提供npm 全局安装方式 .


# 静态服务器
进入任何目录 , 执行api-server, 会将这个目录视为静态服务器的根目录 , 默认运行3000端口

```
api-server
```
或者
```
api-server -p 8080
```



# json api服务器
在当前目录创建一个```db.json``` , 然后执行 ```api-server``` , 将会根据[json-server](https://github.com/typicode/json-server)的方式运行一个RESTful风格的api服务器 .
如果```db.json```同目录存在```public```目录 , 将会使用```public```目录开始静态服务器



# json api服务器 高级版
在当前目录创建一个```server.js``` , 然后执行```api-server``` , 将会根据 ```server.js``` 的配置运行一个RESTful风格的api服务器 .
```server.js``` 需要导出的数据参数如下
高级版默认支持登录功能 , 需要设置users数组(参考demo) , 

```
// 支持 get: , post: , put: , delete: , all:
// var middlewares={
//     'get:/users' : (req,res,next)=>{
//         console.log('post:/users' , req.url)
//         next()
//     },
//     default : (req,res,next)=>{
//         console.log(req.JWT_data)
//         next()
//     }
// }

function middlewares(req, res, next){
    if(req.methods=='POST' || req.methods=='PUT' || 'DELETE'){
        save()
    }

    next()
}


module.exports = {

    // JWT 做token时候的加密私钥
    // JWT_secret : '',

    // 不需要登录就可以访问的接口列表
    publicRoutes : ['/shops*'],

    // 需要登录才可以访问的接口 , 如果已经设置 publicRoutes , 则忽略这个接口列表
    // privateRoutes : ['/users*'],

    // 静态资源文件目录 , 如果没有设置 , 默认使用public , 相对目录
    // static : 'public',

    // 登录方法 , 如果没有提供则使用默认的登录方法
    // login,

    // 中间件 , 一个obj格式或者一个方法
    middlewares,

    // 初始化数据 , 一个obj格式的数据作为接口模板
    data,
}

```


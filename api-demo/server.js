var fs=require('fs')

var autoSaveTimeout=null
var data = fs.existsSync('./db.json') ? JSON.parse(fs.readFileSync('./db.json' , 'utf8')) : {

    shops : [
        {
            id : 1,
            name : "apple1",
            price : 10,
        },
    ],

    users : [
        {     
            id : 1,
            username : 'safa',
            password : '123123',
        }
    ],

    setting : {
        hello : 'hello word'
    }
}



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



function save(){

    clearTimeout(autoSaveTimeout)
    autoSaveTimeout = setTimeout(()=>{
        fs.writeFileSync('./db.json', JSON.stringify(data,null,2) )
    },1000)
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



// let validator = {
//   set: function(obj, prop, value) {
//     if (prop === 'age') {
//       if (!Number.isInteger(value)) {
//         throw new TypeError('The age is not an integer');
//       }
//       if (value > 200) {
//         throw new RangeError('The age seems invalid');
//       }
//     }

//     // 对于age以外的属性，直接保存
//     obj[prop] = value;
//   },
//   delete : function(){
//     alert()
//     }
// };
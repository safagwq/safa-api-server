var fs=require('fs')


module.exports= fs.existsSync('./db.json') ? JSON.parse(fs.readFileSync('./db.json' , 'utf8')) : {

    fruits : [
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
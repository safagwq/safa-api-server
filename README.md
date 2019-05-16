# web-api-server
简易的web api服务

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
在当前目录创建一个db.json , 然后执行api-server , 将会根据json-server的方式运行一个RESTful风格的api服务器 .

# json api服务器 高级版
在当前目录创建一个server.js , 然后执行api-server , 将会根据server.js的配置运行一个RESTful风格的api服务器 .

# velocityServer

[![Build Status](https://travis-ci.org/holyzfy/velocityServer.svg)](https://travis-ci.org/holyzfy/velocityServer)
[![Dependency Status](https://david-dm.org/holyzfy/velocityServer.svg)](https://david-dm.org/holyzfy/velocityServer)
[![Coverage Status](https://coveralls.io/repos/holyzfy/velocityServer/badge.svg?branch=master&service=github)](https://coveralls.io/github/holyzfy/velocityServer?branch=master)

velocity模板服务器

## 功能

 - velocity模板渲染
 - 静态资源服务
 - `.json`、`.json5`文件支持[json5](https://github.com/json5/json5)语法，响应内容为json格式

## 安装

0. 在velocityServer目录下运行`npm install`

0. 编辑`config/default.json`并另存为`config/local.json`，配置项示例：

```js
{
    // 服务器的运行端口
    "port": 8021,

    // 服务器根目录，请填写绝对路径
    "webapps": "",

    // velocity文件的扩展名
    "vm": [
        ".vm",
        ".html",
        ".shtml"
    ],

    // 响应头
    "responseHeaders": {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    },
    
    // http代理
    "proxy": {
        // 需要代理的url
        "path": "/api/*",

        // 代理服务器地址
        "target": "http://localhost:9999"
    }
}
```

## 使用说明

如果模板文件同目录下有同名的js文件，则作为模板的模拟数据，例如：

index.vm

```html
<h1>${title}</h1>
<ul>
    #foreach($item in $list)
    <li>$item</li>
    #end
</ul>
<p>Today is $now()</p>
```

index.js

```js
module.exports = {
    "title": "hello title",
    "list": [
        "one",
        "two",
        "three"
    ],
    "now": function() {
        return (new Date).getDay();
    }
}
```

## 运行

    node index.js

推荐使用[pm2](https://www.npmjs.com/package/pm2)来启动velocityServer：

    pm2 start index.js --name velocityServer

## 测试

    npm test

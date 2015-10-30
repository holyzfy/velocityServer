# velocityServer

velocity模板服务器

[![Build Status](https://travis-ci.org/holyzfy/velocityServer.svg)](https://travis-ci.org/holyzfy/velocityServer)
![Progress](http://progressed.io/bar/70?title=done) 

## 安装

0. 运行`npm install`

0. 编辑`config/default.json`并另存为`config/local.json`，可用的配置项：

    * `port`: 服务器的运行端口
    * `webapps`: 服务器根目录，请填写绝对路径
    * `ssiMaxDepth`: SSI指令内嵌的最大深度
    * `vm`: velocity文件的扩展名
    * `responseHeaders`: 响应头

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

## 测试

    npm test

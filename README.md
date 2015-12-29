# invok
一个基于Promise+generator(yield)的异步流程控制库

##自述
好吧，这是一个轮子，功能上和TJ大神的co一模一样。  
本来是我之前MVC框架内部使用的异步控制工具，现在简单重构一下简单独剥离出来。  
没有参考过co，思路基本上是一样的，我们的Promise风格完全不一样，他是基于es6的promise。  
我是基于我的Promise A/+的一个实现（没错又是一个轮子=。=）  
非要说有啥特别的地方？我自认为代码结构相对清晰易懂一些（只有70行），好吧，只是自认为而已。

对generator实现流程控制感兴趣的可以看下源代码。  
另外自我打脸的是，浏览器运行版本为了不多引用js，用的也是es6风格promise。=。=  
##安装
```javascript
npm install invok
```
额不要吐槽我的名字，其实是就是invoke这个词的简写。  
一来invoke普通单词也没啥意思，二来npm被别人抢注了，囧rz。

##测试用例+用法
```javascript
var invok = require('invok');
var Promise = require('ipromise');
function delay(data, delay) { 
    //一个异步过程（返回promise）
    var p = Promise();
    setTimeout(function() {
        p.resolve(data);
    }, delay || 500);
    return p;
}
/**
 * 用法跟co大致一样
 * invok接收三个参数 
 * 第一个参数可以是/函数/generator函数/generator/promise/普通数据
 * 当然 主要是用来运行generator函数的。
 * 第二个参数是运行第一个参数（如果是函数或者generator函数）时的this
 * 第三个参数是运行第一个参数（如果是函数或者generator函数）时的参数数组
 */ 
invok(function*() {
    //yield一个promise，返回这个promise的结果 
    console.log(yield delay("yield promise", 800));
    //yield 另外一个generator 返回这个generator的结果，（递归嵌套）
    var data1 = yield (function*() {
        return yield delay("yield a generator", 1500);
    })();
    console.log(data1);
    
    //yield一个promise的数组，首先这个数组里面的所有promise会并行执行，
    //等所有promise的执行完毕后,这个yield返回他们的结果组成的数组
    var data2 = yield [delay(1, 100), delay(2, 300), delay(3, 1000), delay(4, 500)];
    console.log(data2);
    
    //yield一个promise组成的对象，首先这个对象里面的所有promise会并行执行，
    //等所有promise的执行完毕后,这个yield返回他们的结果组成的对象，键和值还保持之前的对应关系
    var data3 = yield {e : delay(1, 100), b : delay(2, 300), c : delay(3, 1000), d : delay(4, 500)};
    console.log(data3);
    
    //yield普通对象，跟直接赋值没啥区别
    console.log(yield 123);
    console.log(yield {text : '普通对象'});
    return "invok end";
}).then(function(data) {
    //一次invok的执行结果
    console.log(data);
}, function(e) {
   //一次invok的执行结果
    console.log(e.stack)
});
```

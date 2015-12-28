/**
 * Created by godsong on 15-12-28.
 */
var Promise=require('ipromise');

function invok(generatorFunction,that,args){
    var promise=new Promise();
    try {
        var ret = generatorFunction.apply(that, args);//执行目标函数
    } catch(e) {
        return promise.reject(e);
    }
    if(isGenerator(ret)) {//如果返回generator

        nextYield(promise,ret);
    }
    else if(isPromise(ret)) {//如果返回promise
        return ret;
    }
    else {//如果返回普通值
        promise.resolve(ret);
    }
    return promise;
}
//执行到下一个yield
function nextYield(promise,generator, prevData) {
    try {
        var yielded = generator.next(prevData);
    } catch(e) {
        return promise.reject(e);
    }
    resolveYielded(promise,generator,yielded);
}
//上一次执行遇到的异常，带着异常执行到下一个yield
function nextYieldWithException(promise,generator, exception) {
    try {
        var yielded = generator.throw(exception);
    } catch(e) {
        return promise.reject(e);
    }
    resolveYielded(promise,generator,yielded);
}
//处理yield出来的东西
function resolveYielded(promise,generator,yielded) {
    if(yielded.done) return promise.resolve(yielded.value);

    if(isPromise(yielded.value)) {
        resolvePromise(promise,generator,yielded.value);
    }
    else if(typeof yielded.value === 'function') {
        invok(yielded.value, null).link(promise);
    }
    else if(isGenerator(yielded.value)) {
        nextYield(promise, yielded.value)
    }
    else if(Array.isArray(yielded.value)||yielded.value.constructor===Object){
        resolvePromise(promise,generator,Promise.all(yielded.value));
    }
    else {
        nextYield(promise, generator, yielded.value);
    }
}
function resolvePromise(promise,generator,thisPromise){
    thisPromise.then(function(data) {
        nextYield(promise, generator, data);
    }, function(reason) {
        nextYieldWithException(promise, generator, reason);
    });
}
function isPromise(obj){
    return obj&&typeof obj.then==='function';
}
function isGenerator(obj) {
    return obj&&obj.toString()==='[object Generator]';
}
function delay(data,delay){
    var p=Promise();
    setTimeout(function(){
        p.resolve(data);
    },delay||500);
    return p;
}

/*Promise.all([delay(1,100),delay(2,300),delay(3,1000),delay(4,500)]).then(function(data){
    console.log(data);
})
Promise.all({a:delay(1,100),b:delay(2,300),c:delay(3,1000),d:delay(4,500)}).then(function(data){
    console.log(data);
})*/
invok(function*(){
    var data=yield [delay(1,100),delay(2,300),delay(3,1000),delay(4,500)];
    console.log(data);
    var data2=yield {a:delay(1,100),b:delay(2,300),c:delay(3,1000),d:delay(4,500)};

    console.log(data2);
})
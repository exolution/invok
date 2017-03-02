var Promise = require('ipromise');
var invok=module.exports = function invok(generatorFunction, that, args) {
    var promise = new Promise();
    if(typeof generatorFunction === 'function') {
        try {
            var ret = generatorFunction.apply(that, args);//执行目标函数
        } catch(e) {
            return promise.reject(e);
        }
    }
    else {
        ret = generatorFunction;
    }
    if(isGenerator(ret)) {//如果返回generator 执行到下一个yield处
        runToNextYield(promise, ret);
    }
    else if(isPromise(ret)) {//如果返回promise 那就直接返回这个promise
        return ret;
    }
    else {//如果返回普通值 直接resolve
        promise.resolve(ret);
    }
    return promise;
};
//执行到[generator]下一个yield，并把上一次yield出来的数据[prevData]传递过去，有异常抛异常。
function runToNextYield(promise, generator, prevData) {
    try {
        var yielded = generator.next(prevData);
    } catch(e) {
        return promise.reject(e);
    }
    resolveYielded(promise, generator, yielded);
}
//执行到[generator]下一个yield，并把上一次执行的异常[exception]传递过去，有异常抛异常。
function runToNextYieldWithException(promise, generator, exception) {
    try {
        var yielded = generator.throw(exception);
    } catch(e) {
        return promise.reject(e);
    }
    resolveYielded(promise, generator, yielded);
}
//处理yield出来的东西
function resolveYielded(promise, generator, yielded) {
    if(yielded.done) //整个generator运行完了 把return resolve掉
        return promise.resolve(yielded.value);
    if(isPromise(yielded.value)) {//处理yield出的promise
        resolvePromise(promise, generator, yielded.value);
    }
    else if(typeof yielded.value === 'function' || isGenerator(yielded.value)) {
        resolvePromise(promise, generator, invok(yielded.value));
    }

    else {//yield出一个普通值，直接运行到下一个yield
        runToNextYield(promise, generator, yielded.value);
    }
}
function resolvePromise(promise, generator, thisPromise) {
    thisPromise.then(function(data) {
        runToNextYield(promise, generator, data);
    }, function(reason) {
        runToNextYieldWithException(promise, generator, reason);
    });
}
function isPromise(obj) {
    return obj && typeof obj.then === 'function';
}
function isGenerator(obj) {
    return obj && obj.toString() === '[object Generator]';
}
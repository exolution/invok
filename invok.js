void function(exports) {
    function invok(generatorFunction, that, args) {
        return new Promise(function(resolve, reject) {
            try {
                var ret = generatorFunction.apply(that, args);//执行目标函数
            } catch(e) {
                return reject(e);
            }
            if(isGenerator(ret)) {//如果返回generator
                runToNextYield(ret);
            }
            else if(isPromise(ret)) {//如果返回promise
                return ret;
            }
            else {//如果返回普通值
                resolve(ret);
            }
            //执行到下一个yield
            function runToNextYield(generator, prevData) {
                try {
                    var yielded = generator.next(prevData);
                } catch(e) {
                    return reject(e);
                }
                resolveYielded(generator, yielded);
            }

            //上一次执行遇到的异常，带着异常执行到下一个yield
            function runToNextYieldWithException(generator, exception) {
                try {
                    var yielded = generator.throw(exception);
                } catch(e) {
                    return reject(e);
                }
                resolveYielded(generator, yielded);
            }

            //处理yield出来的东西
            function resolveYielded(generator, yielded) {
                if(yielded.done)
                    return resolve(yielded.value);
                if(isPromise(yielded.value)) {
                    resolvePromise(generator, yielded.value);
                }
                else if(typeof yielded.value === 'function') {
                    resolvePromise(generator, invok(yielded.value));
                }
                else if(isGenerator(yielded.value)) {
                    runToNextYield(yielded.value)
                }
                else if(yielded.value instanceof Array) {
                    resolvePromise(generator, Promise.all(yielded.value));
                }
                else if(yielded.value.constructor === Object) {
                    var promises = [], keys = [];
                    for(var k in yielded.value) {
                        if(yielded.value.hasOwnProperty(k)) {
                            keys.push(k);
                            promises.push(yielded.value[k]);
                        }
                    }
                    resolvePromiseWrap(generator, keys, Promise.all(promises));
                }
                else {
                    runToNextYield(generator, yielded.value);
                }
            }

            function resolvePromise(generator, thisPromise) {
                thisPromise.then(function(data) {
                    runToNextYield(generator, data);
                }, function(reason) {
                    runToNextYieldWithException(generator, reason);
                });
            }

            function resolvePromiseWrap(generator, keys, thisPromise) {
                thisPromise.then(function(data) {
                    var wrap = {};
                    for(var i = 0; i < data.length; i++) {
                        wrap[keys[i]] = data[i];
                    }
                    runToNextYield(generator, wrap);
                }, function(reason) {
                    runToNextYieldWithException(generator, reason);
                });
            }
        });
    }

    function isPromise(obj) {
        return obj && typeof obj.then === 'function';
    }

    function isGenerator(obj) {
        return obj && obj.toString() === '[object Generator]';
    }

    exports.invok = invok;
}(window);
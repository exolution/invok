var invok = require('./index');
var Promise = require('ipromise');
function delay(data, delay) {
    var p = Promise();
    setTimeout(function() {
        p.resolve(data);
    }, delay || 500);
    return p;
}
invok(function*() {
    console.log(yield delay("yield promise", 800));
    var data1 = yield (function*() {
        return yield delay("yield a generator", 1500);
    })();
    console.log(data1);
    var data2 = yield [delay(1, 100), delay(2, 300), delay(3, 1000), delay(4, 500)];
    console.log(data2);
    var data3 = yield {e : delay(1, 100), b : delay(2, 300), c : delay(3, 1000), d : delay(4, 500)};
    console.log(data3);
    console.log(yield 123);
    console.log(yield {text : '普通对象'});
    return "invok end";
}).then(function(data) {
    console.log(data);
}, function(e) {
    console.log(e.stack)
});
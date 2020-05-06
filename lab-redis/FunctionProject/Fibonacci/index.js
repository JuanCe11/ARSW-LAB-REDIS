const bigInt = require("big-integer");
const redis = require("redis");
const bluebird = require("bluebird");

bluebird.promisifyAll(redis);

var client = null;
if (process.env["env"] === 'dev'){

    client = redis.createClient(
        {
            hots: process.env["RedisHost"],
            port: process.env["RedisPort"]
        }
    );
}else if (process.env["env"] ==='prod'){
    client = redis.createClient(process.env["RedisPort"],process.env["RedisHost"],{
        auth_pass: process.env["RedisKey"],
        tls:{
            servername: process.env["RedisHost"],
        }
    });
}

async function exists(nth){
    let key = generateKey(nth);
    return ((await client.existsAsync(key)) === 1);
}

async function getFibo(nth){
    let key = generateKey(nth);
    return bigInt(await client.getAsync(key));
}

async function setFibonacci(nth,nthValue){
    let key = generateKey(nth);
    await client.setAsync(key,nthValue.toString());
}

function generateKey(nth){
    return `fibonacci:nth:${nth.toString()}`;
}

async function fibonacci(nth){
    nth = bigInt(nth);
    let nth_1 = bigInt.zero;
    let nth_2 = bigInt.one;
    let answer = bigInt.one;
    if(nth.compare(0) < 0)
        throw "Debe ser mayor a 0";
    else if (nth.compare(0) === 0)
        answer = nth_1;
    else if (nth.compare(1) === 0)
        answer = nth_2;
    else if (await exists(nth))
        answer = await getFibo(nth);
    else{
        let ans1 = await fibonacci(nth.add(-1)); 
        let ans2 = await fibonacci(nth.add(-2));
        answer = ans1.add(ans2);
        await setFibonacci(nth,answer);
    }
    return answer;
}

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    let nth = req.body.nth;
    let answer = await fibonacci(nth);
    context.res = {
        body:answer.toString()
    }
};
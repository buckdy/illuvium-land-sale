// Async version of forEach
function asyncForEach(array, asyncCallback) {
    const promiseArray = new Array();
    for (const elem of array) {
        promiseArray.push(asyncCallback(elem))
    }
    return Promise.all(promiseArray);
}

module.exports = {
    asyncForEach
};
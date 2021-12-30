// Async version of forEach
function asyncForEach(array, asyncCallback) {
    const arrayPromises = array.map(elem => asyncCallback(elem));
    return Promise.all(arrayPromises);
}

module.exports = {
    asyncForEach
};
module.exports = {
    randomID
}

async function randomID() {
    var result = Math.random().toString(36).substr(2,13); 
    return result;
}
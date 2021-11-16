const fetch = require('cross-fetch');

module.exports = async () => {
    process.env.API_URL = "http://172.16.67.147/api/"
    process.env.NAMESPACE = "test"
    
    await fetch.fetch(`${process.env.API_URL}namespaces/${process.env.NAMESPACE}`,{
        method: "PUT",
    })
};
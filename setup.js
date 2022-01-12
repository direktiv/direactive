const fetch = require('isomorphic-fetch');

module.exports = async () => {
    process.env.API_URL = "http://192.168.0.135/api/"
    process.env.NAMESPACE = "test"
    await fetch(`${process.env.API_URL}namespaces/${process.env.NAMESPACE}`,{
        method: "PUT",
    })

};
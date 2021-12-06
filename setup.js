const fetch = require('isomorphic-fetch');

module.exports = async () => {
    process.env.API_URL = "https://rabbit.direktiv.io/api/"
    process.env.NAMESPACE = "test"
    await fetch(`${process.env.API_URL}namespaces/${process.env.NAMESPACE}`,{
        method: "PUT",
    })

};
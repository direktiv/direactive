const fetch = require('isomorphic-fetch');

module.exports = async () => {
    await fetch(`${process.env.API_URL}namespaces/${process.env.NAMESPACE}`,{
        method: "DELETE",
    })
};
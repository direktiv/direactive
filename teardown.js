const fetch = require('isomorphic-fetch');

module.exports = async () => {
    console.log("tearing up deleting namespace")
    await fetch(`${process.env.API_URL}namespaces/${process.env.NAMESPACE}`,{
        method: "DELETE",
    })
};
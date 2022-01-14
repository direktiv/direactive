import * as React from 'react'

import { HandleError, ExtractQueryString } from '../util'
const fetch = require('isomorphic-fetch')


export const useDirektivNamespaceDependencies = (url, namespace, apikey) => {

    const [data, setData] = React.useState(null)
    
    React.useEffect(()=>{
        if(data === null) {
            getNamespaceDependencies()
        }
    },[data])

    async function getNamespaceDependencies(...queryParameters) {
            // fetch namespace list by default
            let resp = await fetch(`${url}namespaces/${namespace}/dependencies${ExtractQueryString(false, ...queryParameters)}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok) {
                throw new Error((await HandleError('list namespace dependencies', resp, 'namespaceDependencies')))
            }

            let json = await resp.json()
            setData(json)
            return json
    }

    async function getNamespaceFunctions(){
        return data.namespace_functions
    }    

    async function getSecrets() {
        return data.secrets
    }

    async function getVariables() {
        return data.variables
    }

    async function getWorkflows() {
        return data.workflows
    }

    return {
        data,
        getNamespaceDependencies,
        getNamespaceFunctions,
        getSecrets,
        getVariables,
        getWorkflows
    }

}
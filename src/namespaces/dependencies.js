import * as React from 'react'

import { HandleError, ExtractQueryString } from '../util'
const fetch = require('isomorphic-fetch')


export const useDirektivNamespaceDependencies = (url, namespace, apikey) => {

    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    
    React.useEffect(()=>{
        if(data === null) {
            getNamespaceDependencies()
        }
    },[data])

    async function getNamespaceDependencies() {
        try {
            // fetch namespace list by default
            let resp = await fetch(`${url}namespaces/${namespace}/dependencies`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json)
            } else {
                setErr(await HandleError('list namespace dependencies', resp, 'namespaceDependencies'))
            }
        } catch(e) {
            setErr(e.message)
        }
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
        err,
        getNamespaceDependencies,
        getNamespaceFunctions,
        getSecrets,
        getVariables,
        getWorkflows
    }

}
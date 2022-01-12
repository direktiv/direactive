import * as React from 'react'
import {  HandleError, ExtractQueryString } from '../util'
const fetch = require('isomorphic-fetch')

/*
    useSecrets is a react hook which returns create registry, delete registry and data
    takes:
      - url to direktiv api http://x/api/
      - namespace the namespace to query on
      - apikey to provide authentication of an apikey
*/
export const useDirektivSecrets = (url, namespace, apikey) => {
    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)

    React.useEffect(()=>{
        if(data === null) {
            getSecrets()
        }
    },[data])

    // getSecrets returns a list of registries
    async function getSecrets(...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/secrets${ExtractQueryString(false, queryParameters)}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json.secrets.edges)
            } else {
                setErr(await HandleError('list secrets', resp, 'listSecrets'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function createSecret(name,value,...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/secrets/${name}${ExtractQueryString(false, queryParameters)}`,{
                method: "PUT",
                body: value
            })
            if(!resp.ok){
                return await HandleError('create secret', resp, 'createSecret')
            }
        } catch(e) {
            return e.message
        }
    }

    async function deleteSecret(name,...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/secrets/${name}${ExtractQueryString(false, queryParameters)}`, {
                method: "DELETE"
            })
            if (!resp.ok) {
                return await HandleError('delete secret', resp, 'deleteSecret')
            }
        } catch (e) {
            return e.message
        }
    }


    return {
        data,
        err,
        createSecret,
        deleteSecret,
        getSecrets
    }
    
}
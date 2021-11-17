import * as React from 'react'
import fetch from "cross-fetch"
import {  HandleError } from '../util'

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
    async function getSecrets() {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/secrets`, {
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

    async function createSecret(name,value) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/secrets/${name}`,{
                method: "PUT",
                body: value
            })
            if(!resp.ok){
                setErr(await HandleError('create secret', resp, 'createSecret'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function deleteSecret(name) {
        try {
            let resp = await fetch(`/namespaces/${namespace}/secrets/${name}`, {
                method: "DELETE"
            })
            if (!resp.ok) {
                setErr(await HandleError('delete secret', resp, 'deleteSecret'))
            }
        } catch (e) {
            setErr(e.message)
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
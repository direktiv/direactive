import * as React from 'react'
import fetch from "cross-fetch"
import {  HandleError } from '../util'

/*
    useRegistries is a react hook which returns create registry, delete registry and data
    takes:
      - url to direktiv api http://x/api/
      - namespace the namespace to query on
      - apikey to provide authentication of an apikey
*/



export const useRegistries = (url, namespace, apikey) => {

    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)

    React.useEffect(()=>{
        if(data === null) {
            getRegistries()
        }
    },[data])

    // getRegistries returns a list of registries
    async function getRegistries() {
        try {
            let resp = await fetch(`${url}functions/registries/namespaces/${namespace}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json.registries)
            } else {
                setErr(await HandleError('list registries', resp, 'listRegistries'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function createRegistry(key, val){
        try {
            let resp = await fetch(`${url}functions/registries/namespaces/${namespace}`, {
                method: "POST",
                body: JSON.stringify({data:val, reg: key})
            })
            if(!resp.ok){
                setErr(await HandleError('create registry', resp, 'createRegistry'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function deleteRegistry(key){
        try {
            let resp = await fetch(`${url}functions/registries/namespaces/${namespace}`, {
                method: "DELETE",
                body: JSON.stringify({
                    reg: key
                })
            })
            if (!resp.ok) {
                setErr(await HandleError('delete registry', resp, 'deleteRegistry'))
            }
        } catch (e) {
            setErr(e.message)
        }
    }

    return {
        data,
        err,
        createRegistry,
        deleteRegistry,
        getRegistries
    }
}
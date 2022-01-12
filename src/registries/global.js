import * as React from 'react'
import {  HandleError, ExtractQueryString } from '../util'
const fetch = require('isomorphic-fetch')

/*
    useGlobalRegistries is a react hook which returns create registry, delete registry and data
    takes:
      - url to direktiv api http://x/api/
      - apikey to provide authentication of an apikey
*/
export const useDirektivGlobalRegistries = (url, apikey) => {

    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)

    React.useEffect(()=>{
        if(data === null) {
            getRegistries()
        }
    },[data])

    // getGlobalRegistries returns a list of registries
    async function getRegistries(...queryParameters) {
        try {
            let resp = await fetch(`${url}functions/registries/global${ExtractQueryString(false, queryParameters)}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json.registries)
            } else {
                setErr(await HandleError('list registries', resp, 'listGlobalRegistries'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function createRegistry(key, val,...queryParameters){
        try {
            let resp = await fetch(`${url}functions/registries/global${ExtractQueryString(false, queryParameters)}`, {
                method: "POST",
                body: JSON.stringify({data:val, reg: key})
            })
            if(!resp.ok){
                return await HandleError('create registry', resp, 'createRegistry')

            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function deleteRegistry(key, ...queryParameters){
        try {
            let resp = await fetch(`${url}functions/registries/global${ExtractQueryString(false, queryParameters)}`, {
                method: "DELETE",
                body: JSON.stringify({
                    reg: key
                })
            })
            if (!resp.ok) {
                return await HandleError('delete registry', resp, 'deleteRegistry')

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
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

    React.useEffect(()=>{
        if(data === null) {
            getRegistries()
        }
    },[data])

    // getGlobalRegistries returns a list of registries
    async function getRegistries(...queryParameters) {
        let resp = await fetch(`${url}functions/registries/global${ExtractQueryString(false, ...queryParameters)}`, {
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (resp.ok) {
            let json = await resp.json()
            setData(json.registries)
            return json.registries
        } else {
            throw new Error(await HandleError('list registries', resp, 'listGlobalRegistries'))
        }
    }

    async function createRegistry(key, val,...queryParameters){
            let resp = await fetch(`${url}functions/registries/global${ExtractQueryString(false, ...queryParameters)}`, {
                method: "POST",
                body: JSON.stringify({data:val, reg: key})
            })
            if(!resp.ok){
                throw new Error( await HandleError('create registry', resp, 'createRegistry'))

            }
            return await resp.json()
    }

    async function deleteRegistry(key, ...queryParameters){
            let resp = await fetch(`${url}functions/registries/global${ExtractQueryString(false, ...queryParameters)}`, {
                method: "DELETE",
                body: JSON.stringify({
                    reg: key
                })
            })
            if (!resp.ok) {
                throw new Error( await HandleError('delete registry', resp, 'deleteRegistry'))

            }
            return await resp.json()
    }

    return {
        data,
        createRegistry,
        deleteRegistry,
        getRegistries
    }
}
import * as React from 'react'
import { HandleError, ExtractQueryString } from '../util'
const fetch = require('isomorphic-fetch')

/*
    useBroadcastConfiguration is a react hook
    takes:
      - url to direktiv api http://x/api/
      - namespace the namespace to send the requests to
      - apikey to provide authentication of an apikey
*/
export const useDirektivBroadcastConfiguration = (url, namespace, apikey) => {
    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)

    React.useEffect(()=>{
        if(data === null) {
            getBroadcastConfiguration()
        }
    },[data])

    async function getBroadcastConfiguration(...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/config${ExtractQueryString(false, ...queryParameters)}`,{})
            if(!resp.ok) {
                await HandleError('fetch config', resp, 'getNamespaceConfiguration')
            } else {
                let json = await resp.json()
                setData(json)
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function setBroadcastConfiguration(newconfig, ...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/config${ExtractQueryString(false, ...queryParameters)}`, {
                method: "PATCH",
                body: newconfig
            })
            if (!resp.ok) {
                return await HandleError('set config', resp, 'setNamespaceConfiguration')
            }
        } catch (e) {
            return e.message
        }
    }

    return {
        data,
        err,
        getBroadcastConfiguration,
        setBroadcastConfiguration
    }
}
import * as React from 'react'
import fetch from "cross-fetch"
import { HandleError, ExtractQueryString } from '../util'

/*
    useNamespaceMetrics is a react hook which metric details
    takes:
      - url to direktiv api http://x/api/
      - namespace to use with the api
      - apikey to provide authentication of an apikey
*/
export const useDirektivNamespaceMetrics = (url, namespace, apikey) => {
    const [err, setErr] = React.useState(null)

    async function getInvoked(...queryParameters){
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/metrics/invoked${ExtractQueryString(false, ...queryParameters)}`,{
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(resp.ok){
                return await resp.json()
            } else {
                setErr(await HandleError('get invoked metrics', resp, 'getMetrics'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function getSuccessful(...queryParameters){
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/metrics/successful${ExtractQueryString(false, ...queryParameters)}`,{
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(resp.ok){
                return await resp.json()
            } else {
                setErr(await HandleError('get successful metrics', resp, 'getMetrics'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function getFailed(...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/metrics/failed${ExtractQueryString(false, ...queryParameters)}`,{
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(resp.ok){
                return await resp.json()
            } else {
                setErr(await HandleError('get failed metrics', resp, 'getMetrics'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function getMilliseconds(...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/metrics/milliseconds${ExtractQueryString(false, ...queryParameters)}`,{
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(resp.ok){
                return await resp.json()
            } else {
                setErr(await HandleError('get millisecond metrics', resp, 'getMetrics'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    return {
        err,
        getInvoked,
        getSuccessful,
        getFailed,
        getMilliseconds
    }
}
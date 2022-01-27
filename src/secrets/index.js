import * as React from 'react'
import { HandleError, ExtractQueryString } from '../util'
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

    React.useEffect(() => {
        if (data === null) {
            getSecrets()
        }
    }, [data])

    // getSecrets returns a list of registries
    async function getSecrets(...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/secrets${ExtractQueryString(false, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            let json = await resp.json()
            setData(json.secrets.edges)
            return json.secrets.edges
        } else {
            throw new Error(await HandleError('list secrets', resp, 'listSecrets'))
        }
    }

    async function createSecret(name, value, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/secrets/${name}${ExtractQueryString(false, ...queryParameters)}`, {
            method: "PUT",
            body: value
        })
        if (!resp.ok) {
            throw new Error(await HandleError('create secret', resp, 'createSecret'))
        }
    }

    async function deleteSecret(name, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/secrets/${name}${ExtractQueryString(false, ...queryParameters)}`, {
            method: "DELETE"
        })
        if (!resp.ok) {
            throw new Error(await HandleError('delete secret', resp, 'deleteSecret'))
        }
    }


    return {
        data,
        createSecret,
        deleteSecret,
        getSecrets
    }

}
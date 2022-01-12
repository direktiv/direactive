import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')
/* 
    useNamespaceServiceRevision takes
    - url
    - namespace
    - path
    - service
    - version
    - revision
    - apikey
*/
export const useDirektivWorkflowServiceRevision = (url, namespace, path, service,version, revision, apikey) => {
    const [revisionDetails, setRevisionDetails] = React.useState(null)
    const [podSource, setPodSource] = React.useState(null)
    const [pods, setPods] = React.useState([])
    const [err, setErr] = React.useState(null)
    const [revisionSource, setRevisionSource] = React.useState(null)
    
    const podsRef = React.useRef(pods)


    React.useEffect(()=>{
        if(podSource === null) {
            let listener = new EventSourcePolyfill(`${url}functions/namespaces/${namespace}/tree/${path}?op=pods&svn=${service}&rev=${revision}&version=${version}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })

            listener.onerror = (e) => {
                if(e.status === 403) {
                    setErr("permission denied")
                }
            }

            async function readData(e) {
                let podz = podsRef.current

                if (e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)

                switch (json.event) {
                    case "DELETED":
                        for (var i = 0; i < pods.length; i++) {
                            if (podz[i].name === json.pod.name) {
                                podz.splice(i, 1)
                                podsRef.current = pods
                                break
                            }
                        }
                        break
                    case "MODIFIED":
                        for (i = 0; i < podz.length; i++) {
                            if (podz[i].name === json.pod.name) {
                                podz[i] = json.pod
                                podsRef.current = podz
                                break
                            }
                        }
                        break
                    default:
                        let found = false
                        for (i = 0; i < podz.length; i++) {
                            if (podz[i].name === json.pod.name) {
                                found = true
                                break
                            }
                        }
                        if (!found) {
                            podz.push(json.pod)
                            podsRef.current = pods
                        }
                }
                setPods(JSON.parse(JSON.stringify(podsRef.current)))
                
            }
            listener.onmessage = e => readData(e)
            setPodSource(listener)
        }
    })

    React.useEffect(()=>{
        if(revisionSource === null) {
            // setup event listener 
            let listener = new EventSourcePolyfill(`${url}functions/namespaces/${namespace}/tree/${path}?op=function-revision&svn=${service}&rev=${revision}&version=${version}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })

            listener.onerror = (e) => {
                if(e.status === 403) {
                    setErr("permission denied")
                }
            }

            async function readData(e) {
                if (e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
                if (json.event === "ADDED" || json.event === "MODIFIED") {
                    setRevisionDetails(json.revision)
                }
                // if (json.event === "DELETED") {
                //     history.goBack()
                // }
            }

            listener.onmessage = e => readData(e)
            setRevisionSource(listener)
        }
    },[revisionSource])

    React.useEffect(()=>{
        return () => {
            CloseEventSource(revisionSource)
            CloseEventSource(podSource)
        }
    },[revisionSource, podSource])


    return {
        revisionDetails,
        pods,
        err
    }
}

/* 
    useWorkflowService
    - url
    - namespace
    - path
    - service
    - version
    - apikey
*/
export const useDirektivWorkflowService = (url, namespace, path, service, version, apikey)=> {
    const [revisions, setRevisions] = React.useState(null)
    
    const revisionsRef = React.useRef(revisions ? revisions: [])
    
    
    const [err, setErr] = React.useState(null)
    
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if (eventSource === null){
            // setup event listener 
            let listener = new EventSourcePolyfill(`${url}functions/namespaces/${namespace}/tree/${path}?op=function-revisions&svn=${service}&version=${version}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })

            listener.onerror = (e) => {
                if(e.status === 403) {
                    setErr("permission denied")
                }
            }

            async function readData(e) {
                let revs = revisionsRef.current
                if(e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
                switch (json.event) {
                    case "DELETED":
                        for (var i = 0; i < revs.length; i++) {
                            if (revs[i].name === json.revision.name) {
                                revs.splice(i, 1)
                                revisionsRef.current = revs
                                break
                            }
                        }
                        if (revs.length === 0) {
                            history.goBack()
                        }
                        break
                    case "MODIFIED":
                        for (i = 0; i < revs.length; i++) {
                            if (revs[i].name === json.revision.name) {
                                revs[i] = json.revision
                                revisionsRef.current = revs
                                break
                            }
                        }
                        break
                    default:
                        let found = false
                        for (i = 0; i < revs.length; i++) {
                            if (revs[i].name === json.revision.name) {
                                found = true
                                break
                            }
                        }
                        if (!found) {
                            revs.push(json.revision)
                            revisionsRef.current = revs
                        }
                }

                setRevisions(JSON.parse(JSON.stringify(revisionsRef.current)))
            }

            listener.onmessage = e => readData(e)
            setEventSource(listener)
        }
    },[revisions])

    React.useEffect(()=>{
        return () => {
            CloseEventSource(eventSource)
        }
    },[eventSource])

    return {
        revisions,
        err
    }
}


/*
    useWorkflowServices is a react hook 
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace to use for the api
      - path to use for the api of the workflow
      - apikey to provide authentication of an apikey
*/
export const useDirektivWorkflowServices = (url, stream, namespace, path, apikey)=>{
    const [data, setData] = React.useState(null)
    const functionsRef = React.useRef(data ? data: [])
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)


    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}functions/namespaces/${namespace}/tree/${path}?op=services`, {
                    headers: apikey === undefined ? {}:{"apikey": apikey}
                })

                listener.onerror = (e) => {
                    if(e.status === 403) {
                        setErr("permission denied")
                    }
                }

                async function readData(e) {
                    let funcs = functionsRef.current
                    if(e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    switch (json.event) {
                    case "DELETED":
                        for (var i=0; i < funcs.length; i++) {
                            if(funcs[i].serviceName === json.function.serviceName) {
                                funcs.splice(i, 1)
                                functionsRef.current = funcs
                                break
                            }
                        }
                        break
                    case "MODIFIED":
                        for(i=0; i < funcs.length; i++) {
                            if (funcs[i].serviceName === json.function.serviceName) {
                                funcs[i] = json.function
                                functionsRef.current = funcs
                                break
                            }
                        }
                        break
                    default:
                        let found = false
                        for(i=0; i < funcs.length; i++) {
                            if(funcs[i].serviceName === json.function.serviceName) {
                                found = true 
                                break
                            }
                        }
                        if (!found){
                            funcs.push(json.function)
                            functionsRef.current = funcs
                        }
                    }
                    setData(JSON.parse(JSON.stringify(functionsRef.current)))
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if(data === null) {
                getWorkflowServices()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])


    async function getWorkflowServices(...queryParameters) {
        try {
            let resp = await fetch(`${url}functions/namespaces/${namespace}/tree/${path}?op=services${ExtractQueryString(true, ...queryParameters)}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey},
                method: "GET"
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json)
            } else {
                setErr(await HandleError('get workflow services', resp, 'listServices'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    return {
        data,
        err,
        getWorkflowServices
    }
}
import * as React from 'react'
import fetch from "cross-fetch"
import { CloseEventSource, HandleError } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')


/*
    useGlobalServiceRevisionPodLogs
    - url
    - pod
    - apikey
*/
export const useDirektivGlobalServiceRevisionPodLogs = (url, pod, apikey) => {
    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if (eventSource === null){
            // setup event listener 
            let listener = new EventSourcePolyfill(`${url}functions/logs/pod/${pod}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })

            listener.onerror = (e) => {
                if(e.status === 403) {
                    setErr("permission denied")
                }
            }

            async function readData(e) {
                if(e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
                setData(json)
            }

            listener.onmessage = e => readData(e)
            setEventSource(listener)
        }
    },[])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])

    return {
        data,
        err
    }

}
/*
    useGlobalServiceRevision
    - url
    - service
    - revision
    - apikey
*/
export const useDirektivGlobalServiceRevision = (url, service, revision, apikey) => {
    const [revisionDetails, setRevisionDetails] = React.useState(null)
    const [podSource, setPodSource] = React.useState(null)
    const [pods, setPods] = React.useState([])
    const [err, setErr] = React.useState(null)
    const [revisionSource, setRevisionSource] = React.useState(null)
    
    const podsRef = React.useRef(pods)


    React.useEffect(()=>{
        if(podSource === null) {
            let listener = new EventSourcePolyfill(`${url}functions/${service}/revisions/${revision}/pods`, {
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
            let listener = new EventSourcePolyfill(`${url}functions/${service}/revisions/${revision}`, {
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
    useGlobalService takes
    - url
    - service
    - apikey
*/
export const useDirektivGlobalService = (url, service, apikey) => {
    const [revisions, setRevisions] = React.useState(null)
    const [fn, setFn] = React.useState(null)
    const [traffic, setTraffic] = React.useState(null)
    
    const revisionsRef = React.useRef(revisions ? revisions: [])
    
    
    const [err, setErr] = React.useState(null)
    
    const [trafficSource, setTrafficSource] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if (trafficSource === null) {
            // setup event listener 
            let listener = new EventSourcePolyfill(`${url}functions/${service}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })

            listener.onerror = (e) => {
                if(e.status === 403) {
                    setErr("permission denied")
                }
            }

            async function readData(e) {
                if(e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)

                if (json.event === "MODIFIED" || json.event === "ADDED") {
                    setFn(JSON.parse(JSON.stringify(json.function)))
                    setTraffic(JSON.parse(JSON.stringify(json.traffic)))
                }
            }

            listener.onmessage = e => readData(e)
            setTrafficSource(listener)
        }
    },[fn])

    React.useEffect(()=>{
        if (eventSource === null){
            // setup event listener 
            let listener = new EventSourcePolyfill(`${url}functions/${service}/revisions`, {
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
            CloseEventSource(trafficSource)
        }
    },[eventSource, trafficSource])

    async function createGlobalServiceRevision(image, minScale, size, cmd, traffic) {
        try {
            let resp = await fetch(`${url}functions/${service}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey},
                method: "POST",
                body: JSON.stringify({
                    trafficPercent: traffic,
                    cmd,
                    image,
                    minScale,
                    size
                })
            })
            if (!resp.ok) {
                setErr(await HandleError('create global service revision', resp, 'createRevision'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function deleteGlobalServiceRevision(rev){
        try {
            let resp = await fetch(`${url}functions/${service}/revisions/${rev}`, {
                method: "DELETE"
            })
            if(!resp.ok){
                setErr(await HandleError('delete global service revision', resp, 'deleteRevision'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function setGlobalServiceRevisionTraffic(rev1, rev1value, rev2, rev2value) {
        try {
            let resp = await fetch(`${url}functions/${service}`, {
                method: "PATCH",
                body: JSON.stringify({values:[{
                    revision: rev1,
                    percent: rev1value
                },{
                    revision: rev2,
                    percent: rev2value
                }]})
            })
            if(!resp.ok){
                setErr(await HandleError('update traffic global service', resp, 'updateTraffic'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    return {
        revisions,
        fn,
        traffic,
        err,
        createGlobalServiceRevision,
        deleteGlobalServiceRevision,
        setGlobalServiceRevisionTraffic
    }
}

/*
    useGlobalServices is a react hook 
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - apikey to provide authentication of an apikey
*/
export const useDirektivGlobalServices = (url, stream, apikey) => {
    
    const [data, setData] = React.useState(null)
    const functionsRef = React.useRef(data ? data: [])
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)


    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}functions`, {
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
                getGlobalServices()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])


    async function getGlobalServices() {
        try {
            let resp = await fetch(`${url}functions`, {
                headers: apikey === undefined ? {}:{"apikey": apikey},
                method: "GET"
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json)
            } else {
                setErr(await HandleError('get node', resp, 'listNodes'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function createGlobalService(name, image, minScale, size, cmd) {
        try {
            let resp = await fetch(`${url}functions`, {
                headers: apikey === undefined ? {}:{"apikey": apikey},
                method: "POST",
                body: JSON.stringify({
                    cmd,
                    image,
                    minScale,
                    name,
                    size
                })
            })
            if (!resp.ok) {
                setErr(await HandleError('create global service', resp, 'createService'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function deleteGlobalService(name) {
        try {
            let resp = await fetch(`${url}/functions/${name}`, {
                method: "DELETE"
            })
            if(!resp.ok) {
                setErr(await HandleError('delete global service', resp, 'deleteService'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }



    return {
        data,
        err,
        getGlobalServices,
        createGlobalService,
        deleteGlobalService
    }
}
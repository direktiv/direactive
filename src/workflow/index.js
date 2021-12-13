import * as React from 'react'
import { CloseEventSource, HandleError } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')

/*
    useWorkflows is a react hook which returns a list of items, createDirectory, createWorkflow, deleteDirectory, deleteWorkflow
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - path to the workflow you want to change
      - apikey to provide authentication of an apikey
*/
export const useDirektivWorkflow = (url, stream, namespace, path, apikey) => {

    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/tree/${path}`, {
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
        } else {
            if(data === null) {
                getWorkflow()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])


    async function getWorkflow() {
        try {
            let uri = `${url}namespaces/${namespace}/tree/${path}`
 
            let resp = await fetch(`${uri}/`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
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

    async function getWorkflowSankeyMetrics(rev) {
        let ref = "latest"
        if(rev){
            ref = rev
        }

        let uri = `${url}namespaces/${namespace}/tree/${path}?ref=${rev}&op=metrics-sankey`
        let resp = await fetch(`${uri}`, {
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (resp.ok) {
            return resp.json()
        } else {
            throw new Error(await HandleError('get workflow data', resp, 'getWorkflow'))
        }
    }

    async function getWorkflowRevisionData(rev) {
        let uri = `${url}namespaces/${namespace}/tree/${path}?ref=${rev}`
        let resp = await fetch(`${uri}`, {
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (resp.ok) {
            return resp.json()
        } else {
            throw new Error(await HandleError('get workflow data', resp, 'getWorkflow'))
        }
    }

    async function getRevisions(){
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=refs`,{})
            if(resp.ok) {
                let js = await resp.json()
                return js.edges
            } else {
                setErr(await HandleError('fetch workflow refs', resp, 'getWorkflow'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function updateWorkflow(newwf) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=update-workflow`, {
            method: "post",
            headers: {
                "Content-type": "text/yaml",
                "Content-Length": newwf.length,
            },
            body: newwf
        })
        if (!resp.ok) {
            throw new Error(await HandleError('update workflow', resp, 'updateWorkflow'))
        }
    }

    async function toggleWorkflow(active) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=toggle`, {
            method: "POST",
            body: JSON.stringify({
                live: active
            }),
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (!resp.ok){
            throw new Error( await HandleError('toggle workflow', resp, 'toggleWorkflow'))
        }
    }

    async function getWorkflowRouter() {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=router`, {
            method: "get",
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (resp.ok) {
            return resp.json()
        } else {
            throw new Error(await HandleError('get workflow router', resp, 'getWorkflow'))
        }
    }

    async function editWorkflowRouter(routes, live) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=edit-router`, {
            method: "POST",
            body: JSON.stringify({
                route: routes,
                live: live,
            }),
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (!resp.ok) {
            throw new Error(await HandleError('edit workflow router', resp, 'editRouter'))
        }
    }

    async function setWorkflowLogToEvent(val) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=set-workflow-event-logging`,{
            method: "POST",
            body: JSON.stringify({
                logger: val
            }),
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (!resp.ok){
            throw new Error(await HandleError('set log to event', resp, 'getWorkflow'))
        }
    }

    async function executeWorkflow(input, revision) {
        let ref = "latest"
        if(revision) {
            ref = revision
        }
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=execute&ref=${ref}`, {
            method: "POST",
            body: input,
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.instance
        } else {
            throw new Error(await HandleError('execute workflow', resp, 'executeWorkflow'))
        }
    }

    async function addAttributes(attributes) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=create-node-attributes`, {
            method: "PUT",
            body: JSON.stringify({
                attributes: attributes
            }),
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (!resp.ok){
            throw new Error(await HandleError('add workflow attributes', resp, 'createAttribute'))
        }
    }

    async function deleteAttributes(attributes){
                let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=delete-node-attributes`, {
            method: "DELETE",
            body: JSON.stringify({
                attributes: attributes
            }),
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (!resp.ok){
            throw new Error(await HandleError('delete workflow attributes', resp, 'deleteAttribute'))
        }
    }

    async function getInstancesForWorkflow() {
        let resp = await fetch(`${url}namespaces/${namespace}/instances?filter.field=AS&filter.type=WORKFLOW&filter.val=${path}`,{
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.instances.edges
        } else {
            throw new Error(await HandleError('list instances', resp, 'listInstances'))
        }
    }

    async function getSuccessFailedMetrics() {
        let respFailed = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=metrics-failed`, {
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        let respSuccess = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=metrics-successful`, {
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })

        let x = {
            success: [],
            failure: []
        }

        if(respFailed.ok) {
            let j = await respFailed.json()
            x.failure = j.results
        } else {
            throw new Error(await HandleError("get failed metrics", respFailed, "getMetrics"))
        }

        if(respSuccess.ok){
            let j = await respSuccess.json()
            x.success = j.results
        } else {
            throw new Error(await HandleError("get success metrics", respSuccess, "getMetrics"))
        }

        return x
    }

    async function getStateMillisecondMetrics(){
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=metrics-state-milliseconds`, {
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.results
        } else {
            throw new Error(await HandleError("get state metrics", resp, "getMetrics"))
        }
    }

    async function saveWorkflow(ref){
        let rev = ref
        if(rev === undefined){
            rev = "latest"
        }
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=save-workflow&ref=${rev}`, {
            method: "POST",
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if (!resp.ok) {
            throw new Error(await HandleError('save workflow', resp, 'saveWorkflow'))
        }

        return resp.json()
    }

    async function deleteRevision(ref) {
        let rev = ref
        if(rev === undefined){
            rev = "latest"
        }

        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=delete-revision&ref=${ref}`, {
            method:"POST",
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if(!resp.ok) {
            throw new Error(await HandleError(`delete revision`, resp, 'deleteRevision'))
        }
    }

    async function discardWorkflow(ref) {
        let rev = ref
        if(rev === undefined){
            rev = "latest"
        }

        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=discard-workflow&ref=${rev}`, {
            method: "POST",
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if(!resp.ok) {
            throw new Error(await HandleError('discard workflow', resp, 'discardWorkflow'))
        }
    }

    async function tagWorkflow(ref, tag) {
        let rev = ref
        if(rev === undefined){
            rev = "latest"
        }
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=tag&ref=${ref}&tag=${tag}`,{
            method: "POST",
            headers: apikey === undefined ? {}:{"apikey": apikey}
        })
        if(!resp.ok) {
            throw new Error(await HandleError(`tag workflow`, resp, 'tag'))
        }
    }

    return {
        data,
        err,
        getWorkflow,
        setWorkflowLogToEvent,
        getWorkflowRevisionData,
        getWorkflowSankeyMetrics,
        getSuccessFailedMetrics,
        toggleWorkflow,
        getWorkflowRouter,
        editWorkflowRouter,
        executeWorkflow,
        updateWorkflow,
        saveWorkflow,
        discardWorkflow,
        tagWorkflow,
        getRevisions,
        deleteRevision,
        addAttributes,
        deleteAttributes,
        getInstancesForWorkflow,
        getStateMillisecondMetrics
    }
}
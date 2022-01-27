import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString, PageInfoProcessor } from '../util'
const { EventSourcePolyfill } = require('event-source-polyfill')
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

    // Internal pageInfo tracking for instances
    const [instanceData, setInstanceData] = React.useState(null)
    const [instancePageInfo, setInstancePageInfo] = React.useState(null)

    React.useEffect(() => {
        if (stream) {
            if (eventSource === null) {
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/tree/${path}`, {
                    headers: apikey === undefined ? {} : { "apikey": apikey }
                })

                listener.onerror = (e) => {
                    if (e.status === 404) {
                        setErr(e.statusText)
                    } else if (e.status === 403) {
                        setErr("permission denied")
                    }
                }

                async function readData(e) {
                    if (e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    setData(json)
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if (data === null) {
                getWorkflow()
            }
        }
    }, [data])

    React.useEffect(() => {
        return () => CloseEventSource(eventSource)
    }, [eventSource])


    async function getWorkflow(...queryParameters) {
        let uri = `${url}namespaces/${namespace}/tree/${path}`

        let resp = await fetch(`${uri}/${ExtractQueryString(false, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            let json = await resp.json()
            setData(json)
            return json
        } else {
            throw new Error(await HandleError('get node', resp, 'listNodes'))
        }
    }

    async function getWorkflowSankeyMetrics(rev, ...queryParameters) {
        let ref = "latest"
        if (rev) {
            ref = rev
        }

        let uri = `${url}namespaces/${namespace}/tree/${path}?ref=${rev}&op=metrics-sankey`
        let resp = await fetch(`${uri}${ExtractQueryString(true, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            return resp.json()
        } else {
            throw new Error(await HandleError('get workflow data', resp, 'getWorkflow'))
        }
    }

    async function getWorkflowRevisionData(rev, ...queryParameters) {
        let uri = `${url}namespaces/${namespace}/tree/${path}?ref=${rev}`
        let resp = await fetch(`${uri}${ExtractQueryString(true, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            return resp.json()
        } else {
            throw new Error(await HandleError('get workflow data', resp, 'getWorkflow'))
        }
    }

    async function getRevisions(...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=refs${ExtractQueryString(true, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            return await resp.json()
        } else {
            throw new Error(await HandleError('fetch workflow refs', resp, 'getWorkflow'))
        }
    }

    async function getTags(...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=tags${ExtractQueryString(true, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            return await resp.json()
        } else {
            throw new Error(await HandleError('fetch workflow tags', resp, 'getWorkflow'))
        }
    }

    async function updateWorkflow(newwf, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=update-workflow${ExtractQueryString(true, ...queryParameters)}`, {
            method: "post",
            headers: apikey === undefined ? {} : { "apikey": apikey },
            headers: {
                "Content-type": "text/yaml",
                "Content-Length": newwf.length,
                "apikey": apikey === undefined ? "" : apikey
            },
            body: newwf
        })
        if (!resp.ok) {
            throw new Error(await HandleError('update workflow', resp, 'updateWorkflow'))
        }
    }

    async function toggleWorkflow(active, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=toggle${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            body: JSON.stringify({
                live: active
            }),
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('toggle workflow', resp, 'toggleWorkflow'))
        }
    }

    async function getWorkflowRouter(...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=router${ExtractQueryString(true, ...queryParameters)}`, {
            method: "get",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            return resp.json()
        } else {
            throw new Error(await HandleError('get workflow router', resp, 'getWorkflow'))
        }
    }

    async function editWorkflowRouter(routes, live, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=edit-router${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            body: JSON.stringify({
                route: routes,
                live: live,
            }),
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('edit workflow router', resp, 'editRouter'))
        }
    }

    async function setWorkflowLogToEvent(val, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=set-workflow-event-logging${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            body: JSON.stringify({
                logger: val
            }),
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('set log to event', resp, 'getWorkflow'))
        }
    }

    async function executeWorkflow(input, revision, ...queryParameters) {
        let ref = "latest"
        if (revision) {
            ref = revision
        }
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=execute&ref=${ref}${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            body: input,
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.instance
        } else {
            throw new Error(await HandleError('execute workflow', resp, 'executeWorkflow'))
        }
    }

    async function addAttributes(attributes, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=create-node-attributes${ExtractQueryString(true, ...queryParameters)}`, {
            method: "PUT",
            body: JSON.stringify({
                attributes: attributes
            }),
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('add workflow attributes', resp, 'createAttribute'))
        }
    }

    async function deleteAttributes(attributes, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=delete-node-attributes${ExtractQueryString(true, ...queryParameters)}`, {
            method: "DELETE",
            body: JSON.stringify({
                attributes: attributes
            }),
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('delete workflow attributes', resp, 'deleteAttribute'))
        }
    }

    async function getInstancesForWorkflow(...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/instances?filter.field=AS&filter.type=WORKFLOW&filter.val=${path}${ExtractQueryString(true, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            let json = await resp.json()
            let pInfo = PageInfoProcessor(instancePageInfo, json.instances.pageInfo, instanceData, json.instances.edges, ...queryParameters)
            setInstancePageInfo(pInfo.pageInfo)
            json.instances.pageInfo = pInfo.pageInfo
            if (pInfo.shouldUpdate) {
                setInstanceData(json.instances.edges)
            } else {
                json.instances.edges = instanceData
            }

            return json
        } else {
            throw new Error(await HandleError('list instances', resp, 'listInstances'))
        }
    }

    async function getSuccessFailedMetrics(...queryParameters) {
        let respFailed = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=metrics-failed${ExtractQueryString(true, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        let respSuccess = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=metrics-successful${ExtractQueryString(true, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })

        let x = {
            success: [],
            failure: []
        }

        if (respFailed.ok) {
            let j = await respFailed.json()
            x.failure = j.results
        } else {
            throw new Error(await HandleError("get failed metrics", respFailed, "getMetrics"))
        }

        if (respSuccess.ok) {
            let j = await respSuccess.json()
            x.success = j.results
        } else {
            throw new Error(await HandleError("get success metrics", respSuccess, "getMetrics"))
        }

        return x
    }

    async function getStateMillisecondMetrics(...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=metrics-state-milliseconds${ExtractQueryString(true, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.results
        } else {
            throw new Error(await HandleError("get state metrics", resp, "getMetrics"))
        }
    }

    async function saveWorkflow(ref, ...queryParameters) {
        let rev = ref
        if (rev === undefined) {
            rev = "latest"
        }
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=save-workflow&ref=${rev}${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('save workflow', resp, 'saveWorkflow'))
        }

        return resp.json()
    }

    async function deleteRevision(ref, ...queryParameters) {
        let rev = ref
        if (rev === undefined) {
            rev = "latest"
        }

        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=delete-revision&ref=${ref}${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError(`delete revision`, resp, 'deleteRevision'))
        }
    }

    async function removeTag(tag, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=untag&ref=${tag}${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError(`untag`, resp, 'untag'))
        }
    }

    async function discardWorkflow(ref, ...queryParameters) {
        let rev = ref
        if (rev === undefined) {
            rev = "latest"
        }

        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=discard-workflow&ref=${rev}${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('discard workflow', resp, 'discardWorkflow'))
        }
    }

    async function tagWorkflow(ref, tag, ...queryParameters) {
        let rev = ref
        if (rev === undefined) {
            rev = "latest"
        }
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=tag&ref=${ref}&tag=${tag}${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
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
        getTags,
        removeTag,
        deleteRevision,
        addAttributes,
        deleteAttributes,
        getInstancesForWorkflow,
        getStateMillisecondMetrics
    }
}
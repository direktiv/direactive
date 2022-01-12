import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')


export const noop = `description: A simple 'no-op' state that returns 'Hello world!'
states:
- id: helloworld
  type: noop
  transform:
    result: Hello world!
`

export const action = `description: A simple 'action' state that sends a get request
functions:
- id: get
  image: direktiv/request:v1
  type: reusable
states:
- id: getter 
  type: action
  action:
    function: get
    input: 
      method: "GET"
      url: "https://jsonplaceholder.typicode.com/todos/1"
`

export const consumeEvent = `functions:
- id: greeter
  image: direktiv/greeting:v1
  type: reusable
description: A simple 'consumeEvent' state that listens for the greetingcloudevent generated from the template 'generate-event'.
states:
- id: ce
  type: consumeEvent
  event:
    type: greetingcloudevent
  timeout: PT1H
  transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform:
    greeting: jq(.return.greeting)
`

export const delay =`description: A simple 'delay' state that waits for 5 seconds
states:
- id: delay
  type: delay
  duration: PT5S
`

export const error =`description: A simple 'error' state workflow that checks an email attempts to validate it.
states:
- id: data
  type: noop
  transform: 
    email: "trent.hilliamdirektiv.io"
  transition: validate-email
- id: validate-email
  type: validate
  subject: jq(.)
  schema:
    type: object
    properties:
      email:
        type: string
        format: email
  catch:
  - error: direktiv.schema.*
    transition: email-not-valid 
  transition: email-valid
- id: email-not-valid
  type: error
  error: direktiv.schema.*
  message: "email '.email' is not valid"
- id: email-valid
  type: noop
  transform: 
    result: "Email is valid."
`

export const foreach =`description: A simple 'foreach' state that solves expressions
functions: 
- id: solve
  image: direktiv/solve:v1
  type: reusable
states:
- id: data
  type: noop
  transform: 
    expressions: ["4+10", "15-14", "100*3","200/2"] 
  transition: solve
- id: solve
  type: foreach
  array: 'jq(.expressions[] | { expression: . })'
  action:
    function: solve
    input:
      x: jq(.expression)
  transform:
    solved: jq(.return)
`

export const generateEvent =`description: A simple 'generateEvent' state that sends data to a greeting listener.
states:
- id: generate
  type: generateEvent
  event:
    type: greetingcloudevent
    source: Direktiv
    data: 
      name: "Trent"
`

export const generateSolveEvent =`description: A simple 'generateEvent' state that sends an expression to a solve listener.
states:
- id: generate
  type: generateEvent
  event:
    type: solveexpressioncloudevent
    source: Direktiv
    data: 
      x: "10+5"
`

export const getAndSet=`description: "Simple Counter getter and setter variable example"
states:
  - id: counter-get
    type: getter 
    transition: counter-set
    variables:
    - key: ExampleVariableCounter
      scope: workflow
    transform: 'jq(. += {"newCounter": (.var.ExampleVariableCounter + 1)})'
  - id: counter-set
    type: setter
    variables:
      - key: ExampleVariableCounter
        scope: workflow 
        value: 'jq(.newCounter)'
`

export const parallel=`description: A simple 'parallel' state workflow that runs solve container to solve expressions.
functions: 
- id: solve
  image: direktiv/solve:v1
  type: reusable
states:
- id: run
  type: parallel
  actions:
  - function: solve
    input: 
      x: "10*2"
  - function: solve
    input:
      x: "10%2"
  - function: solve
    input:
      x: "10-2"
  - function: solve
    input:
      x: "10+2"
  # Mode 'and' waits for all actions to be completed
  # Mode 'or' waits for the first action to be completed
  mode: and
`

export const validate =`description: A simple 'validate' state workflow that checks an email
states:
- id: data
  type: noop
  transform:
    email: "trent.hilliam@direktiv.io"
  transition: validate-email
- id: validate-email
  type: validate
  subject: jq(.)
  schema:
    type: object
    properties:
      email:
        type: string
        format: email
  catch:
  - error: direktiv.schema.*
    transition: email-not-valid 
  transition: email-valid
- id: email-not-valid
  type: noop
  transform:
    result: "Email is not valid."
- id: email-valid
  type: noop
  transform:
    result: "Email is valid."
`

export const zwitch = `description: A simple 'switch' state that checks whether the age provided is older than 18.
states:
- id: data
  type: noop
  transform:
    age: 27
  transition: check
- id: check
  type: switch
  conditions:
  - condition: 'jq(.age > 18)'
    transition: olderthan18
  defaultTransition: youngerthan18
- id: olderthan18
  type: noop
  transform: 
    result: "You are older than 18."
- id: youngerthan18
  type: noop
  transform: 
    result: "You are younger than 18."
`

export const eventXor = `functions:
- id: greeter
  image: direktiv/greeting:v1
  type: reusable
- id: solve2
  image: direktiv/solve:v1
  type: reusable
description: A simple 'eventXor' that waits for events to be received.
states:
- id: event-xor
  type: eventXor
  timeout: PT1H
  events:
  - event: 
      type: solveexpressioncloudevent
    transition: solve
  - event: 
      type: greetingcloudevent
    transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform: 
    greeting: jq(.return.greeting)
- id: solve
  type: action
  action:
    function: solve2
    input: jq(.solveexpressioncloudevent.data)
  transform: 
    solvedexpression: jq(.return)
`

export const eventAnd =`functions:
- id: greeter
  image: direktiv/greeting:v1
  type: reusable
- id: solve
  image: direktiv/solve:v1
  type: reusable
description: A simple 'eventAnd' that waits for events to be received.
states:
- id: event-and
  type: eventAnd
  timeout: PT1H
  events:
  - type: greetingcloudevent
  - type: solveexpressioncloudevent
  transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform: 
    greeting: jq(.return.greeting)
    ceevent: jq(.solveexpressioncloudevent)
  transition: solve
- id: solve
  type: action
  action:
    function: solve
    input: jq(.ceevent.data)
  transform: 
    msggreeting: jq(.greeting)
    solvedexpression: jq(.return)
`
/*
    useNodes is a react hook which returns a list of items, createDirectory, createWorkflow, deleteDirectory, deleteWorkflow
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - apikey to provide authentication of an apikey
*/
export const useDirektivNodes = (url, stream, namespace, path, apikey, orderField) => {
    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [load, setLoad] = React.useState(true)
    const [eventSource, setEventSource] = React.useState(null)
    const templates = {
        noop,
        action,
        consumeEvent,
        delay,
        error,
        foreach,
        generateEvent,
        generateSolveEvent,
        getAndSet,
        parallel,
        validate,
        zwitch,
        eventXor,
        eventAnd,

    }

    React.useEffect(()=>{
        if(!load && eventSource !== null) {
            CloseEventSource(eventSource)
            setErr(null)
            setData(null)
            
            // setup event listener 
            let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/tree${path}?order.field=${orderField ? orderField : "NAME"}`, {
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
    },[path, namespace, orderField])

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/tree${path}?order.field=${orderField ? orderField : "NAME"}`, {
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
                setLoad(false)
            }
        } else {
            if(data === null) {
                getNode()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])

    async function getNode(...queryParameters) {
        try {
            let uri = `${url}namespaces/${namespace}/tree`
            if(path !== "") {
                uri += `${sanitizePath(path)}`
            }
            let resp = await fetch(`${uri}/${ExtractQueryString(false, queryParameters)}`, {
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

    async function createNode(name, type, yaml,...queryParameters) {
        try {
            let uriPath = `${url}namespaces/${namespace}/tree`
            if(path !== "") {
                uriPath += `${sanitizePath(path)}`
            }
            let body = {
                type: type
            }
            if(type === "workflow") {
                body = yaml
                name += `?op=create-workflow`
            } else {
                name += `?op=create-directory`
                body = JSON.stringify(body)
            }
            let resp = await fetch(`${uriPath}/${name}${ExtractQueryString(false, queryParameters)}`, {
                method: "PUT",
                body: body,
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok) {
                return await HandleError('create node', resp, 'createNode')
            }
        } catch(e){
            return e.message
        }
    }

    async function deleteNode(name,...queryParameters) {
        try {
            let uriPath = `${url}namespaces/${namespace}/tree`
            if(path){
                uriPath += `${sanitizePath(path)}`
            }
            let resp = await fetch(`${uriPath}/${name}?op=delete-node${ExtractQueryString(true, queryParameters)}`, {
                method: "DELETE",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(!resp.ok){
                return await HandleError('delete node', resp, 'deleteNode')
            }
        } catch(e) {
            return e.message
        }
    }

    async function renameNode(fpath, oldname, newname,...queryParameters) {
        try {
            let uriPath = `${url}namespaces/${namespace}/tree`
            if(path) {
                uriPath += `${sanitizePath(fpath)}`
            }
            let resp = await fetch(`${uriPath}/${oldname}?op=rename-node${ExtractQueryString(true, queryParameters)}`,{
                method: "POST",
                body: JSON.stringify({new: newname}),
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok) {
                return await HandleError('rename node', resp, 'renameNode')
            }
        } catch(e) {
            return e.message
        }
    }

    async function getWorkflowRouter(workflow,...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${workflow}?op=router${ExtractQueryString(true, queryParameters)}`, {
                method: "get",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                return json.live
            } else {
                setErr(await HandleError('get workflow router', resp, 'getWorkflow'))
            }
        } catch (e) {
            setErr(e.message)
        }
    }

    async function toggleWorkflow(workflow, active,...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${workflow}?op=toggle${ExtractQueryString(true, queryParameters)}`, {
                method: "POST",
                body: JSON.stringify({
                    live: active
                }),
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok){
                return await HandleError('toggle workflow', resp, 'toggleWorkflow')
            }
        } catch(e) {
           return e.message
        }
    }

    function sanitizePath(path) {
      if (path === "/") {
        return ""
      }
      
      if (path.startsWith("/")) {
        return path
      }

      return "/" + path
    }

    return {
        data,
        err,
        templates,
        getNode,
        createNode,
        deleteNode,
        renameNode,
        toggleWorkflow,
        getWorkflowRouter,
    }
}
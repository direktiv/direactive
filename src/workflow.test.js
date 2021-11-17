import { renderHook, act } from "@testing-library/react-hooks";
import * as matchers from 'jest-extended';
import {useNodes, useWorkflow} from './index'
import { Config } from "./util";
expect.extend(matchers);

// mock timer using jest
jest.useFakeTimers();

const wfyaml = `states:
- id: helloworld
  type: noop
  transform:
    result: Hello world!
`

const wfyaml2 = `states:
- id: helloworld2
  type: noop
  transform:
    result: Hello world2!
`

beforeAll(async ()=>{
    console.log('creating workflow')
    const { result, waitForNextUpdate} = renderHook(()=> useNodes(Config.url, true, Config.namespace, ""))
    await waitForNextUpdate()
    await act( async()=>{
        await result.current.createNode("/test-workflow-hook", "workflow",  wfyaml)
    })
})

describe('useWorkflow', () => {
    it('fetch workflow',  async () => {
        const { result, waitForNextUpdate } = renderHook(() => useWorkflow(Config.url, false, Config.namespace, "test-workflow-hook"));
        await waitForNextUpdate()
        expect(result.current.data.revision.source).not.toEqual("")
    })
    it('stream  workflow', async() => {
        const { result, waitForNextUpdate } = renderHook(() => useWorkflow(Config.url, true, Config.namespace, "test-workflow-hook"));
        await waitForNextUpdate()
        expect(result.current.data.revision.source).not.toEqual("")
    })
    it('update workflow', async() => {
        const { result, waitForNextUpdate } = renderHook(() => useWorkflow(Config.url, true, Config.namespace, "test-workflow-hook"));
        await waitForNextUpdate()
        act(()=>{
            result.current.updateWorkflow(wfyaml2)
        })
        await waitForNextUpdate()
        expect(atob(result.current.data.revision.source)).toEqual(wfyaml2)
    })
    it('add workflow attributes', async()=>{
        const { result, waitForNextUpdate } = renderHook(() => useWorkflow(Config.url, false, Config.namespace, "test-workflow-hook"));
        await waitForNextUpdate()
        await act(async()=>{
            await result.current.addAttributes(["test", "test2"])
            await result.current.getWorkflow()
        })
        expect(result.current.data.node.attributes).toEqual(["test", "test2"])

        await act(async()=>{
            await result.current.deleteAttributes(["test", "test2"])
            await result.current.getWorkflow()
        })

        expect(result.current.data.node.attributes.length).toEqual(0)
    })
    it('execute workflow', async ()=>{
        const { result, waitForNextUpdate } = renderHook(() => useWorkflow(Config.url, true, Config.namespace, "test-workflow-hook"));
        await waitForNextUpdate()
        let instanceId = await result.current.executeWorkflow()
        expect(instanceId).not.toEqual("")
    })
    it('list instances for workflow', async ()=> {
        const { result, waitForNextUpdate } = renderHook(() => useWorkflow(Config.url, true, Config.namespace, "test-workflow-hook"));
        await waitForNextUpdate()
        let instances = await result.current.getInstancesForWorkflow()
        expect(instances[0].node.as).toEqual("test-workflow-hook")
    })
    it('toggle workflow and check router to see active is false', async()=>{
        const { result, waitForNextUpdate } = renderHook(() => useWorkflow(Config.url, true, Config.namespace, "test-workflow-hook"));
        await waitForNextUpdate()
        await act (async()=>{
            await result.current.toggleWorkflow(false)
        })
        let active = await result.current.getWorkflowRouter()
        expect(active).not.toBeTrue()
        await act (async()=>{
            await result.current.toggleWorkflow(true)
        })
        active = await result.current.getWorkflowRouter()
        expect(active).toBeTrue()
    })
    it('set workflow to log to event', async ()=> {
        const { result, waitForNextUpdate } = renderHook(() => useWorkflow(Config.url, false, Config.namespace, "test-workflow-hook"));
        await waitForNextUpdate()
        await act (async ()=>{
           await result.current.setWorkflowLogToEvent("test")
           await result.current.getWorkflow()
        })
        expect(result.current.data.eventLogging).toEqual("test")
    })
    it('get state metrics for workflow', async ()=>{
        const { result, waitForNextUpdate } = renderHook(() => useWorkflow(Config.url, false, Config.namespace, "test-workflow-hook"));
        await waitForNextUpdate()
        expect(await result.current.getStateMillisecondMetrics()).toBeInstanceOf(Array)
    })
})

afterAll(async ()=>{
    console.log('deleting workflow')

    const { result, waitForNextUpdate} = renderHook(()=> useNodes(Config.url, true, Config.namespace, ""))
    await waitForNextUpdate()
    act( ()=>{
        result.current.deleteNode('test-workflow-hook')
    })
    await waitForNextUpdate()
})
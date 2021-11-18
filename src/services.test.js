import { renderHook, act } from "@testing-library/react-hooks";
import * as matchers from 'jest-extended';
import { Config } from "./util";
import {useGlobalService, useGlobalServiceRevision, useGlobalServiceRevisionPodLogs, useGlobalServices, useNamespaceServices, useNodes, useWorkflowServices} from './index'
expect.extend(matchers);

// mock timer using jest
jest.useFakeTimers();
jest.setTimeout(30000)

const wfyaml = `functions:
- id: req
  image: direktiv/request:v1
  type: reusable
states:
- id: helloworld
  type: noop
  transform:
    result: Hello world!
`


// beforeAll(async ()=>{
//     console.log('creating workflow')
//     const { result, waitForNextUpdate} = renderHook(()=> useNodes(Config.url, true, Config.namespace, ""))
//     await waitForNextUpdate()
//     await act( async()=>{
//         await result.current.createNode("/test-workflow-services", "workflow",  wfyaml)
//     })
// })

// describe('useWorkflowServices',()=>{
//     it('fetch workflow services', async()=>{
//         const { result, waitForNextUpdate} = renderHook(()=> useWorkflowServices(Config.url, false, Config.namespace, "test-workflow-services"))
//         await waitForNextUpdate()
//         expect(result.current.data.config.maxscale).toBe(3)
//     })
//     it('stream workflow services', async()=>{
//         const { result, waitForNextUpdate} = renderHook(()=> useWorkflowServices(Config.url, true, Config.namespace, "test-workflow-services"))
//         await waitForNextUpdate()
//         expect(result.current.data[0].info.path).toBe("test-workflow-services")
//     })
// })

// describe('useNamespaceServices', ()=>{
//     it('fetch namespace services', async()=>{
//         const { result, waitForNextUpdate} = renderHook(()=> useNamespaceServices(Config.url, false, Config.namespace))
//         await waitForNextUpdate()
//         expect(result.current.data.config.maxscale).toBe(3)
//     })
//     it('stream namespace services, create a service then delete a service', async()=>{
//         const { result, waitForNextUpdate} = renderHook(()=> useNamespaceServices(Config.url, true, Config.namespace))

//         await act(async()=>{
//             await result.current.createNamespaceService('testnamespaceservice', 'direktiv/request:v1', 0, 0, "")
//         })

//         let found = false
//         for(var i=0; i < result.current.data.length; i++) {
//             if(result.current.data[i].info.name === "testnamespaceservice") {
//                 found = true
//             }
//         }
//         expect(found).toBeTrue()
    
//         await act(async()=>{
//             await result.current.deleteNamespaceService('testnamespaceservice')
//         })

//         found = false
//         for(var i=0; i < result.current.data.length; i++) {
//             if(result.current.data[i].info.name === "testnamespaceservice") {
//                 found = true
//             }
//         }
//         expect(found).not.toBeTrue()
//     })
// })

describe('useGlobalServices', ()=>{
    it('fetch global services', async()=>{
        const { result, waitForNextUpdate} = renderHook(()=> useGlobalServices(Config.url, false))
        await waitForNextUpdate()
        expect(result.current.data.config.maxscale).toBe(3)
    })
    it('stream global services, create a service then delete a service', async()=>{
        const { result, waitForNextUpdate} = renderHook(()=> useGlobalServices(Config.url, true))

        await act(async()=>{
            await result.current.createGlobalService('testglobalservice', 'direktiv/request:v1', 0, 0, "")
            await result.current.createGlobalService('service-revision-test-global', 'direktiv/request:v1', 0, 0, "")
        })

        let found = false
        for(var i=0; i < result.current.data.length; i++) {
            if(result.current.data[i].info.name === "testglobalservice") {
                found = true
            }
        }
        expect(found).toBeTrue()
    
        await act(async()=>{
            await result.current.deleteGlobalService('testglobalservice')
        })

        found = false
        for(var i=0; i < result.current.data.length; i++) {
            if(result.current.data[i].info.name === "testglobalservice") {
                found = true
            }
        }
        expect(found).not.toBeTrue()
    })
    describe('useGlobalService', ()=>{
        it('fetch service details (fn, revisions, traffic)', async()=>{
            const { result, waitForNextUpdate} = renderHook(()=> useGlobalService(Config.url, "service-revision-test-global"))
            await waitForNextUpdate()
            await waitForNextUpdate()
            expect(result.current.fn.info.name).toBe("service-revision-test-global")
            expect(result.current.revisions[0].image).toBe("direktiv/request:v1")
            expect(result.current.traffic).toBeInstanceOf(Array)
        })
        it('create a new revision, set traffic to 50/50 then delete the first revision', async()=>{
            const { result, waitForNextUpdate} = renderHook(()=> useGlobalService(Config.url, "service-revision-test-global"))
            await waitForNextUpdate()

            await act(async()=>{
                await result.current.createGlobalServiceRevision('direktiv/request:v1', 0, 0, "", 100)
            })

            await waitForNextUpdate()

            expect(result.current.revisions.length).toBe(2)

            // set traffic to 50/50
            await act(async()=>{
                await result.current.setGlobalServiceRevisionTraffic(result.current.revisions[0].name, 50, result.current.revisions[1].name, 50)
            })

            await waitForNextUpdate()

            await act(async()=>{
                // delete 1st revision
                await result.current.deleteGlobalServiceRevision("00001")
            })

            await waitForNextUpdate()

            expect(result.current.revisions.length).toBe(1)
        })
        describe('useGlobalServiceRevisionPod', ()=>{
            it('get revision details and pods', async()=>{
                const { result, waitForNextUpdate} = renderHook(()=> useGlobalServiceRevision(Config.url, "service-revision-test-global", "00002"))
                await waitForNextUpdate()
                await waitForNextUpdate()
                await waitForNextUpdate()
                expect(result.current.revisionDetails.image).toBe("direktiv/request:v1")
                expect(result.current.pods).toBeInstanceOf(Array)
                process.env.POD_ID = result.current.pods[0].name
            })
        })
        describe('useGlobalServiceRevisionPodLogs', ()=>{
            it('get pods logs', async()=>{
                console.log(process.env.POD_ID)
                const { result, waitForNextUpdate} = renderHook(()=> useGlobalServiceRevisionPodLogs(Config.url, process.env.POD_ID))
                console.log(result.current)
                await waitForNextUpdate()
                console.log(result.current)
            })
        })
    })    
})




// afterAll(async ()=>{
//     console.log('deleting workflow')

//     const { result, waitForNextUpdate} = renderHook(()=> useNodes(Config.url, true, Config.namespace, ""))
//     await waitForNextUpdate()
//     act( ()=>{
//         result.current.deleteNode('test-workflow-services')
//     })
//     await waitForNextUpdate()
// })
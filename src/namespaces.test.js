import { useNamespaces } from './namespaces'
import { renderHook, act } from "@testing-library/react-hooks";
import * as matchers from 'jest-extended';
expect.extend(matchers);

// mock timer using jest
jest.useFakeTimers();

describe('useNamespaces', () => {
  it('fetch namespaces',  async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNamespaces("http://172.16.67.147/api/", false));
    await waitForNextUpdate()
    expect(result.current.data).toBeArray()
  })
  it('stream namespaces', async() => {
    const { result, waitForNextUpdate } = renderHook(() => useNamespaces("http://172.16.67.147/api/", true));
    await waitForNextUpdate()
    expect(result.current.data).toBeArray()
  })
  it('create a namespace', async() => {
    const { result, waitForNextUpdate } = renderHook(() => useNamespaces("http://172.16.67.147/api/", true));
    // wait for initial result    
    await waitForNextUpdate()

    // create a namespace
    result.current.createNamespace("trent")
    await waitForNextUpdate()
    let found = false
    for(var i=0; i < result.current.data.length; i++) {
        if(result.current.data[i].node.name === "trent") {
            found = true
        }
    }
    expect(found).toBeTrue()
  })
  it('delete a namespace', async() => {
    const { result, waitForNextUpdate } = renderHook(() => useNamespaces("http://172.16.67.147/api/", true));
    // wait for initial result
    await waitForNextUpdate()
    
    // delete a namespace
    result.current.deleteNamespace("trent")
    await waitForNextUpdate()
    let found = false
    for(var i=0; i < result.current.data.length; i++) {
        if(result.current.data[i].node.name === "trent") {
            found = true
        }
    }
    expect(found).toBeFalse()
  })
})

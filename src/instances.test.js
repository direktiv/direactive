import { renderHook, act } from "@testing-library/react-hooks";
import * as matchers from 'jest-extended';
import {useInstances} from './index'
import { Config } from "./util";
expect.extend(matchers);

// mock timer using jest
jest.useFakeTimers();

describe('useInstances', () => {
    it('fetch instances',  async () => {
        const { result, waitForNextUpdate } = renderHook(() => useInstances(Config.url, false, Config.namespace));
        await waitForNextUpdate()
        expect(result.current.data).toBeArray()
      })
    it('stream instances', async() => {
        const { result, waitForNextUpdate } = renderHook(() => useInstances(Config.url, true, Config.namespace));
        await waitForNextUpdate()
        expect(result.current.data).toBeArray()
    })
})
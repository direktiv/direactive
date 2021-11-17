import {useDirektivInstances} from './instances'
import {useDirektivJQPlayground} from './jqplayground'
import {useDirektivNamespaces} from './namespaces'
import {useDirektivNamespaceLogs} from './namespaces/logs'
import {useDirektivRegistries} from './registries'
import {useDirektivGlobalRegistries} from './registries/global'
import {useDirektivGlobalPrivateRegistries} from './registries/global-private'
import {useDirektivSecrets} from './secrets'
import {useDirektivNodes} from './nodes'
import { useDirektivWorkflow } from './workflow'
import {useDirektivWorkflowVariables} from './workflow/variables'
import {useDirektivBroadcastConfiguration} from './event-configuration'


export const useBroadcastConfiguration = useDirektivBroadcastConfiguration
export const useWorkflowVariables = useDirektivWorkflowVariables
export const useWorkflow = useDirektivWorkflow
export const useNodes = useDirektivNodes
export const useInstances = useDirektivInstances
export const useJQPlayground = useDirektivJQPlayground
export const useNamespaces = useDirektivNamespaces
export const useRegistries = useDirektivRegistries
export const useGlobalRegistries = useDirektivGlobalRegistries
export const useGlobalPrivateRegistries = useDirektivGlobalPrivateRegistries
export const useNamespaceLogs = useDirektivNamespaceLogs
export const useSecrets = useDirektivSecrets

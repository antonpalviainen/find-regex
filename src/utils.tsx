interface BaseMessage {
  type: string
  instanceId: number
}

interface ColorMessage extends BaseMessage {
  type: 'color'
  backgroundColor?: string
  color?: string
}

interface CountMessage extends BaseMessage {
  type: 'count'
  count: number
}

interface ErrorMessage extends BaseMessage {
  type: 'error'
  message: string
}

interface InitMessage extends BaseMessage {
  type: 'init'
}

interface QueryMessage extends BaseMessage {
  type: 'query'
  query: string
}

export type Message =
  | ColorMessage
  | CountMessage
  | ErrorMessage
  | InitMessage
  | QueryMessage

async function getTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab.id!
}

export async function getStorageValue(key: string) {
  try {
    const result = await chrome.storage.sync.get(key)
    console.log('getStorageValue', key, result[key])
    return result[key] ?? null
  } catch (error) {
    console.error('getStorageValue error:', error)
    return null
  }
}

export async function setStorageValue(key: string, value: any) {
  console.log('setStorageValue', key, value)
  try {
    await chrome.storage.sync.set({ [key]: value })
  } catch (error) {
    console.error('setStorageValue error:', error)
  }
}

export async function sendMessageToTab(message: Message) {
  const tabId = await getTabId()
  console.log('sendMessageToTab', tabId, message)
  try {
    return await chrome.tabs.sendMessage(tabId, message)
  } catch (error) {
    console.error('sendMessageToTab error:', error)
  }
}

export async function sendMessageToRuntime(message: Message) {
  console.log('sendMessageToRuntime', message)
  try {
    return await chrome.runtime.sendMessage(message)
  } catch (error) {
    console.error('sendMessageToRuntime error:', error)
  }
}

export async function removeStorageValue(key: string) {
  console.log('removeStorageValue', key)
  try {
    await chrome.storage.sync.remove(key)
  } catch (error) {
    console.error('removeStorageValue error:', error)
  }
}

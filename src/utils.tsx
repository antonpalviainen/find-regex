interface Message {
  type: 'color' | 'count' | 'query'
  content?: any
}

async function getTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab.id!
}

export async function getStorageValue(key: string) {
  console.log('getStorageValue', key)
  const result = await chrome.storage.sync.get(key)
  return result[key] ?? null
}

export async function setStorageValue(key: string, value: any) {
  console.log('setStorageValue', key, value)
  await chrome.storage.sync.set({ [key]: value })
}

export async function sendMessageToTab(message: Message) {
  const tabId = await getTabId()
  console.log('sendMessageToTab', tabId, message)
  await chrome.tabs.sendMessage(tabId, message)
}

export async function sendMessageToRuntime(message: Message) {
  console.log('sendMessageToRuntime', message)
  await chrome.runtime.sendMessage(message)
}

export async function removeStorageValue(key: string) {
  console.log('removeStorageValue', key)
  await chrome.storage.sync.remove(key)
}

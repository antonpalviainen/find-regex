import Highlighter from './highlighter'
import { type Message } from './utils'

const instances: Highlighter[] = [new Highlighter()]

chrome.runtime.onMessage.addListener(async (message: Message) => {
  console.log('content.tsx: onMessage:', message)

  switch (message.type) {
    case 'init':
      if (message.instanceId === Highlighter.count + 1) {
        const highlighter = new Highlighter()
        instances.push(highlighter)
      }
      return
  }

  const instance = instances.find(
    (instance) => instance.id === message.instanceId
  )
  if (!instance) {
    console.error('content.tsx: instance not found:', message.instanceId)
    return
  }

  switch (message.type) {
    case 'color':
      instance.upsertStyle(message.backgroundColor, message.color)
      break
    case 'query':
      instance.start(message.query)
      break
    case 'remove':
      instance.destroy()
      instances.splice(instances.indexOf(instance), 1)
      break

    case 'error':
      console.error('content.tsx: error:', message.message)
      break
    default:
      console.error('content.tsx: unknown message type', message)
      break
  }
})

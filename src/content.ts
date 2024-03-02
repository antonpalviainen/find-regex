import { Highlighter } from './Highlighter'
import { sendMessageToRuntime, type Message } from './utils'

const instances: Highlighter[] = [new Highlighter()]

chrome.runtime.onMessage.addListener(async (message: Message) => {
  console.log('content.tsx: onMessage:', message)

  switch (message.type) {
    case 'color':
      instances[message.instanceId].upsertStyle(
        message.backgroundColor ?? instances[message.instanceId].initColor,
        message.color ?? 'black'
      )
      break
    case 'init':
      // console.log('content.tsx: init:', message.instanceId, Highlighter.count)
      if (message.instanceId === Highlighter.count) {
        const highlighter = new Highlighter()
        console.log('content.tsx: new highlight instantiated', highlighter.id)
        await sendMessageToRuntime({
          type: 'init',
          instanceId: highlighter.id,
        })
        instances.push(highlighter)
      }
      // console.log('content.tsx: instances', instances)
      break
    case 'query':
      instances[message.instanceId].start(message.query)
      break
    case 'error':
      console.error('content.tsx: error:', message.message)
      break
    default:
      console.error('content.tsx: unknown message type', message)
      break
  }
})

import { useRef, useState } from 'react'
import './App.css'
import QueryForm from './QueryForm'
import { type Message } from './utils'

function App() {
  const [queries, setQueries] = useState([1])
  const lastQueryId = useRef(1)

  chrome.runtime.onMessage.addListener((message: Message) => {
    console.log('App.tsx: onMessage:', message)
    switch (message.type) {
      case 'init':
        const newId = message.instanceId
        if (!queries.includes(newId)) {
          setQueries([...queries, newId])
        }
        break
      default:
        console.log('App.tsx: unknown message type:', message.type)
        break
    }
  })

  function handleAddQuery() {
    console.log('App.tsx: handleNewQuery')
    console.log('lastQueryId', lastQueryId)
    setQueries([...queries, ++lastQueryId.current])
    console.log('lastQueryId', lastQueryId)
  }

  function handleQueryRemove(instanceId: number) {
    setQueries(queries.filter((id) => id !== instanceId))
  }

  return (
    <div className="app">
      {queries.map((instanceId) => (
        <QueryForm
          instanceId={instanceId}
          key={instanceId}
          handleQueryRemove={() => handleQueryRemove(instanceId)}
        />
      ))}
      <button onClick={handleAddQuery} title="Add new query">
        +
      </button>
    </div>
  )
}

export default App

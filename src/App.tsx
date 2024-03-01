import { ChangeEvent, useEffect, useState } from 'react'
import './App.css'
import {
  getStorageValue,
  setStorageValue,
  sendMessageToTab,
  removeStorageValue,
} from './utils'

function App() {
  const [query, setQuery] = useState('')
  const [color, setColor] = useState('yellow')
  const [count, setCount] = useState(0)

  // Load query from storage
  useEffect(() => {
    getStorageValue('query').then((value) => {
      console.log('App.tsx: load storage', value)
      setQuery(value ?? '')
    })
  }, [])

  chrome.runtime.onMessage.addListener((message) => {
    console.log('App.tsx: onMessage:', message)
    if (message.type === 'count') {
      setCount(message.content)
    } else {
      console.log('App.tsx: unknown message type:', message.type)
    }
  })

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setQuery(query)
    await setStorageValue('query', query)
  }

  async function handleQuerySubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()

    console.log('App.tsx: handleFind', query)
    sendMessageToTab({
      type: 'query',
      content: query,
    })
  }

  async function handleRemove() {
    console.log('App.tsx: handleRemove')
    await removeStorageValue('query')
  }

  async function handleColorSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()

    await sendMessageToTab({ type: 'color', content: color })
  }

  return (
    <div className="App">
      <form>
        <input type="checkbox" name="enable-query" id="enable-query" />
        <input
          type="text"
          name="query"
          id="query-input"
          value={query}
          onChange={handleChange}
          autoComplete="off"
        />
        <button onClick={handleQuerySubmit}>Find</button>
        <span>{count}</span>
      </form>
      <form>
        <input
          type="text"
          name="color"
          id="color-input"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={handleColorSubmit}>Submit</button>
      </form>
      <div>
        <button onClick={handleRemove}>Remove</button>
      </div>
    </div>
  )
}

export default App

import { useEffect, useState } from 'react'
import './App.css'
import { getStorageValue, setStorageValue, sendMessageToTab } from './utils'

function QueryForm({ instanceId }: { instanceId: number }) {
  const [query, setQuery] = useState('')
  const [color, setColor] = useState('#ffff00')
  const [isChecked, setIsChecked] = useState(true)
  // const [matchCount, setMatchCount] = useState(0)

  // useEffect(() => {
  //   getStorageValue('query').then((value) => {
  //     setQuery(value ?? '')
  //   })

  //   getStorageValue('color').then((value) => {
  //     setColor(value ?? '#ffff00')
  //   })
  // }, [])

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setQuery(query)
    await setStorageValue('query', query)
  }

  async function handleQuerySubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()

    console.log('App.tsx: handleFind', query)
    sendMessageToTab({
      type: 'query',
      instanceId,
      query,
    })
  }

  async function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setColor(e.target.value)
    await sendMessageToTab({
      type: 'color',
      instanceId,
      backgroundColor: color,
    })
    await setStorageValue('color', color)
  }

  async function handleRemoveQuery(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    // await sendMessageToTab({ type: 'remove', instanceId })
  }

  async function handleQueryToggle(e: React.ChangeEvent<HTMLInputElement>) {
    console.log('App.tsx: handleQueryToggle', e.target.checked)
    await sendMessageToTab({
      type: 'color',
      instanceId,
      backgroundColor: isChecked ? 'transparent' : color,
      color: isChecked ? 'unset' : 'black',
    })
    setIsChecked(!isChecked)
  }

  return (
    <form>
      <input type="checkbox" checked={isChecked} onChange={handleQueryToggle} />
      <input
        className="query-input"
        type="text"
        value={query}
        onChange={handleChange}
        autoComplete="off"
      />
      <input type="color" value={color} onChange={handleColorChange} />
      <button onClick={handleQuerySubmit}>Find</button>
      {instanceId > 0 && <button onClick={handleRemoveQuery}>x</button>}
      {/* <span>{matchCount}</span> */}
    </form>
  )
}

function App() {
  const [queryCount, setQueryCount] = useState(1)

  chrome.runtime.onMessage.addListener(async (message) => {
    console.log('App.tsx: onMessage:', message)
    switch (message.type) {
      // case 'count':
      //   setMatchCount(message.content)
      //   break
      case 'init':
        const id = message.content
        const queries = JSON.parse((await getStorageValue('queries')) ?? '[]')
        if (!queries.includes(id)) {
          queries.push(id)
          console.log('App.tsx: queries', queries)
        }
        await setStorageValue('queries', JSON.stringify(queries))
        break
      default:
        console.log('App.tsx: unknown message type:', message.type)
    }
  })

  async function handleNewQuery() {
    console.log('App.tsx: handleNewQuery')
    setQueryCount(queryCount + 1)
    await sendMessageToTab({ type: 'init', instanceId: queryCount })
  }

  return (
    <div className="App">
      {[...Array(queryCount)].map((_, i) => (
        <QueryForm instanceId={i} key={i} />
      ))}
      <button onClick={handleNewQuery}>+</button>
    </div>
  )
}

export default App

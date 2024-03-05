import { useEffect, useState } from 'react'
import {
  getStorageValue,
  setStorageValue,
  sendMessageToTab,
  useDebounce,
  removeStorageValue,
  type Message,
} from './utils'
import './QueryForm.css'

export default function QueryForm({
  instanceId,
  handleQueryRemove,
}: {
  instanceId: number
  handleQueryRemove(): void
}) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [color, setColor] = useState('#ffff00')
  const [checked, setChecked] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [ignoreCase, setIgnoreCase] = useState(true)
  const [isUsingRegex, setIsUsingRegex] = useState(true)
  const [matchCount, setMatchCount] = useState(0)

  useEffect(() => {
    console.log('QueryForm.tsx: useEffect')

    sendMessageToTab({ type: 'init', instanceId }).then()

    getStorageValue(`query-${instanceId}`).then((value) => {
      setQuery(value ?? '')
    })

    getStorageValue(`color-${instanceId}`).then((value) => {
      setColor(value ?? '#ffff00')
    })
  }, [])

  chrome.runtime.onMessage.addListener(async (message: Message) => {
    console.log('QueryForm.tsx: onMessage:', message)
    if (message.instanceId !== instanceId) return
    setError('')
    switch (message.type) {
      case 'count':
        setMatchCount(message.count)
        break
      case 'error':
        setError(message.message)
        break
    }
  })

  const debouncedSetStorageQuery = useDebounce(() => {
    setStorageValue(`query-${instanceId}`, query)
  })

  const debouncedSetStorageColor = useDebounce(() => {
    setStorageValue(`color-${instanceId}`, color)
  })

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setQuery(query)
    debouncedSetStorageQuery()
  }

  async function handleQuerySubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    await sendMessageToTab({
      type: 'query',
      instanceId,
      query,
    })
  }

  async function handleQueryToggle() {
    await sendMessageToTab({
      type: 'color',
      instanceId,
      backgroundColor: checked ? 'transparent' : color,
      color: checked ? 'unset' : 'black',
    })
    setChecked(!checked)
  }

  async function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setColor(e.target.value)
    await sendMessageToTab({
      type: 'color',
      instanceId,
      backgroundColor: color,
    })
    debouncedSetStorageColor()
  }

  function handleExpandOptions(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    setExpanded(!expanded)
  }

  async function handleIsUsingRegexToggle() {
    setIsUsingRegex(!isUsingRegex)
    await sendMessageToTab({
      type: 'option',
      instanceId,
      option: 'isUsingRegex',
      value: !isUsingRegex,
    })
  }

  async function handleIgnoreCaseToggle() {
    setIgnoreCase(!ignoreCase)
    await sendMessageToTab({
      type: 'option',
      instanceId,
      option: 'ignoreCase',
      value: !ignoreCase,
    })
  }

  async function onQueryRemove(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    handleQueryRemove()
    await sendMessageToTab({ type: 'remove', instanceId })
    await removeStorageValue(`query-${instanceId}`)
    await removeStorageValue(`color-${instanceId}`)
  }

  return (
    <div className="query">
      <form className="main-settings">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleQueryToggle}
          title="Enable/disable highlighting"
        />
        <input
          className="query-input"
          type="text"
          value={query}
          onChange={handleQueryChange}
          autoComplete="off"
          title="Regular expression to highlight"
        />
        <input
          type="color"
          value={color}
          onChange={handleColorChange}
          title="Change highlight color"
        />
        <button onClick={handleQuerySubmit} title="Highlight">
          Find
        </button>
        <span className="match-count">{matchCount}</span>
        <button onClick={handleExpandOptions}>{expanded ? '⯅' : '⯆'}</button>
      </form>
      {expanded && (
        <form className="additional-settings">
          <label>
            <input
              type="checkbox"
              checked={isUsingRegex}
              onChange={handleIsUsingRegexToggle}
            />{' '}
            Regex
          </label>
          <label>
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={handleIgnoreCaseToggle}
            />{' '}
            Ignore case
          </label>
          <input
            type="color"
            value="black"
            title="Change highlight text color"
          />
          <button
            onClick={onQueryRemove}
            disabled={instanceId === 0}
            title="Remove query"
            className="remove-button"
          >
            Remove
          </button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  )
}

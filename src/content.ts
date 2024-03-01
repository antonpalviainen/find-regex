import { sendMessageToRuntime } from './utils'

const HIGHLIGHT_CLASS = 'find-regex-highlight'
const STYLE_ID = 'find-regex-highlight-css'

function injectCss() {
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.innerHTML = `
    .${HIGHLIGHT_CLASS} {
      background-color: yellow;
      color: black;
    }
  `
  document.head.append(style)
}

function replaceCss(backgroundColor: string) {
  if (!CSS.supports('color', backgroundColor)) {
    console.error('replaceCss: invalid color:', backgroundColor)
    return
  }

  const style = document.getElementById(STYLE_ID)
  if (style) {
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        background-color: ${backgroundColor};
        color: black;
      }
    `
  }
}

interface MatchType {
  index: number
  value: string
}

function addHighlightClass(node: Node, query: RegExp) {
  const text = node.nodeValue
  if (!text) return 0

  const matches: MatchType[] = []

  let match: RegExpExecArray | null
  while ((match = query.exec(text))) {
    matches.push({
      index: match.index,
      value: match[0],
    })
  }

  node.nodeValue = text.substring(0, matches[0]?.index)

  let prevNode = null
  for (let i = 0; i < matches.length; i++) {
    let match = matches[i]

    let span = document.createElement('span')
    span.innerHTML = match?.value ?? ''
    span.classList.add(HIGHLIGHT_CLASS)

    node.parentNode?.insertBefore(
      span,
      prevNode ? prevNode.nextSibling : node.nextSibling
    )

    let nextIndex = i === matches.length - 1 ? undefined : matches[i + 1]?.index

    let afterText = text.substring(
      (match?.index ?? 0) + (match?.value?.length ?? 0),
      nextIndex
    )

    if (afterText) {
      let afterNode = document.createTextNode(afterText)
      node.parentNode?.insertBefore(afterNode, span.nextElementSibling)
      prevNode = afterNode
    } else {
      prevNode = span
    }
  }

  return matches.length
}

function walkNodes(root: Node, query: RegExp) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    (node) => {
      return !node.parentElement?.classList.contains(HIGHLIGHT_CLASS) &&
        node.nodeValue?.match(query)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
    }
  )

  let count = 0

  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode
    count += addHighlightClass(node, query)
  }

  return count
}

let observer: MutationObserver | null = null

async function highlight(query: string) {
  if (observer) {
    observer.disconnect()
  }

  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.outerHTML = el.innerHTML
  })

  const regexp = new RegExp(query, 'gi')

  let count = walkNodes(document.body, regexp)
  await sendMessageToRuntime({ type: 'count', content: count })

  observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      mutation.addedNodes.forEach(async (node) => {
        count += walkNodes(node, regexp)
        await sendMessageToRuntime({ type: 'count', content: count })
      })
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

injectCss()

chrome.runtime.onMessage.addListener((message) => {
  console.log('content.tsx: onMessage:', message)

  switch (message.type) {
    case 'query':
      highlight(message.content)
      break
    case 'color':
      replaceCss(message.content)
      break
    default:
      console.error('content.tsx: unknown message type', message)
      break
  }
})

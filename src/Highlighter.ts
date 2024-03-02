import { sendMessageToRuntime } from './utils'

export interface MatchType {
  index: number
  value: string
}

export class Highlighter {
  id: number
  initColor: string
  private css: string
  private styleClass: string
  private observer: MutationObserver | null = null
  private styleElement: HTMLStyleElement | null = null

  static count = 0

  constructor() {
    this.id = ++Highlighter.count
    this.styleClass = `find-regex-highlight-${this.id}`
    this.css = `.${this.styleClass} { background-color: BACKGROUND_COLOR; color: FOREGROUND_COLOR; }`
    this.initColor = '#ffff00'
    this.upsertStyle(this.initColor, 'black')
  }

  upsertStyle(backgroundColor: string, color: string) {
    const css = this.css
      .replace('BACKGROUND_COLOR', backgroundColor)
      .replace('FOREGROUND_COLOR', color)
    if (this.styleElement) {
      this.styleElement.textContent = css
    } else {
      const style = document.createElement('style')
      style.textContent = css
      document.head.append(style)
      this.styleElement = style
    }
  }

  async start(query: string) {
    if (this.observer) {
      this.observer.disconnect()
    }

    this.removeHighlight()

    const regexp = this.createRegexp(query)
    if (!regexp) return

    let count = this.walkNodes(document.body, regexp)
    await sendMessageToRuntime({
      type: 'count',
      instanceId: this.id,
      count: count,
    })

    this.observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        mutation.addedNodes.forEach(async (node) => {
          count += this.walkNodes(node, regexp)
          await sendMessageToRuntime({
            type: 'count',
            instanceId: this.id,
            count: count,
          })
        })
      }
    })

    this.observer.observe(document.body, { childList: true, subtree: true })
  }

  private createRegexp(query: string) {
    try {
      return new RegExp(query, 'gi')
    } catch (error) {
      console.error('invalid pattern:', query, error)
      return null
    }
  }

  private walkNodes(root: Node, query: RegExp) {
    const treeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      (node) => {
        return !node.parentElement?.classList.contains(this.styleClass) &&
          node.nodeValue?.match(query)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP
      }
    )

    let count = 0

    while (treeWalker.nextNode()) {
      const node = treeWalker.currentNode
      count += this.addHighlightClass(node, query)
    }

    return count
  }

  private addHighlightClass(node: Node, query: RegExp) {
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
      span.classList.add(this.styleClass)

      node.parentNode?.insertBefore(
        span,
        prevNode ? prevNode.nextSibling : node.nextSibling
      )

      let nextIndex =
        i === matches.length - 1 ? undefined : matches[i + 1]?.index

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

  private removeHighlight() {
    document.querySelectorAll(`.${this.styleClass}`).forEach((el) => {
      el.outerHTML = el.innerHTML
    })
  }
}

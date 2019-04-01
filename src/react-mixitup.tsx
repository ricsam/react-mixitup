/**
 * @class ReactMixitup
 */

import React, { ReactHTMLElement } from 'react'
import uniq from 'lodash.uniq'

type Position = {
  x: number
  y: number
  z?: number
}
type Positions = {
  [key: string]: Position
}
type State = {
  hash: null | string
  mount: boolean
  commit: boolean
  animate: boolean
  firstRender: boolean
}

type UnparsedItems = Array<string | number | boolean>
type Item = string
type Items = Array<Item>

type WrapperProps = {
  children: React.ReactNode
  style?: React.CSSProperties
  ref?: React.Ref<any>
}

type WrapperType = any

type Props = {
  items: UnparsedItems
  duration: number
  renderCells: (
    items: {
      key: string
      ref?: React.Ref<HTMLElement>
      style?: React.CSSProperties
    }[]
  ) => React.ReactNode
  Wrapper: WrapperType
  transition: boolean
}

type Action = {
  type: 'SET_HASH' | 'STOP_ANIMATION' | 'ANIMATE' | 'COMMIT'
  hash?: string | null
  key?: string
  el?: HTMLElement | null
  transition?: boolean
}

const OuterBound = React.memo(
  React.forwardRef((props: { children: React.ReactNode }, ref?: React.Ref<any>) => (
    <div style={{ position: 'relative' }} {...props} ref={ref} />
  ))
)

const AbsoluteWrapper = React.memo(
  React.forwardRef((props: { children: React.ReactNode }, ref?: React.Ref<any>) => (
    <div
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        visibility: 'hidden',
        zIndex: -1
      }}
      {...props}
      ref={ref}
    />
  ))
)

function init(): State {
  return {
    hash: null,
    mount: false,
    commit: false,
    animate: false,
    firstRender: true
  }
}

const getItemsHash = (items: Items): string => {
  return items.join(',')
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_HASH':
      if (typeof action.hash === 'undefined') {
        throw new Error()
      }
      let mount = true
      if (state.firstRender || state.animate || state.mount || state.commit || !action.transition) {
        mount = false
      }
      return {
        ...state,
        hash: action.hash,
        firstRender: false,
        mount
      }
    case 'COMMIT':
      return {
        ...state,
        commit: true,
        mount: false
      }
    case 'ANIMATE':
      return {
        ...state,
        animate: true,
        commit: false
      }
    case 'STOP_ANIMATION':
      return {
        ...state,
        animate: false,
        mount: false
      }
    default:
      throw new Error()
  }
}

const getConfig = ({ currentItems, nextItems }: { currentItems: Items; nextItems: Items }) => {
  const addedItems = nextItems.filter(currentKey => {
    return !currentItems.includes(currentKey)
  })
  const removedItems = currentItems.filter(previousKey => {
    return !nextItems.includes(previousKey)
  })

  const shuffledItems = nextItems.filter((currentKey, index) => {
    return (
      !addedItems.includes(currentKey) &&
      !removedItems.includes(currentKey) &&
      index !== currentItems.indexOf(currentKey)
    )
  })

  return {
    addedItems,
    removedItems,
    shuffledItems
  }
}

function onNextFrame(callback: () => any) {
  setTimeout(function() {
    window.requestAnimationFrame(callback)
  }, 0)
}

const makeWrapper = (ReactMixitupWrapper: WrapperType) => {
  return React.forwardRef((props: WrapperProps, ref) => (
    <ReactMixitupWrapper {...props} ref={ref} />
  ))
}

const ReactMixitup = ({
  items: unparsedItems,
  duration = 500,
  renderCells,
  Wrapper: ReactMixitupWrapper = 'div',
  transition = true
}: Props) => {
  const Wrapper = React.useMemo(() => makeWrapper(ReactMixitupWrapper), [ReactMixitupWrapper])

  const items: Items = unparsedItems.map(key => key.toString())
  const [{ hash, animate, mount, commit }, dispatch] = React.useReducer(reducer, items, init)
  const refs = React.useRef<{
    containerHeight: {
      current: number | null
      previous: number | null
    }
    previousPositions: Positions
    currentPositions: Positions
    currentItems: Items
    previousItems: Items
    config: {
      addedItems: Items
      removedItems: Items
      shuffledItems: Items
    }
    persistedElement: React.ReactNode
  }>({
    containerHeight: { current: null, previous: null },
    previousPositions: {},
    currentPositions: {},
    currentItems: items,
    previousItems: [],
    config: {
      addedItems: [],
      removedItems: [],
      shuffledItems: []
    },
    persistedElement: null
  })
  let newHash: string | null = getItemsHash(items)
  let newGrid = newHash !== hash
  /* just to handle if clicking really fast, then ignore the update */
  if (mount || commit) {
    newGrid = false
    newHash = hash
  }

  if (newGrid) {
    refs.current.config = getConfig({
      currentItems: refs.current.currentItems,
      nextItems: items
    })

    /* START UPDATE */
    if (!animate) {
      refs.current.previousItems = refs.current.currentItems
    }
    refs.current.currentItems = items
    /* END UPDATE */
  }

  const {
    previousPositions,
    currentPositions,
    currentItems,
    previousItems,
    config: { addedItems, removedItems, shuffledItems }
  } = refs.current

  React.useEffect(() => {
    if (newGrid) {
      dispatch({
        type: 'SET_HASH',
        hash: newHash,
        transition
      })
    }
  }, [newHash, newGrid, transition])

  React.useEffect(() => {
    if (mount) {
      /* make sure the mount has been committed to the DOM, double make sure by wrapping in onNextFrame */
      onNextFrame(() => {
        dispatch({
          type: 'COMMIT'
        })
      })
    }
  }, [mount])

  React.useEffect(() => {
    if (commit) {
      onNextFrame(() => {
        dispatch({
          type: 'ANIMATE'
        })
      })
    }
  }, [commit])

  React.useEffect(() => {
    let timer: number
    let unmounted = false
    const clear = () => {
      unmounted = true
      window.clearTimeout(timer)
    }
    if (animate) {
      timer = window.setTimeout(() => {
        if (unmounted) {
          return
        }
        dispatch({
          type: 'STOP_ANIMATION'
        })
      }, duration)
    } else {
      clear()
    }
    return clear
  }, [animate, newHash])

  if (commit) {
    return refs.current.persistedElement
  }

  const rows = ({
    itemsToRender,
    ref,
    style
  }: {
    itemsToRender: Items
    ref?: (key: string, el: HTMLElement) => void
    style?: (key: string) => React.CSSProperties
  }) => {
    const makeRef = (key: string) => {
      if (typeof ref === 'undefined') {
        return
      }
      return (el: HTMLElement | null) => {
        if (el) {
          ref(key, el)
        }
      }
    }

    const makeStyle = (key: string) => {
      return typeof style !== 'undefined' ? style(key) : undefined
    }

    return renderCells(
      itemsToRender.map(key => ({
        key,
        ref: makeRef(key),
        style: makeStyle(key)
      }))
    )
  }
  const wrapperMeasureContainerHeight = (context: 'previous' | 'current') => (
    el: HTMLElement | null
  ) => {
    if (!el) {
      return
    }
    refs.current.containerHeight[context] = el.offsetHeight
  }

  const measureNewGrid = newGrid ? (
    <AbsoluteWrapper ref={wrapperMeasureContainerHeight('current')}>
      {rows({
        itemsToRender: currentItems,
        ref: (key, el) => {
          currentPositions[key] = {
            x: el.offsetLeft,
            y: el.offsetTop
          }
        }
      })}
    </AbsoluteWrapper>
  ) : null

  if (!transition) {
    return (
      <OuterBound>
        <Wrapper>
          {rows({
            itemsToRender: currentItems
          })}
        </Wrapper>
      </OuterBound>
    )
  }

  let child = (
    <>
      <Wrapper>
        {rows({
          itemsToRender: currentItems
        })}
      </Wrapper>
      {measureNewGrid}
    </>
  )

  if (newGrid) {
    child = (
      <>
        <Wrapper ref={wrapperMeasureContainerHeight('previous')}>
          {rows({
            itemsToRender: previousItems,
            ref: (key, el) => {
              if (el) {
                previousPositions[key] = {
                  x: el.offsetLeft,
                  y: el.offsetTop
                }
              }
            }
          })}
        </Wrapper>
        {measureNewGrid}
      </>
    )
  }

  const animationRenderItems = uniq([...previousItems, ...addedItems, ...removedItems]).sort()

  if (mount) {
    child = (
      <>
        <Wrapper style={{ height: refs.current.containerHeight.previous + 'px' }}>
          {rows({
            itemsToRender: animationRenderItems,
            style(key) {
              const added = addedItems.includes(key)
              const removed = removedItems.includes(key)
              const { x, y } = added ? currentPositions[key] : previousPositions[key]

              let z = 1

              if (added) {
                z = 0
              }

              if (removed) {
                z = 1
              }

              const transform = `translate3d(${[x, y, 0].join('px,')}px) scale(${z})`

              const style: React.CSSProperties = {
                transform,
                position: 'absolute',
                top: 0,
                left: 0,
                margin: 0
              }

              return style
            }
          })}
        </Wrapper>
      </>
    )
  }

  if (animate) {
    child = (
      <>
        <Wrapper style={{ height: refs.current.containerHeight.current + 'px' }}>
          {rows({
            itemsToRender: animationRenderItems,
            style(key) {
              const added = addedItems.includes(key)
              const removed = removedItems.includes(key)
              /* currentPositions[key] can be undefined if new items are
                 added during animate and are yet to be measured */
              const { x = 0, y = 0 } = currentPositions[key] || {}

              let z = 1

              if (added) {
                z = 1
              }

              if (removed) {
                z = 0
              }

              const transform = `translate3d(${[x, y, 0].join('px,')}px) scale(${z})`

              const style: React.CSSProperties = {
                transform,
                position: 'absolute',
                top: 0,
                left: 0,
                margin: 0,
                transition: `transform ${duration}ms ease`
              }
              return style
            }
          })}
        </Wrapper>
        {measureNewGrid}
      </>
    )
  }

  refs.current.persistedElement = <OuterBound>{child}</OuterBound>

  return refs.current.persistedElement
}

export default ReactMixitup

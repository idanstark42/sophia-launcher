import React, { useEffect, useState } from 'react'
import { View, Dimensions, PanResponder, ImageBackground } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import touchpadBackground from '@/assets/images/touchpad-background.png'

const { width, height } = Dimensions.get('window')

const STROKE_WIDTH = 30
const POINT_COLOR_COOLDOWN = 250
const RERENDER_TIMEOUT = 10
const MOUSE_UP_DELAY = 1000
const START_COLOR = { r: 255, g: 255, b: 255 }
const END_COLOR = { r: 0, g: 0, b: 100 }

const TouchPad = () => {
  // paths is a list of points, each poin is an x and y coordinate
  const [paths, setPaths] = useState<{ x: number, y: number, timestamp: number }[][]>([])
  const [currentPaths, setCurrentPaths] = useState<{ id: string, points: { x: number, y: number, timestamp: number }[] }[]>([])
  const [flushTimeout, setFlushTimeout] = useState<NodeJS.Timeout | null>(null)
  const [rerenderCount, setRerenderCount] = useState(0)

  const rerender = () => {
    setRerenderCount((prevCount: number) => prevCount + 1)

    const points = paths.flat().concat(currentPaths.map(({ points }) => points).flat())
    const shouldRerender = points.some(point => Date.now() - point.timestamp < POINT_COLOR_COOLDOWN)

    if (shouldRerender) setTimeout(rerender, RERENDER_TIMEOUT)
  }

  const clearFlushTimeout = () => {
    if (flushTimeout) {
      clearTimeout(flushTimeout)
      setFlushTimeout(null)
    }
  }

  const flush = () => {
    setPaths([])
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: event => {
      if (!event.nativeEvent) return
      const touches = event.nativeEvent.touches
      setCurrentPaths((prevPaths) => touches.map(({ identifier, locationX, locationY }) => {
        const path = prevPaths.find(path => path.id === identifier)
        if (!path) return { id: identifier, points: [{ x: locationX, y: locationY, timestamp: Date.now() }] }
        return { id: identifier, points: [...path.points, { x: locationX, y: locationY, timestamp: Date.now() }] }
      }))
      clearFlushTimeout()
    },
    onPanResponderRelease: () => {
      setPaths((prevPaths) => [...prevPaths, ...(currentPaths.map(path => path.points))])
      setCurrentPaths([])
      clearFlushTimeout()
      setFlushTimeout(setTimeout(flush, MOUSE_UP_DELAY))
      setTimeout(rerender, RERENDER_TIMEOUT)
    },
  })

  const pathFromPoints = (points: { x: number, y: number }[]) => {
    if (points.length === 0) return ''
    return points.reduce((acc, { x, y }, index) => {
      if (index === 0) return `M ${x} ${y}`
      return `${acc} L ${x} ${y}`
    }, '')
  }

  const getGradientColor = (timeDiff: number) => {
    if (timeDiff >= POINT_COLOR_COOLDOWN) return `rgba(${END_COLOR.r}, ${END_COLOR.g}, ${END_COLOR.b}, 1)`
  
    const fraction = timeDiff / POINT_COLOR_COOLDOWN
    const r = Math.floor(START_COLOR.r + (END_COLOR.r - START_COLOR.r) * fraction)
    const g = Math.floor(START_COLOR.g + (END_COLOR.g - START_COLOR.g) * fraction)
    const b = Math.floor(START_COLOR.b + (END_COLOR.b - START_COLOR.b) * fraction)
    return `rgba(${r}, ${g}, ${b}, 1)`
  }

  return (
    <ImageBackground source={touchpadBackground} style={{ flex: 1, backgroundColor: 'black' }} resizeMode='cover'>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} {...panResponder.panHandlers}>
        <Svg height={height} width={width}>
          {[...paths, ...(currentPaths.map(({ points }) => points))].map(points => points.length < 2 ? null : points.map((point, index) => {
              if (index === 0) return null
              return (
                <Path
                  key={index}
                  d={`M ${points[index - 1].x} ${points[index - 1].y} L ${point.x} ${point.y}`}
                  stroke={getGradientColor(Date.now() - points[index].timestamp)}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeLinecap="round"
                />
              )
            }))}
        </Svg>
      </View>
    </ImageBackground>
  )
}

export default TouchPad

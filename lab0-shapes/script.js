const getInitialState = () => ({
  canvas: null,
  context: null,

  shapePoints: [],
  transitionPoints: [],

  shapeAngle: 0,
  transition: 0,
  transitionCursor: 0,
  transitionShapeAngle: 0,

  frameRequest: undefined,

  isDragging: false,
  draggingPoint: null,
})

const state = getInitialState()

const POINT_SIZE = 16

function createPoint(x, y) {
  state.shapePoints.push({ x, y })
}

function createTransformPoint(x, y) {
  state.transitionPoints.push({ x, y })
}

const drawPoints = (container, color = 'green') => {
  container.forEach(({ x, y }) => {
    state.context.fillStyle = color
    state.context.fillRect(x - POINT_SIZE / 2, y - POINT_SIZE / 2, POINT_SIZE, POINT_SIZE)
  })
}

const handleCreateShapePoint = ({ clientX, clientY }) => {
  createPoint(clientX, clientY)
}

const handleCreateTransformPoint = (e) => {
  e.preventDefault()
  const { clientX, clientY } = e
  createTransformPoint(clientX, clientY)
}

const drawShapes = (e) => {
  stopDrawPoints()
  e?.stopPropagation();
  const { context, shapePoints, transitionPoints } = state
  const toDraw = [shapePoints, transitionPoints]
  toDraw.forEach((container) => {
    drawLines(container)
  })
}

const drawLines = (container) => {
  const { context } = state

  for (let i = 0; i < container.length; i++) {
    const currPoint = container[i]
    const nextPoint = container[(i + 1) % container.length]
    context.beginPath()
    context.moveTo(currPoint.x, currPoint.y)
    context.lineTo(nextPoint.x, nextPoint.y)
    context.stroke()
  }
}

const getCoordsSummary = (container) => {
  return container.reduce(
    (res, curr) => {
      res.sumX += curr.x
      res.sumY += curr.y
      return res
    },
    { sumX: 0, sumY: 0 }
  )
}

const getShapeCenter = (container) => {
  const { sumX, sumY } = getCoordsSummary(container)
  const dx = sumX / container.length
  const dy = sumY / container.length
  return { dx, dy }
}

const moveTransitionShape = () => {
  const { shapePoints, transitionShapeAngle, transitionPoints } = state

  const { dx, dy } = getShapeCenter(transitionPoints)

  const angleX = Math.cos((Math.PI / 180) * transitionShapeAngle)
  const angleY = Math.sin((Math.PI / 180) * transitionShapeAngle)

  state.transitionPoints = state.transitionPoints.map(({ x, y }, index) => ({
    x: dx + (x - dx) * angleX - (y - dy) * angleY,
    y: dy + (x - dx) * angleY + (y - dy) * angleX,
  }))
}

const moveShape = () => {
  const { shapePoints, shapeAngle, transitionPoints, transitionCursor, transition, context } = state

  const { dx, dy } = getShapeCenter(shapePoints)

  const isLastTransition = transitionCursor === transitionPoints.length - 1

  const start = transitionPoints[transitionCursor]
  const dest = transitionPoints[!isLastTransition ? transitionCursor + 1 : 0]

  const transitionPoint = {
    x: (1 - transition) * start.x + transition * dest.x,
    y: (1 - transition) * start.y + transition * dest.y,
  }

  const angleX = Math.cos((Math.PI / 180) * shapeAngle)
  const angleY = Math.sin((Math.PI / 180) * shapeAngle)

  state.shapePoints = state.shapePoints.map(({ x, y }) => ({
    x: transitionPoint.x + (x - dx) * angleX - (y - dy) * angleY,
    y: transitionPoint.y + (x - dx) * angleY + (y - dy) * angleX,
  }))

  state.transition += 0.01
  if (state.transition > 1) state.transition = 0

  const overlapThresholdPxls = 10
  const distanceX = Math.abs(parseInt(transitionPoint.x - dest.x))
  const distanceY = Math.abs(parseInt(transitionPoint.y - dest.y))

  if (distanceX < overlapThresholdPxls && distanceY < overlapThresholdPxls) {
    state.transitionCursor = !isLastTransition ? state.transitionCursor + 1 : 0
    state.transition = 0
  }

  drawLines(state.shapePoints)
}

const clearCanvas = () => {
  state.context.clearRect(0, 0, state.canvas.width, state.canvas.height)
}

const transition = (e) => {
  clearCanvas()
  drawLines(state.transitionPoints)
  moveShape()
  moveTransitionShape()
  state.frameRequest = requestAnimationFrame(transition)
}

const startTransition = () => {
  state.frameRequest = requestAnimationFrame(transition)
}

const drawPointsFrame = (e) => {
  clearCanvas()
  drawPoints(state.shapePoints)
  drawPoints(state.transitionPoints, 'blue')
  state.frameRequest = requestAnimationFrame(drawPointsFrame)
}

const startDrawPoints = () => {
  if (!state.frameRequest) state.frameRequest = requestAnimationFrame(drawPointsFrame)
}

const stopDrawPoints = () => {
  window.cancelAnimationFrame(state.frameRequest)
  state.frameRequest = null
}

const resetState = () => {
  clearCanvas()
  const resettedState = getInitialState()
  Object.keys(resettedState).forEach((property) => {
    state[property] = resettedState[property]
  })
  reinit()
  window.cancelAnimationFrame(state.frameRequest)
  state.frameRequest = null
}

const handleShapeAngleChange = (e) => {
  const { value } = e.target
  state.shapeAngle = +value
}

const handleTransitionShapeAngleChange = (e) => {
  const { value } = e.target
  state.transitionShapeAngle = +value
}

const reinit = () => {
  const canvas = document.getElementById('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  state.canvas = canvas

  const ctx = canvas.getContext('2d')
  state.context = ctx
}

const getPointByMousePos = (mousePosX, mousePosY, container) => {
  return container.find(
    (point) =>
      mousePosX - POINT_SIZE / 2 < point.x &&
      point.x < mousePosX + POINT_SIZE / 2 &&
      mousePosY - POINT_SIZE / 2 < point.y &&
      point.y < mousePosY + POINT_SIZE / 2
  )
}

const handleDragStart = (e) => {
  startDrawPoints()

  const { clientX, clientY } = e
  const { shapePoints, transitionPoints } = state
  const isLeftClick = (e || window.event).which === 1

  let point = getPointByMousePos(clientX, clientY, shapePoints)
  if (!point) point = getPointByMousePos(clientX, clientY, transitionPoints)
  if (!point && isLeftClick) return handleCreateShapePoint(e)

  state.isDragging = true
  state.draggingPoint = point
}

const handleDragEnd = () => {
  state.isDragging = false
}

const handleDragMove = (e) => {
  if (!state.isDragging || !state.draggingPoint) return
  state.draggingPoint.x = e.clientX
  state.draggingPoint.y = e.clientY
}

window.onload = () => {
  reinit()

  canvas.addEventListener('mousedown', handleDragStart)
  canvas.addEventListener('contextmenu', handleCreateTransformPoint)
  canvas.addEventListener('mouseup', handleDragEnd)
  canvas.addEventListener('mousemove', handleDragMove)

  document.getElementById('draw_shapes').addEventListener('click', drawShapes)
  document.getElementById('start_transition').addEventListener('click', startTransition)
  document.getElementById('reset_state').addEventListener('click', resetState)
  document.getElementById('shape_angle').addEventListener('change', handleShapeAngleChange)
  document.getElementById('transition_shape_angle').addEventListener('change', handleTransitionShapeAngleChange)
}

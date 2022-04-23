const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')

const ShapeTypes = Object.freeze({
  circle: 'circle',
  rectangle: 'rectangle',
  triangle: 'triangle',
  shape: 'shape',
})

let isDragging = null
let isDragStarted = false

const shape = { ref: null, type: null }
const mousePosition = { x: 0, y: 0 }

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const width = window.innerWidth
const height = window.innerHeight


const wCenter = width / 2
const hCenter = height / 2

const calculateCircleArea = () => {
  const shapeInfo = shape.ref
  const R = shapeInfo.vertex[0].y - shapeInfo.center.y
  alert((2 * Math.PI * R) / Math.sqrt(Math.PI * R * R))
}

const calculateRectArea = () => {
  const shapeInfo = shape.ref
  const a = shapeInfo.vertex[0].y - shapeInfo.center.y
  alert((4 * a) / Math.sqrt(a * a))
}

const calculateTriangleArea = () => {
  const shapeInfo = shape.ref
  const a = shapeInfo.vertex[0].y - shapeInfo.center.y
  const S = (1 / 2) * a * (a + (3 / 2) * a)
  alert((2 * S) / (a / 2) / Math.sqrt(S))
}

const calculateFreeArea = () => {
  const shapeInfo = shape.ref
  let P = 0
  for (let i = 0; i < shapeInfo.vertex.length; i++) {
    const currPoint = shapeInfo.vertex[i]
    const nextPoint = shapeInfo.vertex[i + 1 > shapeInfo.vertex.length - 1 ? 0 : i + 1]
    P += Math.sqrt((currPoint.x - nextPoint.x) ** 2 + (currPoint.y - nextPoint.y) ** 2)
  }
  let S = 0
  for (let i = 0; i < shapeInfo.vertex.length - 1; i++) {
    S += shapeInfo.vertex[i].x * shapeInfo.vertex[i + 1].y
  }
  S += shapeInfo.vertex[shapeInfo.vertex.length - 1].x * shapeInfo.vertex[0].y
  for (let i = 0; i < shapeInfo.vertex.length - 1; i++) {
    S -= shapeInfo.vertex[i + 1].x * shapeInfo.vertex[i].y
  }
  S -= shapeInfo.vertex[0].x * shapeInfo.vertex[shapeInfo.vertex.length - 1].y
  S *= 1 / 2
  alert(P / Math.sqrt(Math.abs(S)))
}

const shapeArea = {
  circle: calculateCircleArea,
  rectangle: calculateRectArea,
  triangle: calculateTriangleArea,
  shape: calculateFreeArea,
}

document.querySelector('#evaluate').addEventListener('click', () => {
  shapeArea[shape.ref.shape]()
})

canvas.addEventListener('mousemove', (e) => {
  mousePosition.x = e.clientX
  mousePosition.y = e.clientY
})

startDragListeners = () => {
  window.addEventListener('mousedown', (e) => {
    window.checkForDrag = e.clientX
    isDragStarted = true
  })

  canvas.addEventListener('mouseup', (e) => {
    const shapeSelect = document.querySelector('#shape-type:checked')

    const mouseUp = e.clientX
    const isOffset = mouseUp < window.checkForDrag + 5 && mouseUp > window.checkForDrag - 5

    isDragStarted = false
    isDragging = null

    if (isOffset && e.button === 0) {
      const xCoord = e.clientX
      const yCoord = e.clientY

      const genericShapeProperties = {
        center: { x: xCoord, y: yCoord },
        shape: shapeSelect.value,
      }

      if (shapeSelect.value !== ShapeTypes.shape && !shape.ref) {
        shape.ref = { ...genericShapeProperties, vertex: [] }
      } else {
        if (!shape.ref) {
          shape.ref = {
            ...genericShapeProperties,
            vertex: [{ x: xCoord, y: yCoord }],
          }
        } else {
          shape.ref.vertex.push({ x: xCoord, y: yCoord })
        }
      }
    }
  })
}

const linkPoints = (points) => {
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const nextIndex = i === points.length - 1 ? 0 : i + 1
    const nextPoint = points[nextIndex]
    context.beginPath()
    context.moveTo(point.x, point.y)
    context.lineTo(nextPoint.x, nextPoint.y)
    context.stroke()
  }
}

const createPoint = (pointX, pointY, color) => {
  context.beginPath()
  context.fillStyle = color
  const pWidth = 10
  const pHeight = 10
  context.fillRect(pointX - pWidth / 2, pointY - pHeight / 2, pWidth, pHeight)
  context.fill()
}

const checkNearPoint = (points) => {
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const r = 10
    const circle = new Path2D()
    circle.arc(point.x - r / 2, point.y - r / 2, r, 0, 2 * Math.PI)
    if (context.isPointInPath(circle, mousePosition.x, mousePosition.y)) {
      if (isDragStarted) {
        points[i].y = mousePosition.y
        isDragging = i
      }
    }
    if (isDragging === i) {
      points[i].y = mousePosition.y
    }
  }
}

const drawCircle = (center, vertex) => {
  if (vertex.length < 1) vertex.push({ x: center.x, y: center.y + 50 })
  context.beginPath()
  context.arc(center.x, center.y, vertex[0].y - center.y, 0, 2 * Math.PI)
  context.stroke()
  createPoint(vertex[0].x, vertex[0].y, 'black')
}

const drawRect = (center, vertex) => {
  if (vertex.length < 1) vertex.push({ x: center.x, y: center.y + 50 })
  const a = vertex[0].y - center.y
  context.beginPath()
  context.rect(center.x - a, center.y - a, 2 * a, 2 * a)
  context.stroke()
  createPoint(vertex[0].x, vertex[0].y, 'black')
}

const drawTriangle = (center, vertex) => {
  if (vertex.length < 1) vertex.push({ x: center.x, y: center.y + 50 })
  const a = vertex[0].y - center.y
  context.beginPath()
  context.moveTo(center.x - a / 2, center.y - a / 2)
  context.lineTo(center.x + a / 2, center.y - a / 2)
  context.lineTo(center.x, center.y + a)
  context.lineTo(center.x - a / 2, center.y - a / 2)
  context.stroke()
  createPoint(vertex[0].x, vertex[0].y, 'black')
}

const drawShapes = {
  circle: drawCircle,
  rectangle: drawRect,
  triangle: drawTriangle,
}

const drawFreeShape = () => {
  const vertices = shape.ref.vertex
  vertices.forEach(vert => {
    createPoint(vert.x, vert.y, 'black')
  })
  linkPoints(vertices)
}

const renderShape = () => {
  const shapeInfo = shape.ref

  if (shapeInfo.shape !== ShapeTypes.shape) {
    createPoint(shapeInfo.center.x, shapeInfo.center.y, 'black')
    drawShapes[shapeInfo.shape](shapeInfo.center, shapeInfo.vertex)
  } else {
    drawFreeShape()
  }
}

const update = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)

  if (shape.ref) {
    renderShape()
    checkNearPoint(shape.ref.vertex)
  }

  requestAnimationFrame(update)
}

update()
startDragListeners()

const canvas = document.querySelector('canvas')

let suspended = false
const width = window.innerWidth
const height = window.innerHeight

const wCenter = width / 2
const hCenter = height / 2

const imgInput = document.querySelector('#img')
let img

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const context = canvas.getContext('2d')

canvas.style.backgroundColor = '#e7e7e7'

const generateSheet = () => {
  const sheetSize = { x: 620, y: 877 }
  const wCenter = width / 2
  const hCenter = height / 2

  context.save()
  context.beginPath()
  context.translate(wCenter, hCenter)
  context.translate(-wCenter, -hCenter)
  context.fillStyle = 'white'
  context.fillRect(wCenter - sheetSize.x / 2, hCenter - sheetSize.y / 2, sheetSize.x, sheetSize.y)
  context.fill()
  context.restore()
}

const to2DArray = (data, imageWidth) => {
  const preResult = data.reduce((acc, item, index) => {
    if (index % 4 === 0) {
      acc.push([item])
    } else {
      acc[Math.floor(index / 4)].push(item)
    }

    return acc
  }, [])

  const result = preResult.reduce((acc, item, index) => {
    if (index % imageWidth === 0) {
      acc.push([])
    } else {
      acc[Math.floor(index / imageWidth)].push(item)
    }

    return acc
  }, [])

  return result
}

const findPixelIndex = (x, y, imageWidth) => {
  return (y * imageWidth + x) * 4
}

const MAX_TRAVERSE_PIXELS = 500

const tracert = (startX, startY, pixels) => {
  let shouldTraverse = true
  let isControlPoint = false

  const shapePoints = []

  const startPos = [
    [startX, startY],
    [Math.max(0, startX - 1), startY],
  ]

  let nextPos = [
    [startX, startY],
    [Math.max(0, startX - 1), startY],
  ]

  let caretPoint = [0, 0]
  let traversedPixelsCount = 0

  while (shouldTraverse) {
    if (nextPos[0][0] === nextPos[1][0] && nextPos[0][1] === nextPos[1][1] + 1) {
      caretPoint = [nextPos[0][0] - 1, nextPos[0][1] - 1]
    } else if (nextPos[0][0] === nextPos[1][0] + 1 && nextPos[0][1] === nextPos[1][1]) {
      caretPoint = [nextPos[0][0] - 1, nextPos[0][1] + 1]
    } else if (nextPos[0][0] === nextPos[1][0] && nextPos[0][1] === nextPos[1][1] - 1) {
      caretPoint = [nextPos[0][0] + 1, nextPos[0][1] + 1]
    } else if (nextPos[0][0] === nextPos[1][0] - 1 && nextPos[0][1] === nextPos[1][1]) {
      caretPoint = [nextPos[0][0] + 1, nextPos[0][1] - 1]
    } else if (nextPos[0][0] === nextPos[1][0] - 1 && nextPos[0][1] === nextPos[1][1] + 1) {
      caretPoint = [nextPos[0][0], nextPos[0][1] - 1]
    } else if (nextPos[0][0] === nextPos[1][0] + 1 && nextPos[0][1] === nextPos[1][1] + 1) {
      caretPoint = [nextPos[0][0] - 1, nextPos[0][1]]
    } else if (nextPos[0][0] === nextPos[1][0] + 1 && nextPos[0][1] === nextPos[1][1] - 1) {
      caretPoint = [nextPos[0][0], nextPos[0][1] + 1]
    } else if (nextPos[0][0] === nextPos[1][0] - 1 && nextPos[0][1] === nextPos[1][1] - 1) {
      caretPoint = [nextPos[0][0] + 1, nextPos[0][1]]
    }

    // Если черная - собираем периметр, если нет - переставляем по ifelse
    if (pixels[caretPoint[1]][caretPoint[0]]?.[0] === 0) {
      nextPos[0] = caretPoint
      pixels[caretPoint[1]][caretPoint[0]][0] = 255
      shapePoints.push(caretPoint)
    } else {
      nextPos[1] = caretPoint
    }

    // Если дошли до основания
    if (startPos[0][0] === nextPos[0][0] && startPos[1][0] === nextPos[1][0]) {
      shouldTraverse = false
    }

    if (traversedPixelsCount++ === MAX_TRAVERSE_PIXELS) {
      shouldTraverse = false
    }
  }

  const borders = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  }

  for (let i = 0; i < shapePoints.length; i++) {
    borders.minX = Math.min(shapePoints[i][0], borders.minX)
    borders.maxX = Math.max(shapePoints[i][0], borders.maxX)
    borders.minY = Math.min(shapePoints[i][1], borders.minY)
    borders.maxY = Math.max(shapePoints[i][1], borders.maxY)
  }

  const perimeter = shapePoints.length

  let areaCounter = 0

  for (let y = borders.minY; y < borders.maxY; y++) {
    for (let x = borders.minX; x < borders.maxX; x++) {
      if (pixels[y][x][0] === 0) {
        areaCounter++
        shapePoints.push([x, y])
      }
    }
  }

  const p = perimeter / Math.sqrt(areaCounter)

  if (p > 3 && p < 5 && shapePoints.length > 100) {
    isControlPoint = true
  }

  return { shapePoints, isControlPoint }
}

const binarize = (imageData) => {
  for (let i = 0; i < imageData.data.length; i++) {
    imageData.data[i] = imageData.data[i] > 150 ? 255 : 0
  }
}

const start = () => {
  const dx = wCenter - img.width / 2
  const dy = hCenter - img.height / 2

  const imageData = context.getImageData(dx, dy, img.width, img.height)
  binarize(imageData)

  const rawPixels = imageData.data
  const pixels = to2DArray(rawPixels, img.width)

  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const pixel = findPixelIndex(x, y, img.width)
      const isBlackPixel = rawPixels[pixel] === 0

      if (isBlackPixel) {
        const { shapePoints, isControlPoint } = tracert(x, y, pixels)
        if (isControlPoint) {
          shapePoints.forEach(([x, y], i) => {
            const idx = findPixelIndex(x, y, img.width)
            imageData.data[idx] = 103
            imageData.data[idx + 1] = 39
            imageData.data[idx + 2] = 176
          })
        }
      }
    }
  }

  suspended = true
  context.putImageData(imageData, dx, dy)
}

const drawImage = () => {
  context.save()
  context.translate(wCenter, hCenter)
  context.translate(-wCenter, -hCenter)
  context.drawImage(img, wCenter - img.width / 2, hCenter - img.height / 2, img.width, img.height)
  context.restore()
}

const update = () => {
  if (!suspended) {
    context.clearRect(0, 0, canvas.width, canvas.height)
    drawImage()
    requestAnimationFrame(update)
  }
}

const showFile = (input) => {
  const file = input.files[0]
  const path = (window.URL || window.webkitURL).createObjectURL(file)

  img = document.createElement('img')
  img.src = path

  img.onload = () => {
    update()
  }
}

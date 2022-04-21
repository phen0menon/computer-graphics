const width = 1000
const height = 1000

class Point3D {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  rotateX(angle) {
    const rad = (angle * Math.PI) / 180
    const cosa = Math.cos(rad)
    const sina = Math.sin(rad)
    const newY = this.y * cosa - this.z * sina
    const newZ = this.y * sina + this.z * cosa
    return new Point3D(this.x, newY, newZ)
  }

  rotateY(angle) {
    const rad = (angle * Math.PI) / 180
    const cosa = Math.cos(rad)
    const sina = Math.sin(rad)
    const newZ = this.z * cosa - this.x * sina
    const newX = this.z * sina + this.x * cosa
    return new Point3D(newX, this.y, newZ)
  }

  rotateZ(angle) {
    const rad = (angle * Math.PI) / 180
    const cosa = Math.cos(rad)
    const sina = Math.sin(rad)
    const newX = this.x * cosa - this.y * sina
    const newY = this.x * sina + this.y * cosa
    return new Point3D(newX, newY, this.z)
  }

  project(viewDistance = 10) {
    const factor = width / (viewDistance + this.z)
    const newX = this.x * factor + width / 2
    const newY = this.y * factor + height / 2
    return new Point3D(newX, newY, this.z)
  }
}

const shapeSizeCoordCoef = 1

const graph = {
  vertices: [
    new Point3D(shapeSizeCoordCoef, shapeSizeCoordCoef, shapeSizeCoordCoef),
    new Point3D(-shapeSizeCoordCoef + shapeSizeCoordCoef * 2, -shapeSizeCoordCoef * 2, -shapeSizeCoordCoef),
    new Point3D(shapeSizeCoordCoef * 3, shapeSizeCoordCoef, -shapeSizeCoordCoef),
    new Point3D(-shapeSizeCoordCoef, shapeSizeCoordCoef, -shapeSizeCoordCoef),
  ],
  faces: [
    [0, 2, 3], // поверхность
    [1, 2, 3], // грань первая - длинная
    [1, 0, 3], // грань левая
    [1, 0, 2], // грань права
  ],
  angle: 0,
  ctx: null,
}

function startDemo() {
  const canvas = document.getElementById('shape')
  graph.ctx = canvas.getContext('2d')
  setInterval(loop, 30)
}

function constructCanvas() {
  graph.ctx.fillStyle = '#000000'
  graph.ctx.fillRect(0, 0, 3000, 1000)
  graph.ctx.strokeStyle = 'rgb(255,255,255)'
}

function loop() {
  const { vertices, faces, angle } = graph

  constructCanvas()

  const edges = vertices.map((vertex) => vertex.rotateX(angle).project())

  faces.forEach((face) => {
    graph.ctx.beginPath()
    graph.ctx.moveTo(edges[face[0]].x, edges[face[0]].y)
    graph.ctx.lineTo(edges[face[1]].x, edges[face[1]].y)
    graph.ctx.lineTo(edges[face[2]].x, edges[face[2]].y)
    graph.ctx.closePath()
    graph.ctx.stroke()
  })

  graph.angle += 3
}

window.onload = startDemo

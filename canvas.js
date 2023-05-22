class Canvas {
  constructor() {
    this.canvas = document.getElementById('myCanvas')
    this.canvas.width = 1000
    this.canvas.height = 720
    this.ctx = this.canvas.getContext('2d')

    this.canvas.addEventListener('mousemove', e => {
      this.screenMousePosition.x = e.offsetX
      this.screenMousePosition.y = e.offsetY

      this.worldMousePosition = this.screenToWorld(this.screenMousePosition)

      this.draw()
    })

    this.screenMousePosition = {x: 0, y: 0}
    this.worldMousePosition = {x: 0, y: 0}

    this.nodes = []
    this.lines = []

    this.setUp()
    this.draw()  
    this.updateNodeTable()  
    this.updateElementTable()
  }

  setUp() {
    // const n1 = new Node(50, 100)
    // const n2 = new Node(300, 400)
    // const n3 = new Node(500, 100)

    // const l1 = new Line(n1, n2)
    // const l2 = new Line(n2, n3)

    // this.nodes = [...[n1, n2, n3]]
    // this.lines = [...[l1, l2]]

    const num = 10
    const nodes = []
    for (let i = 0; i < num; i++) {
      const node = new Node(this.randomInt(this.canvas.width), this.randomInt(this.canvas.height))     
      nodes.push(node)
    }

    const lines = []
    nodes.forEach((node, index) => {
      if (index < num - 1) {
        const line = new Line(nodes[index], nodes[index + 1])
        lines.push(line)
      }
    })

    this.nodes = nodes
    this.lines = lines
  }

  worldToScreen(worldPosition) {
    return {x: worldPosition.x, y: this.canvas.height - worldPosition.y}
  }

  screenToWorld(screenPosition) {
    return {x: screenPosition.x, y: this.canvas.height - screenPosition.y}
  }

  randomInt(max) {
    return Math.floor(Math.random() * max)
  }

  randomNode() {
    return new Node(this.randomInt(this.canvas.width), this.randomInt(this.canvas.height))
  }

  magnitude(line) {
    const lineStart = this.worldToScreen(line.endI)
    const lineEnd = this.worldToScreen(line.endJ)
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const magnitude = (dx*dx + dy*dy)**0.5
    return magnitude
  }

  unitVector(line) {
    const lineStart = this.worldToScreen(line.endI)
    const lineEnd = this.worldToScreen(line.endJ)
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const magnitude = (dx*dx + dy*dy)**0.5
    return {x: dx/magnitude, y: dy/magnitude}
  }

  scalarProjection(line) {
    const unitVectorB = this.unitVector(line)
    const lineStart = this.worldToScreen(line.endI)
    const vectorA = {x: this.screenMousePosition.x - lineStart.x, y: this.screenMousePosition.y - lineStart.y}
    return vectorA.x * unitVectorB.x + vectorA.y * unitVectorB.y
  }

  linePerpendicular(line) {
    const scalarProjection = this.scalarProjection(line)
    const lineUnitVector = this.unitVector(line)
    const positionVector = {x: lineUnitVector.x * scalarProjection, y: lineUnitVector.y * scalarProjection}
    const lineStart = this.worldToScreen(line.endI)
    return {x: lineStart.x + positionVector.x, y: lineStart.y + positionVector.y}
  }

  drawNode(screenPosition, radius=5, color='black') {
    this.ctx.save()
    this.ctx.strokeStyle = color
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(screenPosition.x, screenPosition.y, radius, 0, 2*Math.PI)
    this.ctx.fill()
    this.ctx.restore()
  }

  drawLine(start, end, width=2, color='black') {
    this.ctx.save()
    this.ctx.lineWidth = width
    this.ctx.beginPath()
    this.ctx.moveTo(start.x, start.y)
    this.ctx.lineTo(end.x, end.y)
    this.ctx.strokeStyle = color
    this.ctx.stroke()
    this.ctx.restore()
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.nodes.forEach(node => {
      this.drawNode(this.worldToScreen(node), 3, 'black')
    })

    this.lines.forEach((line, index) => {

      this.drawLine(this.worldToScreen(line.endI), this.worldToScreen(line.endJ))

      const dt = 10
      const mag = this.magnitude(line)
      const lp = this.linePerpendicular(line)
      const sp = this.scalarProjection(line).toFixed()

      if (sp < mag - dt && sp > dt) {
        this.ctx.font = '15px sansserif'
        this.ctx.fillText(`${sp}`, lp.x + 5, lp.y - 5)
        this.drawNode(this.linePerpendicular(line), 3, 'red')
        this.drawLine(this.screenMousePosition, this.linePerpendicular(line), 1, 'gray')
      }
    })
  }

  updateNodeTable() {
    const data = []
    this.nodes.forEach((node, index) => {
      data.push([index, node.x, node.y])
    })
    
    const tableManager = new TableManager('nodeTable')
    tableManager.clearAndAddRows(data)
  }

  updateElementTable() {
    const data = []
    this.lines.forEach((line, index) => {
      data.push([
        index,
        line.getLength().toFixed(1),
        `${line.getAngle().toFixed(1)}°`
      ])
    })

    const tableManager = new TableManager('lineTable')
    tableManager.clearAndAddRows(data)
  }
 
}

class Node {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}

class Line {
  constructor(endI, endJ) {
    this.endI = endI
    this.endJ = endJ
  }

  getLength() {
    const deltaX = this.endJ.x - this.endI.x
    const deltaY = this.endJ.y - this.endI.y
    return Math.sqrt(deltaX ** 2 + deltaY ** 2)
  }

  getAngle() {
    const deltaX = this.endJ.x - this.endI.x
    const deltaY = this.endJ.y - this.endI.y
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI)
  }
}

class TableManager {
  constructor(tableId) {
    this.table = document.getElementById(tableId)
    this.tableBody = this.table.getElementsByTagName('tbody')[0]
  }

  clearAndAddRows(rows) {
    while (this.tableBody.rows.length > 0) {
      this.tableBody.deleteRow(0)
    }

    rows.forEach((rowData) => {
      const newRow = this.tableBody.insertRow()
      rowData.forEach((cellData) => {
        const newCell = newRow.insertCell()
        newCell.textContent = cellData
      })
    })
  }
}



export { Canvas }
import {multiplicationTableForGroup} from './js/GroupStructure.js'

export function createMulttableCanvas (group, size) {
  const table = multiplicationTableForGroup(group)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', 'Multiplication table')

  const context = canvas.getContext('2d')
  const edge = (index) => Math.round(size * index / table.order)
  const colors = table.elements.map(
    (element) => `hsl(${Math.round(360 * element / table.order)}, 70%, 68%)`
  )

  for (let row = 0; row < table.order; row++) {
    for (let column = 0; column < table.order; column++) {
      const left = edge(column)
      const top = edge(row)
      const right = edge(column + 1)
      const bottom = edge(row + 1)
      context.fillStyle = colors[table.rows[row][column]]
      context.fillRect(left, top, right - left, bottom - top)
    }
  }

  return canvas
}

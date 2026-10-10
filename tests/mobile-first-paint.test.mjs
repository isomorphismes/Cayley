import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

function moduleURL (source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
}

const structureSource = await readFile(new URL('../js/GroupStructure.js', import.meta.url), 'utf8')
const structureURL = moduleURL(structureSource)
const mobileGroupSource = (await readFile(new URL('../MobileGroup.js', import.meta.url), 'utf8'))
  .replace("'./js/GroupStructure.js'", JSON.stringify(structureURL))
const {default: MobileGroup} = await import(moduleURL(mobileGroupSource))

const fixture = `<group>
<multtable>
<row>0 1 2 3</row>
<row>1 0 3 2</row>
<row>2 3 0 1</row>
<row>3 2 1 0</row>
</multtable>
<generators list="1 2"/>
<symmetryobject><point x="ignored"/></symmetryobject>
</group>`

const group = new MobileGroup(fixture)
assert.equal(group.order, 4)
assert.deepEqual(group.generators, [[1, 2]])
assert.equal(group._rows.filter(Boolean).length, 0)

for (const generator of group.generators[0]) {
  for (const element of group.elements) group.mult(generator, element)
}
assert.equal(group._rows.filter(Boolean).length, 2)

for (const row of group.elements) {
  for (const column of group.elements) group.mult(row, column)
}
assert.equal(group._rows.filter(Boolean).length, 4)

const mobile = await readFile(new URL('../Mobile.js', import.meta.url), 'utf8')
const table = await readFile(new URL('../MobileTable.js', import.meta.url), 'utf8')
const html = await readFile(new URL('../Mobile.html', import.meta.url), 'utf8')

for (const forbidden of ["./js/Library.js", "./js/XMLGroup.js", "./js/CayleyDiagramView.js", "./js/MulttableView.js", 'toDataURL']) {
  assert.equal(mobile.includes(forbidden), false)
}
assert.equal(html.toLowerCase().includes('jquery'), false)
assert.match(mobile, /cayleyGraphForGroup\(group\)/)
assert.equal(mobile.includes('group.mult(generator, element)'), false,
  'mobile renderer must consume graph structure rather than rebuild it')
assert.match(table, /multiplicationTableForGroup\(group\)/)
assert.equal(table.includes('group.mult(row, column)'), false,
  'table renderer must consume table structure rather than rebuild it')
assert.ok(mobile.indexOf('createCayleyCanvas(graph, size)') < mobile.indexOf('await afterPaint()'))
assert.ok(mobile.indexOf('await afterPaint()') < mobile.indexOf("await import('./MobileTable.js')"))

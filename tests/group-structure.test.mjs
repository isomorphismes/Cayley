import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

function moduleURL (source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
}

const structureSource = await readFile(new URL('../js/GroupStructure.js', import.meta.url), 'utf8')
const Structure = await import(moduleURL(structureSource))

const kleinXML = `<group>
<name text="V_4"/>
<multtable>
<row>0 1 2 3</row>
<row>1 0 3 2</row>
<row>2 3 0 1</row>
<row>3 2 1 0</row>
</multtable>
<generators list="1 2"/>
</group>`

const klein = Structure.finiteGroupFromGroupExplorerData(kleinXML)
assert.equal(klein.shortName, 'V_4')
assert.equal(klein.order, 4)
assert.deepEqual(klein.generators, [[1, 2]])
assert.equal(klein._rows.filter(Boolean).length, 0, 'XML rows stay lazy')
assert.equal(klein.mult(1, 2), 3)
assert.equal(klein._rows.filter(Boolean).length, 1)
assert.deepEqual(klein.center(), [0, 1, 2, 3])
assert.equal(klein.isAbelian(), true)
assert.deepEqual(klein.conjugacyClasses(), [[0], [1], [2], [3]])

const lazyKlein = Structure.finiteGroupFromGroupExplorerData(kleinXML)
const graph = Structure.cayleyGraphForGroup(lazyKlein)
assert.equal(lazyKlein._rows.filter(Boolean).length, 2,
  'graph construction should parse generator rows, not the whole table')
assert.equal(graph.kind, 'cayley-graph')
assert.equal(graph.multiplicationSide, 'left')
assert.equal(graph.edges.length, 8, 'one algebraic edge per element and selected generator')
assert.deepEqual(graph.generators.map((generator) => generator.involution), [true, true])
assert.deepEqual(graph.edges[0], {from: 0, to: 1, generator: 1, generatorIndex: 0})

const table = Structure.multiplicationTableForGroup(klein)
assert.equal(table.kind, 'multiplication-table')
assert.deepEqual(table.rows, [
  [0, 1, 2, 3],
  [1, 0, 3, 2],
  [2, 3, 0, 1],
  [3, 2, 1, 0]
])

const planeAction = Structure.planarActionForGroup(klein)
assert.equal(planeAction.kind, 'dihedral')
assert.equal(planeAction.rotationOrder, 2)

const permutations = [
  [0, 1, 2],
  [1, 0, 2],
  [2, 1, 0],
  [0, 2, 1],
  [1, 2, 0],
  [2, 0, 1]
]
const permutationIndex = new Map(permutations.map((permutation, index) => [permutation.join(','), index]))
const compose = (left, right) => left.map((_, index) => left[right[index]])
const symmetricRows = permutations.map((left) =>
  permutations.map((right) => permutationIndex.get(compose(left, right).join(',')))
)
const symmetric = new Structure.FiniteGroup({
  shortName: 'S_3',
  multtable: symmetricRows,
  generators: [[1, 4]]
})
assert.equal(symmetric.isAbelian(), false)
assert.deepEqual(symmetric.center(), [0])
assert.deepEqual(symmetric.conjugacyClasses().map((entry) => entry.length).sort(), [1, 2, 3])
assert.equal(Structure.planarActionForGroup(symmetric).rotationOrder, 3)

const leftGraph = Structure.cayleyGraphForGroup(symmetric, [1], {side: 'left'})
const rightGraph = Structure.cayleyGraphForGroup(symmetric, [1], {side: 'right'})
assert.ok(leftGraph.edges.some((edge, index) => edge.to !== rightGraph.edges[index].to),
  'left and right multiplication remain explicit rather than hidden in a renderer')

const spreadCopy = {...klein, shortName: 'renamed fixture'}
assert.equal(Structure.planarActionForGroup(spreadCopy).kind, 'dihedral')

for (const forbidden of ['document.', 'window.', 'createElement', 'getContext', 'fillStyle', 'strokeStyle']) {
  assert.equal(structureSource.includes(forbidden), false, `structure must not contain ${forbidden}`)
}
for (const value of [graph, table, planeAction]) {
  assert.doesNotThrow(() => JSON.stringify(value), 'plain representations must be serializable')
}

console.log('group structure tests passed')

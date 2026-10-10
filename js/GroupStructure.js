// @flow

/*
 * Display-neutral finite-group structure shared by Cayley frontends.
 *
 * This module owns finite multiplication-table semantics and plain-data
 * representations.  It deliberately owns no layout, color, canvas, SVG,
 * viewport, input gesture, menu, or Android policy.
 */

export class GroupStructureError extends Error {
  constructor (message /*: string */) {
    super(message)
    this.name = 'GroupStructureError'
  }
}

function cleanLabel (label /*: any */) /*: string */ {
  return String(label == null ? 'Selected group' : label).replace(/\s+/g, ' ').trim()
}

function decodeXMLAttribute (value /*: string */) /*: string */ {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function integerList (text /*: string */) /*: Array<number> */ {
  const trimmed = text.trim()
  if (trimmed === '') return []

  const values = trimmed.split(/\s+/).map(Number)
  if (values.some((value) => !Number.isInteger(value))) {
    throw new GroupStructureError('multiplication rows and generator lists must contain integers')
  }
  return values
}

function section (text /*: string */, tag /*: string */) /*: ?string */ {
  const match = text.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match == null ? undefined : match[1]
}

function attribute (tag /*: string */, name /*: string */) /*: ?string */ {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))
  return match == null ? undefined : match[1]
}

function xmlConfiguration (text /*: string */, fallbackName /*: string */) /*: any */ {
  const tableSource = section(text, 'multtable')
  if (tableSource == null) {
    throw new GroupStructureError('group XML has no multiplication table')
  }

  const rowSources = Array.from(
    tableSource.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/gi),
    (match) => match[1]
  )
  if (rowSources.length === 0) {
    throw new GroupStructureError('group XML has an empty multiplication table')
  }

  const nameMatch = text.match(/<name\b[^>]*\btext=(['"])(.*?)\1/i)
  const generatorSets = Array.from(text.matchAll(/<generators\b[^>]*>/gi), (match) => {
    const list = attribute(match[0], 'list')
    return list == null ? [] : integerList(list)
  }).filter((generators) => generators.length !== 0)

  return {
    shortName: cleanLabel(nameMatch == null ? fallbackName : decodeXMLAttribute(nameMatch[2])),
    rowSources,
    generatorSets
  }
}

function normalizeGeneratorSets (source /*: any */) /*: Array<Array<number>> */ {
  if (source == null) return []
  if (!Array.isArray(source)) {
    throw new GroupStructureError('generator sets must be arrays')
  }
  if (source.length === 0) return []

  const sets = Array.isArray(source[0]) ? source : [source]
  return sets.map((set) => {
    if (!Array.isArray(set) || set.some((element) => !Number.isInteger(element))) {
      throw new GroupStructureError('generator sets must contain integer element indices')
    }
    return Array.from(new Set(set))
  })
}

function objectConfiguration (source /*: any */, fallbackName /*: string */) /*: any */ {
  if (source == null || typeof source !== 'object') {
    throw new GroupStructureError('group data must be XML, JSON, or a multiplication-table object')
  }

  let rows = source.multtable || source.multiplicationTable || source.rows
  if (!Array.isArray(rows) && Number.isInteger(source.order) && typeof source.mult === 'function') {
    const elements = Array.isArray(source.elements)
      ? source.elements
      : Array.from({length: source.order}, (_, element) => element)
    rows = elements.map((left) => elements.map((right) => source.mult(left, right)))
  }
  if (!Array.isArray(rows)) {
    throw new GroupStructureError('group data has no multiplication table')
  }

  return {
    shortName: cleanLabel(source.shortName || source.name || fallbackName),
    rows,
    generatorSets: normalizeGeneratorSets(source.generatorSets || source.generators)
  }
}

function configuration (source /*: any */, fallbackName /*: string */) /*: any */ {
  if (typeof source !== 'string') return objectConfiguration(source, fallbackName)

  const trimmed = source.trim()
  if (trimmed === '') throw new GroupStructureError('group data is empty')
  if (!trimmed.startsWith('{')) return xmlConfiguration(trimmed, fallbackName)

  try {
    return objectConfiguration(JSON.parse(trimmed), fallbackName)
  } catch (error) {
    if (error instanceof GroupStructureError) throw error
    throw new GroupStructureError(`could not parse group JSON: ${error.message}`)
  }
}

function checkedElement (element /*: number */, order /*: number */) /*: number */ {
  if (!Number.isInteger(element) || element < 0 || element >= order) {
    throw new GroupStructureError(`element ${String(element)} is outside 0..${order - 1}`)
  }
  return element
}

function checkedRow (row /*: any */, rowIndex /*: number */, order /*: number */) /*: Array<number> */ {
  const values = typeof row === 'string' ? integerList(row) : Array.from(row || [])
  if (values.length !== order) {
    throw new GroupStructureError(`multiplication row ${rowIndex} must contain ${order} entries`)
  }
  values.forEach((entry) => checkedElement(entry, order))
  return Object.freeze(values)
}

export class FiniteGroup {
  /*::
  shortName: string;
  name: string;
  identity: number;
  order: number;
  elements: Array<number>;
  _row_sources: Array<string>;
  _rows: Array<void | Array<number>>;
  _generator_sets: Array<Array<number>>;
  */

  constructor (source /*: any */, fallbackName /*: string */ = 'Selected group') {
    const config = configuration(source, fallbackName)
    const rowSources = Array.isArray(config.rowSources) ? config.rowSources : null
    const rows = Array.isArray(config.rows) ? config.rows : null

    this.shortName = config.shortName
    this.name = config.shortName
    this.identity = 0
    this.order = rowSources == null ? rows.length : rowSources.length
    if (this.order === 0) {
      throw new GroupStructureError('group has an empty multiplication table')
    }

    this.elements = Object.freeze(Array.from({length: this.order}, (_, element) => element))
    this._row_sources = rowSources == null ? rows.map((row) => Array.from(row).join(' ')) : rowSources.slice()
    this._rows = new Array(this.order)
    if (rows != null) {
      rows.forEach((row, rowIndex) => {
        this._rows[rowIndex] = checkedRow(row, rowIndex, this.order)
      })
    }

    this._generator_sets = normalizeGeneratorSets(config.generatorSets).map((set) => {
      set.forEach((element) => checkedElement(element, this.order))
      return Object.freeze(set.slice())
    })

    Object.defineProperty(this, 'multtable', {
      enumerable: true,
      get: () => this.elements.map((rowIndex) => this.row(rowIndex).slice())
    })
  }

  row (rowIndex /*: number */) /*: Array<number> */ {
    checkedElement(rowIndex, this.order)
    let row = this._rows[rowIndex]
    if (row == null) {
      row = checkedRow(this._row_sources[rowIndex], rowIndex, this.order)
      this._rows[rowIndex] = row
    }
    return row
  }

  mult (left /*: number */, right /*: number */) /*: number */ {
    checkedElement(left, this.order)
    checkedElement(right, this.order)
    return this.row(left)[right]
  }

  multiply (left /*: number */, right /*: number */) /*: number */ {
    return this.mult(left, right)
  }

  get generators () /*: Array<Array<number>> */ {
    if (this._generator_sets.length === 0 && this.order > 1) {
      this._generator_sets = [Object.freeze(this.findGenerators())]
    }
    return this._generator_sets
  }

  get generatorSets () /*: Array<Array<number>> */ {
    return this.generators
  }

  assertIdentity () /*: FiniteGroup */ {
    for (const element of this.elements) {
      if (this.mult(this.identity, element) !== element || this.mult(element, this.identity) !== element) {
        throw new GroupStructureError('element 0 must be the identity')
      }
    }
    return this
  }

  closure (generators /*: Array<number> */, options /*: any */ = {}) /*: Set<number> */ {
    const side = options.side || 'left'
    if (side !== 'left' && side !== 'right') {
      throw new GroupStructureError("closure side must be 'left' or 'right'")
    }
    generators.forEach((element) => checkedElement(element, this.order))

    const seen = new Set([this.identity])
    const queue = [this.identity]
    while (queue.length !== 0) {
      const element = queue.shift()
      if (element == null) continue

      generators.forEach((generator) => {
        const product = side === 'left'
          ? this.mult(generator, element)
          : this.mult(element, generator)
        if (!seen.has(product)) {
          seen.add(product)
          queue.push(product)
        }
      })
    }
    return seen
  }

  findGenerators () /*: Array<number> */ {
    const generators = []
    let generated = new Set([this.identity])
    for (const element of this.elements.slice(1)) {
      if (generated.has(element)) continue
      generators.push(element)
      generated = this.closure(generators)
      if (generated.size === this.order) break
    }
    return generators
  }

  elementOrder (element /*: number */) /*: number */ {
    checkedElement(element, this.order)
    let current = this.identity
    for (let exponent = 1; exponent <= this.order; exponent++) {
      current = this.mult(element, current)
      if (current === this.identity) return exponent
    }
    throw new GroupStructureError(`element ${element} did not return to the identity`)
  }

  powers (element /*: number */) /*: Array<number> */ {
    checkedElement(element, this.order)
    const result = []
    const seen = new Set()
    let current = this.identity
    while (!seen.has(current)) {
      seen.add(current)
      result.push(current)
      current = this.mult(element, current)
    }
    if (current !== this.identity) {
      throw new GroupStructureError(`powers of element ${element} did not return to the identity`)
    }
    return result
  }

  inverse (element /*: number */) /*: number */ {
    checkedElement(element, this.order)
    const inverse = this.row(element).indexOf(this.identity)
    if (inverse < 0) {
      throw new GroupStructureError(`element ${element} has no inverse`)
    }
    return inverse
  }

  conjugate (element /*: number */, by /*: number */) /*: number */ {
    checkedElement(element, this.order)
    checkedElement(by, this.order)
    return this.mult(this.mult(by, element), this.inverse(by))
  }

  conjugacyClass (element /*: number */) /*: Array<number> */ {
    checkedElement(element, this.order)
    return Array.from(new Set(this.elements.map((by) => this.conjugate(element, by)))).sort((a, b) => a - b)
  }

  conjugacyClasses () /*: Array<Array<number>> */ {
    const remaining = new Set(this.elements)
    const classes = []
    while (remaining.size !== 0) {
      const element = remaining.values().next().value
      const conjugacyClass = this.conjugacyClass(element)
      conjugacyClass.forEach((member) => remaining.delete(member))
      classes.push(conjugacyClass)
    }
    return classes
  }

  center () /*: Array<number> */ {
    return this.elements.filter((element) =>
      this.elements.every((other) => this.mult(element, other) === this.mult(other, element))
    )
  }

  isAbelian () /*: boolean */ {
    return this.center().length === this.order
  }
}

export function finiteGroupFromGroupExplorerData (
  source /*: any */,
  fallbackName /*: string */ = 'Selected group'
) /*: FiniteGroup */ {
  return source instanceof FiniteGroup ? source : new FiniteGroup(source, fallbackName)
}

function selectedGenerators (group /*: FiniteGroup */, generators /*: ?Array<number> */) /*: Array<number> */ {
  const selected = generators == null ? (group.generators[0] || []) : generators
  selected.forEach((element) => checkedElement(element, group.order))
  return Array.from(new Set(selected))
}

export function cayleyGraphForGroup (
  source /*: any */,
  generators /*: ?Array<number> */ = null,
  options /*: any */ = {}
) /*: any */ {
  const group = finiteGroupFromGroupExplorerData(source)
  const multiplicationSide = options.side || 'left'
  if (multiplicationSide !== 'left' && multiplicationSide !== 'right') {
    throw new GroupStructureError("Cayley graph side must be 'left' or 'right'")
  }

  const chosen = selectedGenerators(group, generators)
  const generatorData = chosen.map((element) => {
    const order = group.elementOrder(element)
    return Object.freeze({
      element,
      order,
      inverse: group.inverse(element),
      involution: order === 2
    })
  })

  const edges = []
  generatorData.forEach((generator, generatorIndex) => {
    group.elements.forEach((from) => {
      const to = multiplicationSide === 'left'
        ? group.mult(generator.element, from)
        : group.mult(from, generator.element)
      edges.push(Object.freeze({
        from,
        to,
        generator: generator.element,
        generatorIndex
      }))
    })
  })

  return Object.freeze({
    kind: 'cayley-graph',
    identity: group.identity,
    order: group.order,
    elements: Object.freeze(group.elements.slice()),
    multiplicationSide,
    generators: Object.freeze(generatorData),
    edges: Object.freeze(edges)
  })
}

export function multiplicationTableForGroup (source /*: any */) /*: any */ {
  const group = finiteGroupFromGroupExplorerData(source)
  const rows = group.elements.map((rowIndex) => Object.freeze(group.row(rowIndex).slice()))
  return Object.freeze({
    kind: 'multiplication-table',
    identity: group.identity,
    order: group.order,
    elements: Object.freeze(group.elements.slice()),
    rows: Object.freeze(rows)
  })
}

function cyclicAction (group /*: FiniteGroup */) /*: ?any */ {
  for (const element of group.elements) {
    if (group.elementOrder(element) === group.order) {
      return Object.freeze({
        kind: 'cyclic',
        order: group.order,
        rotationOrder: group.order,
        rotationElement: element,
        orbitSize: group.order
      })
    }
  }
  return null
}

function dihedralAction (group /*: FiniteGroup */) /*: ?any */ {
  if (group.order < 4 || group.order % 2 !== 0) return null

  const rotationOrder = group.order / 2
  for (const rotationElement of group.elements.slice(1)) {
    if (group.elementOrder(rotationElement) !== rotationOrder) continue

    const rotationPowers = group.powers(rotationElement)
    const rotations = new Set(rotationPowers)
    const inverseRotation = group.inverse(rotationElement)

    for (const reflectionElement of group.elements.slice(1)) {
      if (rotations.has(reflectionElement) || group.elementOrder(reflectionElement) !== 2) continue

      const conjugate = group.mult(
        reflectionElement,
        group.mult(rotationElement, reflectionElement)
      )
      if (conjugate !== inverseRotation) continue

      const generated = new Set(rotationPowers)
      rotationPowers.forEach((power) => {
        generated.add(group.mult(reflectionElement, power))
      })
      if (generated.size === group.order) {
        return Object.freeze({
          kind: 'dihedral',
          order: group.order,
          rotationOrder,
          rotationElement,
          reflectionElement,
          orbitSize: group.order
        })
      }
    }
  }
  return null
}

export function planarActionForGroup (source /*: any */) /*: ?any */ {
  const group = finiteGroupFromGroupExplorerData(source).assertIdentity()
  return cyclicAction(group) || dihedralAction(group)
}

import { vi } from "vitest"

type Row = Record<string, unknown>
type Table = object
type Result = Row[] | Error

export type RecordedInsert = { table: Table; values: unknown }
export type RecordedUpdate = { table: Table; values: Row; where: unknown }
export type RecordedDelete = { table: Table; where: unknown }

class ResultQueues {
  private queues = new Map<Table | undefined, Result[]>()

  push(table: Table | undefined, results: Result[]) {
    const queue = this.queues.get(table) ?? []
    queue.push(...results)
    this.queues.set(table, queue)
  }

  /** Rows for the next read of `table`, falling back to the untargeted queue. */
  shift(table: Table | undefined): Row[] {
    const queue = this.queues.get(table) ?? this.queues.get(undefined)
    const result = queue && queue.length > 0 ? queue.shift()! : []
    if (result instanceof Error) throw result
    return result
  }

  clear() {
    this.queues.clear()
  }
}

/**
 * Minimal stand-in for the drizzle query builder: builder methods return the
 * same chain, and awaiting the chain resolves to the next queued result for
 * the table the chain reads from.
 */
function createChain(resolve: () => Row[]) {
  const chain: Record<string, unknown> = {
    then: (
      onFulfilled?: ((rows: Row[]) => unknown) | null,
      onRejected?: ((reason: unknown) => unknown) | null
    ) => {
      let settled: Promise<Row[]>
      try {
        settled = Promise.resolve(resolve())
      } catch (error) {
        settled = Promise.reject(error)
      }
      return settled.then(onFulfilled, onRejected)
    },
  }
  for (const method of [
    "where",
    "leftJoin",
    "innerJoin",
    "orderBy",
    "limit",
    "offset",
    "groupBy",
    "returning",
    "onConflictDoNothing",
  ]) {
    chain[method] = () => chain
  }
  return chain
}

export function createDbMock() {
  const selectResults = new ResultQueues()
  const insertResults = new ResultQueues()
  const inserts: RecordedInsert[] = []
  const updates: RecordedUpdate[] = []
  const deletes: RecordedDelete[] = []

  const select = () => {
    let table: Table | undefined
    const chain = createChain(() => selectResults.shift(table))
    chain.from = (from: Table) => {
      table = from
      return chain
    }
    return chain
  }

  const db = {
    select: vi.fn(select),
    selectDistinct: vi.fn(select),
    insert: vi.fn((table: Table) => {
      const chain = createChain(() => insertResults.shift(table))
      chain.values = (values: unknown) => {
        inserts.push({ table, values })
        return chain
      }
      return chain
    }),
    update: vi.fn((table: Table) => {
      const chain = createChain(() => [])
      let values: Row = {}
      chain.set = (next: Row) => {
        values = next
        return chain
      }
      chain.where = (where: unknown) => {
        updates.push({ table, values, where })
        return chain
      }
      return chain
    }),
    delete: vi.fn((table: Table) => {
      const chain = createChain(() => [])
      chain.where = (where: unknown) => {
        deletes.push({ table, where })
        return chain
      }
      return chain
    }),
    query: {} as Record<string, unknown>,
  }

  return {
    db,
    inserts,
    updates,
    deletes,
    /** Rows (or an error) for the next selects reading from `table`. */
    queueSelect: (table: Table, ...results: Result[]) => selectResults.push(table, results),
    /** Rows (or an error) for the next inserts into `table`. */
    queueInsert: (table: Table, ...results: Result[]) => insertResults.push(table, results),
    insertsInto: (table: Table) => inserts.filter((i) => i.table === table),
    updatesOf: (table: Table) => updates.filter((u) => u.table === table),
    deletesFrom: (table: Table) => deletes.filter((d) => d.table === table),
    reset: () => {
      selectResults.clear()
      insertResults.clear()
      inserts.length = 0
      updates.length = 0
      deletes.length = 0
      db.select.mockClear()
      db.selectDistinct.mockClear()
      db.insert.mockClear()
      db.update.mockClear()
      db.delete.mockClear()
      db.query = {}
    },
  }
}

const records = new Map()

export const settings = {
  async find() {
    return Array.from(records.values(), record => structuredClone(record))
  },

  async upsert(_id, value) {
    records.set(_id, { _id, value: structuredClone(value) })
  }
}

export function resetSettingsDatabase() {
  records.clear()
}

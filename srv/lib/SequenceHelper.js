module.exports = class SequenceHelper {
  constructor({ db, table, field }) {
    this.db = db;
    this.table = table;   
    this.field = field;  
  }

  async getNextNumber() {
    try {
      if (!this.db) throw new Error("No DB connection provided to SequenceHelper");
      if (this.db.kind !== "hana") {
        throw new Error(`SequenceHelper supports only HANA, but got: ${this.db.kind}`);
      }

      const sql = `
        SELECT MAX("${this.field}") AS "MAX_VALUE"
        FROM "${this.table}"
      `;

      const res = await this.db.run(sql);
      const maxValue = res && res[0] && res[0].MAX_VALUE;
      if (maxValue === null || maxValue === undefined) return 1;
      const num = Number(maxValue);
      if (!Number.isNaN(num)) return num + 1;
      const str = String(maxValue);
      const digitsMatch = str.match(/(\d+)$/); 
      if (digitsMatch) {
        const parsed = Number(digitsMatch[1]);
        if (!Number.isNaN(parsed)) return parsed + 1;
      }
      return 1;

    } catch (err) {
      console.error("SequenceHelper HANA error:", err);
      throw err;
    }
  }
};

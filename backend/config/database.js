const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, "../data/air_quality.db");
  }

  // Initialize database connection
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("❌ Database connection failed:", err.message);
          reject(err);
        } else {
          console.log("✓ Connected to SQLite database");
          resolve();
        }
      });
    });
  }

  // Create tables for air quality data
  async createTables() {
    const createNYCTable = `
      CREATE TABLE IF NOT EXISTS nyc_air_quality (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE,
        indicator_id TEXT,
        name TEXT,
        measure TEXT,
        measure_info TEXT,
        geo_type_name TEXT,
        geo_join_id TEXT,
        geo_place_name TEXT,
        time_period TEXT,
        start_date TEXT,
        data_value REAL,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createUSTable = `
      CREATE TABLE IF NOT EXISTS us_air_quality (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        measure_id TEXT,
        measure_name TEXT,
        measure_type TEXT,
        stratification_level TEXT,
        state_fips TEXT,
        state_name TEXT,
        county_fips TEXT,
        county_name TEXT,
        report_year INTEGER,
        value REAL,
        unit TEXT,
        unit_name TEXT,
        data_origin TEXT,
        monitor_only INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_nyc_geo_join_id ON nyc_air_quality(geo_join_id);
      CREATE INDEX IF NOT EXISTS idx_nyc_indicator_id ON nyc_air_quality(indicator_id);
      CREATE INDEX IF NOT EXISTS idx_nyc_start_date ON nyc_air_quality(start_date);
      CREATE INDEX IF NOT EXISTS idx_us_state_name ON us_air_quality(state_name);
      CREATE INDEX IF NOT EXISTS idx_us_measure_id ON us_air_quality(measure_id);
      CREATE INDEX IF NOT EXISTS idx_us_report_year ON us_air_quality(report_year);
    `;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createNYCTable, (err) => {
          if (err) reject(err);
        });

        this.db.run(createUSTable, (err) => {
          if (err) reject(err);
        });

        this.db.exec(createIndexes, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log("✓ Database tables and indexes created");
            resolve();
          }
        });
      });
    });
  }

  // Get NYC air quality data
  async getNYCData(geoJoinId = null, indicatorId = null, limit = 100) {
    let query = "SELECT * FROM nyc_air_quality WHERE 1=1";
    const params = [];

    if (geoJoinId) {
      query += " AND geo_join_id = ?";
      params.push(geoJoinId);
    }

    if (indicatorId) {
      query += " AND indicator_id = ?";
      params.push(indicatorId);
    }

    query += " ORDER BY start_date DESC LIMIT ?";
    params.push(limit);

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get US air quality data
  async getUSData(stateName = null, measureId = null, limit = 100) {
    let query = "SELECT * FROM us_air_quality WHERE 1=1";
    const params = [];

    if (stateName) {
      query += " AND state_name = ?";
      params.push(stateName);
    }

    if (measureId) {
      query += " AND measure_id = ?";
      params.push(measureId);
    }

    query += " ORDER BY report_year DESC LIMIT ?";
    params.push(limit);

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get latest data for a specific location
  async getLatestLocationData(geoJoinId) {
    const query = `
      SELECT * FROM nyc_air_quality 
      WHERE geo_join_id = ? 
      ORDER BY start_date DESC 
      LIMIT 10
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, [geoJoinId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get latest state data with averages
  async getLatestStateData(stateName) {
    const query = `
      SELECT 
        measure_id,
        measure_name,
        AVG(value) as avg_value,
        COUNT(*) as county_count,
        MAX(report_year) as latest_year
      FROM us_air_quality 
      WHERE state_name = ? AND value IS NOT NULL
      GROUP BY measure_id, measure_name
      ORDER BY latest_year DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, [stateName], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get all available states
  async getAvailableStates() {
    const query = `
      SELECT 
        state_name,
        COUNT(DISTINCT county_name) as county_count,
        COUNT(*) as data_points,
        MAX(report_year) as latest_year
      FROM us_air_quality 
      GROUP BY state_name 
      ORDER BY state_name
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get database statistics
  async getStats() {
    const queries = {
      nycCount: "SELECT COUNT(*) as count FROM nyc_air_quality",
      usCount: "SELECT COUNT(*) as count FROM us_air_quality",
      stateCount:
        "SELECT COUNT(DISTINCT state_name) as count FROM us_air_quality",
      measureCount:
        "SELECT COUNT(DISTINCT measure_name) as count FROM us_air_quality",
    };

    const stats = {};

    for (const [key, query] of Object.entries(queries)) {
      await new Promise((resolve, reject) => {
        this.db.get(query, [], (err, row) => {
          if (err) {
            reject(err);
          } else {
            stats[key] = row.count;
            resolve();
          }
        });
      });
    }

    return stats;
  }

  // Insert NYC data
  async insertNYCData(data) {
    const query = `
      INSERT OR REPLACE INTO nyc_air_quality 
      (unique_id, indicator_id, name, measure, measure_info, geo_type_name, 
       geo_join_id, geo_place_name, time_period, start_date, data_value, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(query);

      data.forEach((row) => {
        stmt.run([
          row["Unique ID"],
          row["Indicator ID"],
          row["Name"],
          row["Measure"],
          row["Measure Info"],
          row["Geo Type Name"],
          row["Geo Join ID"],
          row["Geo Place Name"],
          row["Time Period"],
          row["Start_Date"],
          parseFloat(row["Data Value"]) || null,
          row["Message"],
        ]);
      });

      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Insert US data
  async insertUSData(data) {
    const query = `
      INSERT OR REPLACE INTO us_air_quality 
      (measure_id, measure_name, measure_type, stratification_level, state_fips, 
       state_name, county_fips, county_name, report_year, value, unit, 
       unit_name, data_origin, monitor_only)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(query);

      data.forEach((row) => {
        stmt.run([
          row["MeasureId"],
          row["MeasureName"],
          row["MeasureType"],
          row["StratificationLevel"],
          row["StateFips"],
          row["StateName"],
          row["CountyFips"],
          row["CountyName"],
          parseInt(row["ReportYear"]) || null,
          parseFloat(row["Value"]) || null,
          row["Unit"],
          row["UnitName"],
          row["DataOrigin"],
          parseInt(row["MonitorOnly"]) || 0,
        ]);
      });

      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("❌ Error closing database:", err.message);
        } else {
          console.log("✓ Database connection closed");
        }
      });
    }
  }
}

module.exports = new Database();

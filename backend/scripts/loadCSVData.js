const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const database = require("../config/database");

class CSVLoader {
  constructor() {
    this.nycData = [];
    this.usData = [];
  }

  // Load NYC CSV data
  async loadNYCData() {
    return new Promise((resolve, reject) => {
      const csvPath = path.join(__dirname, "../data/Air_Quality.csv");

      if (!fs.existsSync(csvPath)) {
        reject(new Error("NYC CSV file not found"));
        return;
      }

      const results = [];

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (data) => {
          // Clean and validate data
          if (data["Unique ID"] && data["Unique ID"].trim()) {
            results.push(data);
          }
        })
        .on("end", () => {
          this.nycData = results;
          console.log(`✓ Loaded ${results.length} NYC records from CSV`);
          resolve(results);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  // Load US CSV data
  async loadUSData() {
    return new Promise((resolve, reject) => {
      const csvPath = path.join(
        __dirname,
        "../data/countries_air_quality_data.csv"
      );

      if (!fs.existsSync(csvPath)) {
        reject(new Error("US CSV file not found"));
        return;
      }

      const results = [];

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (data) => {
          // Clean and validate data
          if (
            data["MeasureId"] &&
            data["StateName"] &&
            data["StateName"].trim()
          ) {
            results.push(data);
          }
        })
        .on("end", () => {
          this.usData = results;
          console.log(`✓ Loaded ${results.length} US records from CSV`);
          resolve(results);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  // Load all CSV data into database
  async loadAllData() {
    try {
      console.log("\n🔄 Starting CSV data migration to SQLite...\n");

      // Connect to database
      await database.connect();
      await database.createTables();

      // Load CSV files
      console.log("📂 Loading CSV files...");
      await this.loadNYCData();
      await this.loadUSData();

      // Insert data into database
      console.log("\n💾 Inserting data into database...");

      if (this.nycData.length > 0) {
        await database.insertNYCData(this.nycData);
        console.log(`✓ Inserted ${this.nycData.length} NYC records`);
      }

      if (this.usData.length > 0) {
        await database.insertUSData(this.usData);
        console.log(`✓ Inserted ${this.usData.length} US records`);
      }

      // Get final statistics
      const stats = await database.getStats();

      console.log("\n📊 Migration completed successfully!");
      console.log("===========================================");
      console.log(`NYC Records: ${stats.nycCount}`);
      console.log(`US Records: ${stats.usCount}`);
      console.log(`Total States: ${stats.stateCount}`);
      console.log(`Unique Measures: ${stats.measureCount}`);
      console.log("===========================================\n");

      return stats;
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      throw error;
    }
  }

  // Check if database needs migration
  async checkMigrationNeeded() {
    try {
      await database.connect();
      const stats = await database.getStats();

      // If we have data, migration might not be needed
      if (stats.nycCount > 0 || stats.usCount > 0) {
        console.log("✓ Database already contains data");
        console.log(
          `NYC Records: ${stats.nycCount}, US Records: ${stats.usCount}`
        );
        return false;
      }

      return true;
    } catch (error) {
      // If database doesn't exist or has issues, we need migration
      return true;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const loader = new CSVLoader();

  loader
    .checkMigrationNeeded()
    .then(async (needsMigration) => {
      if (needsMigration) {
        await loader.loadAllData();
        console.log("🎉 Data migration completed successfully!");
      } else {
        console.log("ℹ️  Database already populated, skipping migration");
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error.message);
      process.exit(1);
    });
}

module.exports = CSVLoader;

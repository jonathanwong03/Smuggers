const database = require("../config/database");

async function viewDatabase() {
  try {
    console.log("\n🔍 SQLite Database Viewer");
    console.log("=========================\n");

    // Connect to database
    await database.connect();

    // Get basic statistics
    const stats = await database.getStats();
    console.log("📊 Database Statistics:");
    console.log(`   NYC Records: ${stats.nycCount}`);
    console.log(`   US Records: ${stats.usCount}`);
    console.log(`   Total States: ${stats.stateCount}`);
    console.log(`   Unique Measures: ${stats.measureCount}\n`);

    // Show sample NYC data
    console.log("🏙️  Sample NYC Air Quality Data:");
    console.log("================================");
    const nycSample = await database.getNYCData(null, null, 5);
    nycSample.forEach((record, i) => {
      console.log(`${i + 1}. ${record.name} in ${record.geo_place_name}`);
      console.log(`   Value: ${record.data_value} ${record.measure}`);
      console.log(`   Date: ${record.start_date}`);
      console.log(`   Period: ${record.time_period}\n`);
    });

    // Show sample US data
    console.log("🇺🇸 Sample US Air Quality Data:");
    console.log("===============================");
    const usSample = await database.getUSData(null, null, 5);
    usSample.forEach((record, i) => {
      console.log(`${i + 1}. ${record.measure_name}`);
      console.log(
        `   State: ${record.state_name}, County: ${record.county_name}`
      );
      console.log(`   Value: ${record.value} ${record.unit_name}`);
      console.log(`   Year: ${record.report_year}\n`);
    });

    // Show available states
    console.log("🗺️  Available States:");
    console.log("===================");
    const states = await database.getAvailableStates();
    states.slice(0, 10).forEach((state, i) => {
      console.log(
        `${i + 1}. ${state.state_name} (${state.county_count} counties, ${
          state.data_points
        } records)`
      );
    });

    if (states.length > 10) {
      console.log(`   ... and ${states.length - 10} more states`);
    }

    console.log("\n✓ Database view complete!\n");
  } catch (error) {
    console.error("❌ Error viewing database:", error.message);
  } finally {
    database.close();
  }
}

// Run if called directly
if (require.main === module) {
  viewDatabase();
}

module.exports = viewDatabase;

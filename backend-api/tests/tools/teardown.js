const path = require('path');

module.exports = async () => {
  try {
    const db = require(path.join(__dirname, '../../src/config/database'));
    if (db && typeof db.closePool === 'function') {
      await db.closePool();
    }
  } catch (e) {
    // ignore
  }
};


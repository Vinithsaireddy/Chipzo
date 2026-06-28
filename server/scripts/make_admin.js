'use strict';

/**
 * Script: make_admin.js
 * Upserts the user admin@chipzo.in:
 *   - Creates the user if it doesn't exist
 *   - Sets name to "Admin", password to "Admin@123", role to "admin", isVerified to true
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../src/models/User');

const TARGET_EMAIL = 'admin@chipzo.in';
const TARGET_NAME  = 'Admin';
const TARGET_PASS  = 'Admin@123';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB');

  const hashedPassword = await bcrypt.hash(TARGET_PASS, 12);

  const existing = await User.findOne({ email: TARGET_EMAIL }).select('+password');

  if (existing) {
    existing.name       = TARGET_NAME;
    existing.password   = hashedPassword;
    existing.role       = 'admin';
    existing.isVerified = true;
    // Skip pre-save hook hashing — password is already hashed
    await User.updateOne(
      { email: TARGET_EMAIL },
      {
        $set: {
          name:       TARGET_NAME,
          password:   hashedPassword,
          role:       'admin',
          isVerified: true,
        },
      }
    );
    console.log(`✅  Updated existing user: ${TARGET_EMAIL}`);
  } else {
    await User.create({
      name:       TARGET_NAME,
      email:      TARGET_EMAIL,
      password:   hashedPassword,
      role:       'admin',
      isVerified: true,
    });
    // The pre-save hook will re-hash — so we bypass it by using updateOne after creation
    // Actually, create() triggers pre-save which will double-hash.
    // Safe approach: insert via Model directly after disabling hook by using updateOne:
    // Delete the one just created and re-insert via updateOne to avoid double-hashing.
    await User.updateOne({ email: TARGET_EMAIL }, { $set: { password: hashedPassword } });
    console.log(`✅  Created new admin user: ${TARGET_EMAIL}`);
  }

  console.log(`\n🔑  Credentials:`);
  console.log(`    Email   : ${TARGET_EMAIL}`);
  console.log(`    Password: ${TARGET_PASS}`);
  console.log(`    Role    : admin`);

  await mongoose.disconnect();
  console.log('\n✅  Done. Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});

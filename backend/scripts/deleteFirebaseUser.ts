/**
 * Delete a Firebase user by email so they can re-register cleanly.
 * Usage: npx ts-node scripts/deleteFirebaseUser.ts bhavyagupta294@gmail.com
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { initializeFirebase, getFirebaseAdmin } from '../src/config/firebase';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node scripts/deleteFirebaseUser.ts <email>');
    process.exit(1);
  }

  initializeFirebase();
  const admin = getFirebaseAdmin();

  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${user.uid} (${user.email})`);
    await admin.auth().deleteUser(user.uid);
    console.log(`✅ Deleted Firebase user: ${email}`);
    console.log('You can now re-register with this email in the app.');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log(`ℹ️  No Firebase user found with email: ${email}`);
      console.log('You can register directly in the app.');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
  process.exit(0);
}

main();

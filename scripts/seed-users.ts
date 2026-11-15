// Seed script to create the 6 authorized users in Supabase Auth with their passwords
// Run with: npx tsx scripts/seed-users.ts
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('Set them and run again.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = [
  { email: 'coelhobenicio19@gmail.com', password: '111922' },
  { email: 'sugundousuario@gmail.com', password: '1083234' },
  { email: 'terceirousuario@gmail.com', password: '4839743' },
  { email: 'quartousuario@gmail.com', password: '83270498' },
  { email: 'benicioias@gmail.com', password: '111922' },
  { email: 'beniciokyrios@gmail.com', password: '111922jB-' },
];

async function seedUsers() {
  console.log('🌱 Seeding authorized users...\n');

  for (const user of users) {
    try {
      // Check if user already exists
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error(`❌ Error listing users:`, listError.message);
        continue;
      }

      const exists = existingUsers.users.some(u => u.email === user.email);

      if (exists) {
        console.log(`⏭️  ${user.email} already exists, skipping...`);
        continue;
      }

      // Create user with password
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          seeded: true,
        },
      });

      if (error) {
        console.error(`❌ Failed to create ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created ${user.email} (ID: ${data.user.id})`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${user.email}:`, err);
    }
  }

  console.log('\n🎉 Seeding complete!');
}

seedUsers().catch(console.error);
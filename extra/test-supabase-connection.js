// Test Supabase Connection
// Run with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data, error } = await supabase.from('events').select('count');

    if (error) {
      console.log('❌ Connection Error:', error.message);
      console.log('💡 This likely means tables don\'t exist yet');
      console.log('📝 Please run the SQL schema in your Supabase dashboard');
      return;
    }

    console.log('✅ Connection successful!');

    // Test 2: Check tables exist
    console.log('\n2️⃣ Checking if tables exist...');
    const tables = ['events', 'users', 'passes', 'bookings'];

    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        if (tableError) {
          console.log(`❌ Table '${table}' error:`, tableError.message);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' not accessible`);
      }
    }

    // Test 3: Check if admin user exists
    console.log('\n3️⃣ Checking admin user...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('email, role')
      .eq('email', 'the797events@gmail.com')
      .single();

    if (adminError) {
      console.log('❌ Admin user not found:', adminError.message);
    } else {
      console.log('✅ Admin user exists:', adminUser);
    }

    // Test 4: Check events
    console.log('\n4️⃣ Checking sample events...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('title, date')
      .limit(3);

    if (eventsError) {
      console.log('❌ Events error:', eventsError.message);
    } else {
      console.log('✅ Sample events:', events.length, 'found');
      events.forEach(event => console.log(`   - ${event.title} (${event.date})`));
    }

    console.log('\n🎉 Supabase connection test completed!');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testConnection();
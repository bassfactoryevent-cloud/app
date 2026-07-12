import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) {
    env[key.trim()] = vals.join('=').trim().replace(/^"|"$|^'|'$/g, '')
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUpdate() {
  const event_id = 'ed5af3b6-60a1-43fe-845f-00530a3ef8f8'
  
  const { data, error } = await supabase
    .from('events')
    .update({ 
      title: 'Techno Vanguard Festival test',
      updated_at: new Date().toISOString()
    })
    .eq('id', event_id)
    .select('id')
    .single()

  if (error) {
    console.error('Service Role Update Error:', error)
  } else {
    console.log('Service Role Update Success:', data)
  }
}

testUpdate()

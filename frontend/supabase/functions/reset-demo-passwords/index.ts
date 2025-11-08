import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Define demo users and their passwords
    const demoUsers = [
      { email: 'admin@akta.com', password: 'admin123456' },
      { email: 'kiosk001@akta.com', password: 'kiosk123456' },
      { email: 'kiosk002@akta.com', password: 'kiosk123456' },
      { email: 'kiosk003@akta.com', password: 'kiosk123456' },
    ]

    const results = []

    for (const user of demoUsers) {
      // Get user by email
      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (getUserError) {
        results.push({ email: user.email, error: getUserError.message })
        continue
      }

      const existingUser = userData.users.find(u => u.email === user.email)

      if (!existingUser) {
        results.push({ email: user.email, error: 'User not found' })
        continue
      }

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: user.password }
      )

      if (updateError) {
        results.push({ email: user.email, error: updateError.message })
      } else {
        results.push({ email: user.email, success: true })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo passwords reset',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

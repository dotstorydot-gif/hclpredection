import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

serve(async (req) => {
  const { searchParams } = new URL(req.url)
  const leagueId = searchParams.get("league") || "2" // UCL ID in API-Football
  const season = searchParams.get("season") || "2023" // Current season

  try {
    const response = await fetch(`https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&next=50`, {
      headers: {
        "x-rapidapi-key": API_KEY!,
        "x-rapidapi-host": "v3.football.api-sports.io"
      }
    })

    const { response: fixtures } = await response.json()

    for (const item of fixtures) {
      const { fixture, teams } = item
      
      const { error } = await supabase
        .from('matches')
        .upsert({
          api_id: fixture.id.toString(),
          home_team: teams.home.name,
          away_team: teams.away.name,
          home_logo: teams.home.logo,
          away_logo: teams.away.logo,
          kickoff_time: fixture.date,
          status: 'UPCOMING'
        }, { onConflict: 'api_id' })

      if (error) console.error(`Error upserting fixture ${fixture.id}:`, error.message)
    }

    return new Response(JSON.stringify({ message: `Synced ${fixtures.length} fixtures` }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

serve(async (req) => {
  try {
    // 1. Fetch matches that are currently LIVE or Starting soon
    const { data: activeMatches } = await supabase
      .from('matches')
      .select('*')
      .in('status', ['LIVE', 'UPCOMING'])
      .not('api_id', 'is', null)

    if (!activeMatches || activeMatches.length === 0) {
      return new Response(JSON.stringify({ message: "No active matches to sync" }))
    }

    // 2. Poll API-Football for live scores
    const apiIds = activeMatches.map(m => m.api_id).join('-')
    const response = await fetch(`https://v3.football.api-sports.io/fixtures?ids=${apiIds}`, {
      headers: {
        "x-rapidapi-key": API_KEY!,
        "x-rapidapi-host": "v3.football.api-sports.io"
      }
    })
    
    const { response: liveFixtures } = await response.json()

    for (const fixtureData of liveFixtures) {
      const { fixture, goals, teams } = fixtureData
      const localMatch = activeMatches.find(m => m.api_id === fixture.id.toString())
      
      if (!localMatch) continue

      const newHomeScore = goals.home || 0
      const newAwayScore = goals.away || 0
      const isGoal = newHomeScore > localMatch.home_score || newAwayScore > localMatch.away_score
      const isFinished = fixture.status.short === 'FT' || fixture.status.short === 'AET' || fixture.status.short === 'PEN'

      // 3. Update Match State
      const updates: any = {
        home_score: newHomeScore,
        away_score: newAwayScore,
        last_sync_at: new Date().toISOString()
      }

      if (fixture.status.short === '1H' || fixture.status.short === '2H' || fixture.status.short === 'HT') {
        updates.status = 'LIVE'
      }

      if (isGoal) {
        updates.buzzer_active = true
        // Broadcast buzzer event as well for instant UI updates
        const channel = supabase.channel(`match-${localMatch.id}`)
        channel.send({
          type: 'broadcast',
          event: 'activate-buzzer',
          payload: { matchId: localMatch.id, goalNumber: newHomeScore + newAwayScore }
        })

        // Auto-turn off buzzer after 2 mins
        setTimeout(async () => {
          await supabase.from('matches').update({ buzzer_active: false }).eq('id', localMatch.id)
        }, 120000)
      }

      const { error: updateError } = await supabase.from('matches').update(updates).eq('id', localMatch.id)
      if (updateError) console.error(`Error updating match ${localMatch.id}:`, updateError.message)

      // 4. Handle Match End & Award Points
      if (isFinished && !localMatch.processed) {
        const winner = newHomeScore > newAwayScore ? 'HOME' : 
                       newHomeScore < newAwayScore ? 'AWAY' : 'DRAW'
        
        const { error: awardError } = await supabase.rpc('award_points_for_match', {
          m_id: localMatch.id,
          win_choice: winner
        })
        
        if (awardError) console.error(`Error awarding points for match ${localMatch.id}:`, awardError.message)
      }
    }

    return new Response(JSON.stringify({ message: "Scores updated successfully" }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

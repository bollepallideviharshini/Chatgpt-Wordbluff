async function runFull3RoundGame() {
  try {
    console.log('=== STARTING COMPLETE 3-ROUND MULTIPLAYER TEST ===');
    
    // 1. Host creates room
    const createRes = await fetch('http://localhost:5173/.netlify/functions/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_room', hostName: 'Captain Bluff', hostAvatar: '👑' })
    });
    const { roomCode, hostId } = await createRes.json();
    console.log(`✅ Room Created: ${roomCode}`);

    // 2. Player 2 Joins
    const joinRes = await fetch('http://localhost:5173/.netlify/functions/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join_room', roomCode, playerName: 'Sherlock', avatar: '🦊' })
    });
    const { playerId: p2Id } = await joinRes.json();
    console.log(`✅ Player 2 Joined (Sherlock)`);

    // 3. Start Game
    const startRes = await fetch('http://localhost:5173/.netlify/functions/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start_game', roomCode, playerId: hostId })
    });
    const startData = await startRes.json();
    console.log(`🎮 Game Started: Round ${startData.state.round}/${startData.state.totalRounds}`);

    // Play 3 Rounds
    for (let r = 1; r <= 3; r++) {
      console.log(`\n--- ROUND ${r} IN PROGRESS ---`);
      
      // Get current state
      const stateRes = await fetch(`http://localhost:5173/.netlify/functions/game?action=get_state&roomCode=${roomCode}&playerId=${hostId}`);
      const state = (await stateRes.json()).state;
      console.log(`Prompt: "${state.currentQuestion.prompt}"`);

      // Test Anti-Truth filter on round 1
      if (r === 1) {
        // Find true answer keywords from memory/acceptable
        const truthLower = QUESTIONS_KEYWORDS(state.currentQuestion.prompt);
        if (truthLower) {
          const cheatTest = await fetch('http://localhost:5173/.netlify/functions/game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'submit_lie', roomCode, playerId: hostId, lieText: truthLower })
          });
          const cheatResult = await cheatTest.json();
          console.log(`Anti-Truth Blocked submission?`, cheatResult.code === 'TRUTH_ENTERED', `(${cheatResult.error})`);
        }
      }

      // Both submit lies
      await fetch('http://localhost:5173/.netlify/functions/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_lie', roomCode, playerId: hostId, lieText: `FakeLie_R${r}_Host` })
      });

      const p2LieRes = await fetch('http://localhost:5173/.netlify/functions/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_lie', roomCode, playerId: p2Id, lieText: `FakeLie_R${r}_P2` })
      });
      const p2LieData = await p2LieRes.json();
      console.log(`Both submitted! Auto-transition to: ${p2LieData.state.status}`);

      // Voting
      // Host votes for P2's lie
      const p2LieOpt = p2LieData.state.answers.find(a => a.text === `FakeLie_R${r}_P2`);
      await fetch('http://localhost:5173/.netlify/functions/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote_answer', roomCode, playerId: hostId, answerId: p2LieOpt.id })
      });

      // P2 votes for an answer that is not their own (could be truth or decoy)
      const p2StateRes = await fetch(`http://localhost:5173/.netlify/functions/game?action=get_state&roomCode=${roomCode}&playerId=${p2Id}`);
      const p2Answers = (await p2StateRes.json()).state.answers;
      const validChoiceForP2 = p2Answers.find(a => !a.isOwnLie);
      const voteRes = await fetch('http://localhost:5173/.netlify/functions/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote_answer', roomCode, playerId: p2Id, answerId: validChoiceForP2.id })
      });
      const voteData = await voteRes.json();
      console.log(`Voting concluded -> ${voteData.state.status}`);
      console.log(`Round ${r} Scores:`, voteData.state.players.map(p => `${p.name}: ${p.score} pts (+${p.roundScoreDelta})`));

      // Advance
      const nextRes = await fetch('http://localhost:5173/.netlify/functions/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next_round', roomCode, playerId: hostId })
      });
      const nextData = await nextRes.json();
      console.log(`Advanced: Status is now ${nextData.state.status}`);
    }

    // Check final Game Over state
    const finalRes = await fetch(`http://localhost:5173/.netlify/functions/game?action=get_state&roomCode=${roomCode}&playerId=${hostId}`);
    const finalState = (await finalRes.json()).state;
    console.log('\n🏆 === FINAL PODIUM RESULTS ===');
    console.log('Status:', finalState.status);
    finalState.players.sort((a, b) => b.score - a.score).forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.avatar} ${p.name}: ${p.score} pts (Lies fooled: ${p.stats.liesFooledCount}, Truths guessed: ${p.stats.truthsGuessedCount})`);
    });

    console.log('\n✨ COMPLETE 3-ROUND MATCH COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
  }
}

function QUESTIONS_KEYWORDS(prompt) {
  if (prompt.includes('Belmont')) return 'heart attack';
  if (prompt.includes('teacups')) return 'mustaches';
  if (prompt.includes('mayor')) return 'cat';
  if (prompt.includes('pugs')) return 'grumble';
  if (prompt.includes('alarm')) return 'peas';
  if (prompt.includes('Pringles')) return 'buried';
  if (prompt.includes('Rome')) return 'urine';
  if (prompt.includes('Switzerland')) return 'guinea pig';
  if (prompt.includes('carrots')) return 'night vision';
  if (prompt.includes('Scotland')) return 'unicorn';
  if (prompt.includes('Miami')) return 'birds';
  if (prompt.includes('Ethiopia')) return 'scrabble';
  if (prompt.includes('marathon')) return 'car';
  if (prompt.includes('aristocrats')) return 'vinegar';
  if (prompt.includes('thumb wrestling')) return 'drug';
  return null;
}

runFull3RoundGame();

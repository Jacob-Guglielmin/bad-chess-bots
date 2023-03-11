# Bad Chess Bots

This is a collection of strange chess algorithms I've created (including one that's actually even good!). The current list includes:

- Play a random (legal) move each turn
- Try to get all the pieces to the opposite side of the board as fast as possible
- Race the king to the opposite side of the board as fast as possible, taking pieces when required to get the king forward
- Set up the largest possible barrier between the opponent's pieces and the king
- Limit the opponent's options to as few different moves as possible
- Lose the game as fast as possible, offering as many pieces for capture as possible at the same time
- And a fairly simple algorithm that can do surprisingly well:
  - Avoid defeat when required
  - Checkmate wherever possible
  - Check wherever possible
  - Make the highest-valued capture (accounting for trades)
  - Control the center of the board
  - Advance toward the enemy king

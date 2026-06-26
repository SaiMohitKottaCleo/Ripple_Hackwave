useEffect(()) => {
// Fetch cascade when event changes
  simulateCascade({
    event,              // the triggered event
    characters,         // society
    connections,        // relationships
    impact: ctl.signal
  })
}, [event?.name]);

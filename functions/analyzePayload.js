function analyzePayloads(payloads) {
  const chunkAnalysisMap = new Map();

  for (const [gasType, gasArray] of Object.entries(payloads)) {
    const result = new Map();

    for (const payload of gasArray) {
      for (let startIndex = 2; startIndex < payload.length; startIndex += 64) {
        const chunk = payload.slice(startIndex, startIndex + 64);
        const range = `${startIndex - 2}-${startIndex + 62}`;

        if (!result.has(range)) {
          result.set(range, {});
        }

        const chunkCounts = result.get(range);
        chunkCounts[chunk] = (chunkCounts[chunk] || 0) + 1;
      }
    }

    chunkAnalysisMap.set(gasType, Object.fromEntries(result));
  }
  return Object.fromEntries(chunkAnalysisMap);
}

export default analyzePayloads;

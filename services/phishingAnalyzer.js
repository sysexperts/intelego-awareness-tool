function analyzePhishingData(data) {
  const { scenarios, users, company } = data;
  
  const totalUsers = users.length;
  const totalScenarios = scenarios.length;
  
  let totalClicks = 0;
  let totalLogins = 0;
  let totalFileOpens = 0;
  let totalMacroExecutions = 0;
  let totalReported = 0;
  let totalSuccessful = 0;
  
  const scenarioStats = scenarios.map(scenario => {
    const clicks = parseInt(scenario.clicks || scenario.Clicks || 0);
    const logins = parseInt(scenario.logins || scenario.Logins || 0);
    const fileOpens = parseInt(scenario.file_opens || scenario.FileOpens || scenario.file_open || 0);
    const macroExec = parseInt(scenario.macro_executions || scenario.MacroExecutions || scenario.macros || 0);
    const reported = parseInt(scenario.reported || scenario.Reported || 0);
    
    const successful = (clicks > 0 || logins > 0 || fileOpens > 0 || macroExec > 0) ? 1 : 0;
    
    totalClicks += clicks;
    totalLogins += logins;
    totalFileOpens += fileOpens;
    totalMacroExecutions += macroExec;
    totalReported += reported;
    totalSuccessful += successful;
    
    const successRate = totalUsers > 0 ? ((clicks + logins + fileOpens + macroExec) / totalUsers * 100) : 0;
    
    return {
      name: scenario.scenario_name || scenario.ScenarioName || scenario.name || 'Unbekannt',
      clicks,
      logins,
      fileOpens,
      macroExecutions: macroExec,
      reported,
      successRate: Math.round(successRate * 10) / 10,
      psychologicalFactor: scenario.psychological_factor || scenario.PsychologicalFactor || scenario.factor || 'Nicht angegeben'
    };
  });
  
  scenarioStats.sort((a, b) => b.successRate - a.successRate);
  
  const clickRate = totalUsers > 0 ? (totalClicks / totalUsers * 100) : 0;
  const successRate = totalScenarios > 0 ? (totalSuccessful / totalScenarios * 100) : 0;
  
  let riskLevel = 'Niedrig';
  if (successRate > 70) riskLevel = 'Kritisch';
  else if (successRate > 50) riskLevel = 'Hoch';
  else if (successRate > 30) riskLevel = 'Mittel';
  
  const psychologicalFactors = {};
  scenarioStats.forEach(s => {
    const factor = s.psychologicalFactor;
    psychologicalFactors[factor] = (psychologicalFactors[factor] || 0) + 1;
  });
  
  const topFactors = Object.entries(psychologicalFactors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([factor, count]) => ({ factor, count }));
  
  return {
    overview: {
      totalUsers,
      totalScenarios,
      clickRate: Math.round(clickRate * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
      riskLevel,
      totalClicks,
      totalLogins,
      totalFileOpens,
      totalMacroExecutions,
      totalReported
    },
    scenarioStats,
    topScenarios: scenarioStats.slice(0, 3),
    topFactors,
    reportedVsSuccessful: {
      reported: totalReported,
      successful: totalSuccessful,
      ratio: totalSuccessful > 0 ? Math.round((totalReported / totalSuccessful) * 100) : 0
    }
  };
}

module.exports = { analyzePhishingData };

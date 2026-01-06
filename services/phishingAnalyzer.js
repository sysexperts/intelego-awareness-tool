function parseNumber(value) {
  const num = parseInt(value);
  return isNaN(num) ? 0 : num;
}

function parseFloat2(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

function analyzePhishingData(data) {
  const { scenarios, users, company } = data;
  
  const hasScenarios = scenarios && scenarios.length > 0;
  const hasUsers = users && users.length > 0;
  const hasCompany = company && company.length > 0;
  
  const companyData = hasCompany ? (company[0] || {}) : {};
  
  const esi = parseFloat2(companyData.esi);
  const companyAttacksSent = parseNumber(companyData.attacks_sent);
  const companyAttacksSuccessful = parseNumber(companyData.attacks_successful);
  const companyAttacksReported = parseNumber(companyData.attacks_reported);
  const companyAttacksClicked = parseNumber(companyData.attacks_clicked);
  const companyAttacksLogins = parseNumber(companyData.attacks_logins);
  const companyAttacksFilesOpened = parseNumber(companyData.attacks_files_opened);
  const companyAttacksMacrosExecuted = parseNumber(companyData.attacks_macros_executed);
  
  const companyTrainingsCompleted = parseNumber(companyData.e_trainings_completed);
  const companyTrainingsStarted = parseNumber(companyData.e_trainings_started);
  const companyTrainingsNotStarted = parseNumber(companyData.e_trainings_not_started);
  
  const companyMostEffectivePsychFactors = companyData.most_effective_psychological_factors || 'Nicht angegeben';
  
  const levelData = [];
  for (let i = 1; i <= 5; i++) {
    const sent = parseNumber(companyData[`level_${i}_attacks_sent`]);
    const successful = parseNumber(companyData[`level_${i}_attacks_successful`]);
    const reported = parseNumber(companyData[`level_${i}_attacks_reported`]);
    const employees = parseNumber(companyData[`level_${i}_employees`]);
    
    const clickRate = sent > 0 ? (successful / sent * 100) : 0;
    
    levelData.push({
      level: i,
      attacksSent: sent,
      attacksSuccessful: successful,
      attacksReported: reported,
      employees,
      clickRate: Math.round(clickRate * 10) / 10
    });
  }
  
  const totalUsers = hasUsers ? users.length : 0;
  let vulnerableUsers = 0;
  
  if (hasUsers) {
    users.forEach(user => {
      const clicked = parseNumber(user.attacks_clicked);
      const successful = parseNumber(user.attacks_successful);
      
      if (clicked > 0 || successful > 0) {
        vulnerableUsers++;
      }
    });
  }
  
  const scenarioStats = hasScenarios ? scenarios.map(scenario => {
    const scenarioId = scenario.scenario_id || 'N/A';
    const description = scenario.scenario_description || 'Keine Beschreibung';
    const exploitType = scenario.scenario_exploit_type || 'Unbekannt';
    const psychFactors = scenario.scenario_psychological_factors || 'Nicht angegeben';
    const level = scenario.scenario_level || 'N/A';
    
    const successRate = parseFloat2(scenario.success_rate);
    const reportRate = parseFloat2(scenario.report_rate);
    
    const attacksSent = parseNumber(scenario.attacks_sent);
    const attacksSuccessful = parseNumber(scenario.attacks_successful);
    const attacksReported = parseNumber(scenario.attacks_reported);
    const attacksClicked = parseNumber(scenario.attacks_clicked);
    const attacksLogins = parseNumber(scenario.attacks_logins);
    const attacksFilesOpened = parseNumber(scenario.attacks_files_opened);
    const attacksMacrosExecuted = parseNumber(scenario.attacks_macros_executed);
    
    const trainingsCompleted = parseNumber(scenario.e_trainings_completed);
    const trainingsStarted = parseNumber(scenario.e_trainings_started);
    const trainingsNotStarted = parseNumber(scenario.e_trainings_not_started);
    
    const isSuccessful = (attacksClicked > 0 || attacksLogins > 0 || 
                         attacksFilesOpened > 0 || attacksMacrosExecuted > 0);
    
    return {
      scenarioId,
      description,
      exploitType,
      psychologicalFactors: psychFactors,
      level,
      successRate: Math.round(successRate * 10) / 10,
      reportRate: Math.round(reportRate * 10) / 10,
      attacksSent,
      attacksSuccessful,
      attacksReported,
      attacksClicked,
      attacksLogins,
      attacksFilesOpened,
      attacksMacrosExecuted,
      trainingsCompleted,
      trainingsStarted,
      trainingsNotStarted,
      isSuccessful
    };
  }) : [];
  
  if (scenarioStats.length > 0) {
    scenarioStats.sort((a, b) => b.successRate - a.successRate);
  }
  
  const gesamtKlickrate = companyAttacksSent > 0 ? 
    (companyAttacksClicked / companyAttacksSent * 100) : 0;
  
  const erfolgsquote = companyAttacksSent > 0 ? 
    (companyAttacksSuccessful / companyAttacksSent * 100) : 0;
  
  const meldequote = companyAttacksSuccessful > 0 ? 
    (companyAttacksReported / companyAttacksSuccessful * 100) : 0;
  
  let sicherheitsbewertung = 'Niedrig';
  if (erfolgsquote > 50) sicherheitsbewertung = 'Hoch';
  else if (erfolgsquote >= 30) sicherheitsbewertung = 'Mittel';
  
  const psychFactorCount = {};
  scenarioStats.forEach(s => {
    const factors = s.psychologicalFactors.split(',').map(f => f.trim());
    factors.forEach(factor => {
      if (factor && factor !== 'Nicht angegeben') {
        psychFactorCount[factor] = (psychFactorCount[factor] || 0) + 1;
      }
    });
  });
  
  const topPsychFactors = Object.entries(psychFactorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([factor, count]) => ({ factor, count }));
  
  return {
    overview: {
      esi,
      totalUsers,
      vulnerableUsers,
      vulnerableUsersPercent: totalUsers > 0 ? Math.round((vulnerableUsers / totalUsers) * 100 * 10) / 10 : 0,
      totalScenarios: scenarioStats.length,
      hasScenarios,
      hasUsers,
      hasCompany,
      gesamtKlickrate: Math.round(gesamtKlickrate * 10) / 10,
      erfolgsquote: Math.round(erfolgsquote * 10) / 10,
      meldequote: Math.round(meldequote * 10) / 10,
      sicherheitsbewertung,
      attacksSent: companyAttacksSent,
      attacksSuccessful: companyAttacksSuccessful,
      attacksReported: companyAttacksReported,
      attacksClicked: companyAttacksClicked,
      attacksLogins: companyAttacksLogins,
      attacksFilesOpened: companyAttacksFilesOpened,
      attacksMacrosExecuted: companyAttacksMacrosExecuted,
      trainingsCompleted: companyTrainingsCompleted,
      trainingsStarted: companyTrainingsStarted,
      trainingsNotStarted: companyTrainingsNotStarted,
      mostEffectivePsychFactors: companyMostEffectivePsychFactors
    },
    scenarioStats,
    topScenarios: scenarioStats.slice(0, 3),
    levelData,
    topPsychFactors,
    reportedVsSuccessful: {
      reported: companyAttacksReported,
      successful: companyAttacksSuccessful,
      ratio: Math.round(meldequote * 10) / 10
    }
  };
}

module.exports = { analyzePhishingData };

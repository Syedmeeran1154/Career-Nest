// Gamification System
class GamificationSystem {
  constructor() {
    this.badges = {
      'first_project': { name: 'First Steps', icon: '🚀', description: 'Created your first project' },
      'project_master': { name: 'Project Master', icon: '🏆', description: 'Completed 5+ projects' },
      'skill_collector': { name: 'Skill Collector', icon: '🎯', description: 'Added 10+ skills' },
      'certified_pro': { name: 'Certified Pro', icon: '🏅', description: 'Earned 3+ certificates' },
      'experience_builder': { name: 'Experience Builder', icon: '💼', description: 'Added work experience' },
      'social_connector': { name: 'Social Connector', icon: '🔗', description: 'Connected social profiles' },
      'profile_complete': { name: 'Profile Complete', icon: '✨', description: 'Completed your profile' },
      'streak_warrior': { name: 'Streak Warrior', icon: '🔥', description: 'Updated profile 7 days in a row' },
      'overachiever': { name: 'Overachiever', icon: '⭐', description: 'Reached level 10' },
      'resume_ready': { name: 'Resume Ready', icon: '📄', description: 'Generated your first resume' }
    };

    this.levels = [
      { level: 1, name: 'Beginner', xpRequired: 0, color: '#94a3b8' },
      { level: 2, name: 'Explorer', xpRequired: 100, color: '#06b6d4' },
      { level: 3, name: 'Developer', xpRequired: 250, color: '#10b981' },
      { level: 4, name: 'Contributor', xpRequired: 500, color: '#f59e0b' },
      { level: 5, name: 'Expert', xpRequired: 1000, color: '#ef4444' },
      { level: 6, name: 'Master', xpRequired: 1500, color: '#8b5cf6' },
      { level: 7, name: 'Guru', xpRequired: 2500, color: '#ec4899' },
      { level: 8, name: 'Legend', xpRequired: 4000, color: '#f97316' },
      { level: 9, name: 'Champion', xpRequired: 6000, color: '#84cc16' },
      { level: 10, name: 'Grandmaster', xpRequired: 10000, color: '#6366f1' }
    ];
  }

  getUserKey(baseKey, userId) {
    return `${baseKey}_${userId}`;
  }

  getGameData(userId) {
    const key = this.getUserKey('cn_game_data', userId);
    return JSON.parse(localStorage.getItem(key)) || {
      xp: 0,
      level: 1,
      badges: [],
      streak: 0,
      lastUpdate: null,
      achievements: []
    };
  }

  saveGameData(userId, data) {
    const key = this.getUserKey('cn_game_data', userId);
    localStorage.setItem(key, JSON.stringify(data));
  }

  calculateXP(profile, skills, projects, certificates, internships, social, education) {
    let xp = 0;
    
    // Profile completion XP
    if (profile.name) xp += 20;
    if (profile.email) xp += 10;
    if (profile.phone) xp += 10;
    if (profile.bio) xp += 30;
    if (profile.photo) xp += 40;
    
    // Skills XP
    xp += skills.length * 15;
    xp += skills.reduce((sum, skill) => sum + (skill.level || 0), 0) * 0.5;
    
    // Projects XP
    xp += projects.length * 50;
    xp += projects.filter(p => p.link).length * 20;
    
    // Certificates XP
    xp += certificates.length * 40;
    
    // Experience XP
    xp += internships.length * 60;
    
    // Social XP
    xp += social.length * 25;
    
    // Education XP
    xp += education.length * 35;
    
    return Math.round(xp);
  }

  getCurrentLevel(xp) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (xp >= this.levels[i].xpRequired) {
        return this.levels[i];
      }
    }
    return this.levels[0];
  }

  getNextLevel(currentLevel) {
    const currentIndex = this.levels.findIndex(l => l.level === currentLevel.level);
    return currentIndex < this.levels.length - 1 ? this.levels[currentIndex + 1] : null;
  }

  checkBadges(profile, skills, projects, certificates, internships, social, gameData) {
    const newBadges = [];
    
    // Check each badge condition
    if (projects.length >= 1 && !gameData.badges.includes('first_project')) {
      newBadges.push('first_project');
    }
    
    if (projects.length >= 5 && !gameData.badges.includes('project_master')) {
      newBadges.push('project_master');
    }
    
    if (skills.length >= 10 && !gameData.badges.includes('skill_collector')) {
      newBadges.push('skill_collector');
    }
    
    if (certificates.length >= 3 && !gameData.badges.includes('certified_pro')) {
      newBadges.push('certified_pro');
    }
    
    if (internships.length >= 1 && !gameData.badges.includes('experience_builder')) {
      newBadges.push('experience_builder');
    }
    
    if (social.length >= 2 && !gameData.badges.includes('social_connector')) {
      newBadges.push('social_connector');
    }
    
    const profileComplete = profile.name && profile.email && profile.bio && profile.photo;
    if (profileComplete && !gameData.badges.includes('profile_complete')) {
      newBadges.push('profile_complete');
    }
    
    if (gameData.level >= 10 && !gameData.badges.includes('overachiever')) {
      newBadges.push('overachiever');
    }
    
    return newBadges;
  }

  updateStreak(gameData) {
    const today = new Date().toDateString();
    const lastUpdate = gameData.lastUpdate ? new Date(gameData.lastUpdate).toDateString() : null;
    
    if (lastUpdate === today) {
      // Already updated today
      return gameData.streak;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastUpdate === yesterdayStr) {
      // Continuing streak
      gameData.streak += 1;
    } else if (lastUpdate !== today) {
      // Streak broken or first time
      gameData.streak = 1;
    }
    
    gameData.lastUpdate = new Date().toISOString();
    
    // Check streak badge
    if (gameData.streak >= 7 && !gameData.badges.includes('streak_warrior')) {
      gameData.badges.push('streak_warrior');
      return { newBadge: 'streak_warrior', streak: gameData.streak };
    }
    
    return gameData.streak;
  }

  renderGameStats(containerId, gameData, currentLevel, nextLevel) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const progressPercent = nextLevel ? 
      ((gameData.xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100 : 100;
    
    container.innerHTML = `
      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-2xl font-bold">${currentLevel.name}</h3>
            <p class="text-indigo-100">Level ${currentLevel.level}</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold">${gameData.xp}</div>
            <p class="text-indigo-100 text-sm">Total XP</p>
          </div>
        </div>
        
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span>Progress to ${nextLevel ? nextLevel.name : 'Max Level'}</span>
            <span>${Math.round(progressPercent)}%</span>
          </div>
          <div class="w-full bg-white/20 rounded-full h-3">
            <div class="bg-white h-3 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
          </div>
          ${nextLevel ? `<p class="text-xs text-indigo-100 mt-1">${nextLevel.xpRequired - gameData.xp} XP to next level</p>` : ''}
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🔥</span>
            <div>
              <div class="font-semibold">${gameData.streak} Day Streak</div>
              <div class="text-xs text-indigo-100">Keep it up!</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">🏆</span>
            <div>
              <div class="font-semibold">${gameData.badges.length} Badges</div>
              <div class="text-xs text-indigo-100">Earned</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderBadges(containerId, earnedBadges) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const badgeElements = earnedBadges.map(badgeId => {
      const badge = this.badges[badgeId];
      return `
        <div class="bg-white p-4 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
          <div class="text-3xl mb-2">${badge.icon}</div>
          <h4 class="font-semibold text-sm">${badge.name}</h4>
          <p class="text-xs text-gray-500 mt-1">${badge.description}</p>
        </div>
      `;
    }).join('');
    
    container.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${badgeElements || '<p class="text-gray-500 col-span-full text-center">No badges earned yet. Keep building your profile!</p>'}
      </div>
    `;
  }

  showLevelUpNotification(newLevel) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-8 rounded-xl shadow-2xl z-50 text-center animate-bounce';
    notification.innerHTML = `
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="text-3xl font-bold mb-2">Level Up!</h2>
      <p class="text-xl">You're now a <strong>${newLevel.name}</strong></p>
      <p class="text-lg">Level ${newLevel.level}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  showBadgeNotification(badgeId) {
    const badge = this.badges[badgeId];
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-xl shadow-lg z-50 animate-pulse';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-3xl">${badge.icon}</div>
        <div>
          <h3 class="font-bold">Badge Earned!</h3>
          <p class="text-sm">${badge.name}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}
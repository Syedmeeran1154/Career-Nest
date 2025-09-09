// External Platform Integrations
class PlatformIntegrations {
  constructor() {
    this.platforms = {
      github: {
        name: 'GitHub',
        icon: 'fab fa-github',
        color: '#333',
        fields: ['username'],
        description: 'Import repositories and contribution data'
      },
      leetcode: {
        name: 'LeetCode',
        icon: 'fas fa-code',
        color: '#FFA116',
        fields: ['username'],
        description: 'Import solved problems and contest ratings'
      },
      linkedin: {
        name: 'LinkedIn',
        icon: 'fab fa-linkedin',
        color: '#0077B5',
        fields: ['profile_url'],
        description: 'Import professional experience and connections'
      },
      coursera: {
        name: 'Coursera',
        icon: 'fas fa-graduation-cap',
        color: '#0056D3',
        fields: ['profile_url'],
        description: 'Import completed courses and certificates'
      },
      codepen: {
        name: 'CodePen',
        icon: 'fab fa-codepen',
        color: '#000',
        fields: ['username'],
        description: 'Import creative coding projects'
      },
      behance: {
        name: 'Behance',
        icon: 'fab fa-behance',
        color: '#1769FF',
        fields: ['username'],
        description: 'Import design portfolio projects'
      }
    };
  }

  getUserKey(baseKey, userId) {
    return `${baseKey}_${userId}`;
  }

  getIntegrationData(userId) {
    const key = this.getUserKey('cn_integrations', userId);
    return JSON.parse(localStorage.getItem(key)) || {};
  }

  saveIntegrationData(userId, data) {
    const key = this.getUserKey('cn_integrations', userId);
    localStorage.setItem(key, JSON.stringify(data));
  }

  async connectPlatform(userId, platform, credentials) {
    try {
      const integrationData = this.getIntegrationData(userId);
      
      // Simulate API call (in real implementation, this would call actual APIs)
      const mockData = await this.fetchMockData(platform, credentials);
      
      integrationData[platform] = {
        ...credentials,
        connected: true,
        lastSync: new Date().toISOString(),
        data: mockData
      };
      
      this.saveIntegrationData(userId, integrationData);
      return { success: true, data: mockData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchMockData(platform, credentials) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    switch (platform) {
      case 'github':
        return {
          repositories: [
            { name: 'awesome-project', stars: 45, language: 'JavaScript', description: 'A really awesome project' },
            { name: 'react-dashboard', stars: 23, language: 'TypeScript', description: 'Modern React dashboard' },
            { name: 'python-scraper', stars: 12, language: 'Python', description: 'Web scraping tool' }
          ],
          totalRepos: 15,
          totalStars: 80,
          contributions: 234,
          languages: ['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS']
        };
        
      case 'leetcode':
        return {
          totalSolved: 156,
          easySolved: 89,
          mediumSolved: 52,
          hardSolved: 15,
          contestRating: 1456,
          recentSubmissions: [
            { title: 'Two Sum', difficulty: 'Easy', status: 'Accepted' },
            { title: 'Binary Tree Inorder', difficulty: 'Medium', status: 'Accepted' },
            { title: 'Merge K Sorted Lists', difficulty: 'Hard', status: 'Accepted' }
          ]
        };
        
      case 'linkedin':
        return {
          connections: 342,
          experience: [
            { company: 'Tech Corp', position: 'Software Engineer', duration: '2023-Present' },
            { company: 'StartupXYZ', position: 'Frontend Developer', duration: '2022-2023' }
          ],
          skills: ['JavaScript', 'React', 'Node.js', 'Python'],
          endorsements: 28
        };
        
      case 'coursera':
        return {
          completedCourses: 8,
          certificates: [
            { title: 'Machine Learning', provider: 'Stanford University', completed: '2023' },
            { title: 'Full Stack Web Development', provider: 'Meta', completed: '2023' }
          ],
          totalHours: 120,
          currentCourses: 2
        };
        
      case 'codepen':
        return {
          pens: [
            { title: 'CSS Animation Demo', views: 1234, hearts: 45 },
            { title: 'JavaScript Game', views: 890, hearts: 32 },
            { title: 'SVG Art', views: 567, hearts: 28 }
          ],
          totalViews: 5432,
          totalHearts: 156,
          followers: 89
        };
        
      case 'behance':
        return {
          projects: [
            { title: 'Brand Identity Design', views: 2345, appreciations: 67 },
            { title: 'Mobile App UI', views: 1890, appreciations: 45 },
            { title: 'Website Redesign', views: 1234, appreciations: 38 }
          ],
          totalViews: 8765,
          totalAppreciations: 234,
          followers: 156
        };
        
      default:
        return {};
    }
  }

  renderIntegrationsPanel(containerId, userId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const integrationData = this.getIntegrationData(userId);
    
    const platformCards = Object.entries(this.platforms).map(([key, platform]) => {
      const isConnected = integrationData[key]?.connected;
      const data = integrationData[key]?.data;
      
      return `
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <i class="${platform.icon} text-2xl" style="color: ${platform.color}"></i>
              <div>
                <h3 class="font-semibold text-lg">${platform.name}</h3>
                <p class="text-sm text-gray-500">${platform.description}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${isConnected ? 
                `<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Connected</span>` :
                `<button onclick="integrations.showConnectModal('${key}')" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold">Connect</button>`
              }
            </div>
          </div>
          
          ${isConnected && data ? this.renderPlatformData(key, data) : ''}
          
          ${isConnected ? `
            <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span class="text-xs text-gray-500">Last synced: ${new Date(integrationData[key].lastSync).toLocaleDateString()}</span>
              <div class="flex gap-2">
                <button onclick="integrations.syncPlatform('${key}')" class="text-sm text-indigo-600 hover:text-indigo-800">Sync Now</button>
                <button onclick="integrations.disconnectPlatform('${key}')" class="text-sm text-red-600 hover:text-red-800">Disconnect</button>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${platformCards}
      </div>
    `;
  }

  renderPlatformData(platform, data) {
    switch (platform) {
      case 'github':
        return `
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-2xl font-bold text-gray-800">${data.totalRepos}</div>
              <div class="text-xs text-gray-500">Repositories</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-2xl font-bold text-yellow-600">${data.totalStars}</div>
              <div class="text-xs text-gray-500">Stars</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-2xl font-bold text-green-600">${data.contributions}</div>
              <div class="text-xs text-gray-500">Contributions</div>
            </div>
          </div>
        `;
        
      case 'leetcode':
        return `
          <div class="grid grid-cols-4 gap-2 text-center">
            <div class="bg-gray-50 p-2 rounded">
              <div class="text-lg font-bold text-gray-800">${data.totalSolved}</div>
              <div class="text-xs text-gray-500">Total</div>
            </div>
            <div class="bg-green-50 p-2 rounded">
              <div class="text-lg font-bold text-green-600">${data.easySolved}</div>
              <div class="text-xs text-gray-500">Easy</div>
            </div>
            <div class="bg-yellow-50 p-2 rounded">
              <div class="text-lg font-bold text-yellow-600">${data.mediumSolved}</div>
              <div class="text-xs text-gray-500">Medium</div>
            </div>
            <div class="bg-red-50 p-2 rounded">
              <div class="text-lg font-bold text-red-600">${data.hardSolved}</div>
              <div class="text-xs text-gray-500">Hard</div>
            </div>
          </div>
        `;
        
      case 'linkedin':
        return `
          <div class="flex justify-between items-center">
            <div class="text-center">
              <div class="text-xl font-bold text-blue-600">${data.connections}</div>
              <div class="text-xs text-gray-500">Connections</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-green-600">${data.endorsements}</div>
              <div class="text-xs text-gray-500">Endorsements</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-purple-600">${data.experience.length}</div>
              <div class="text-xs text-gray-500">Positions</div>
            </div>
          </div>
        `;
        
      default:
        return '<div class="text-sm text-gray-500">Data synced successfully</div>';
    }
  }

  showConnectModal(platform) {
    const platformInfo = this.platforms[platform];
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <i class="${platformInfo.icon}" style="color: ${platformInfo.color}"></i>
          Connect ${platformInfo.name}
        </h3>
        <p class="text-gray-600 mb-4">${platformInfo.description}</p>
        
        <form id="connectForm" class="space-y-4">
          ${platformInfo.fields.map(field => `
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                ${field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <input type="text" name="${field}" required 
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            </div>
          `).join('')}
          
          <div class="flex justify-end gap-3 mt-6">
            <button type="button" onclick="this.closest('.fixed').remove()" 
                    class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" 
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
              Connect
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#connectForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const credentials = Object.fromEntries(formData.entries());
      
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Connecting...';
      submitBtn.disabled = true;
      
      const result = await this.connectPlatform(dashboard.currentUser.id, platform, credentials);
      
      if (result.success) {
        modal.remove();
        this.renderIntegrationsPanel('integrationsContainer', dashboard.currentUser.id);
        dashboard.showNotification(`${platformInfo.name} connected successfully!`);
      } else {
        dashboard.showNotification(`Failed to connect ${platformInfo.name}: ${result.error}`, true);
        submitBtn.textContent = 'Connect';
        submitBtn.disabled = false;
      }
    });
  }

  async syncPlatform(platform) {
    const integrationData = this.getIntegrationData(dashboard.currentUser.id);
    if (!integrationData[platform]) return;
    
    dashboard.showNotification('Syncing data...', false);
    
    try {
      const newData = await this.fetchMockData(platform, integrationData[platform]);
      integrationData[platform].data = newData;
      integrationData[platform].lastSync = new Date().toISOString();
      
      this.saveIntegrationData(dashboard.currentUser.id, integrationData);
      this.renderIntegrationsPanel('integrationsContainer', dashboard.currentUser.id);
      dashboard.showNotification('Data synced successfully!');
    } catch (error) {
      dashboard.showNotification('Sync failed. Please try again.', true);
    }
  }

  disconnectPlatform(platform) {
    if (!confirm(`Are you sure you want to disconnect ${this.platforms[platform].name}?`)) return;
    
    const integrationData = this.getIntegrationData(dashboard.currentUser.id);
    delete integrationData[platform];
    
    this.saveIntegrationData(dashboard.currentUser.id, integrationData);
    this.renderIntegrationsPanel('integrationsContainer', dashboard.currentUser.id);
    dashboard.showNotification(`${this.platforms[platform].name} disconnected`);
  }
}
// Dashboard functionality with user authentication
class CareerNestDashboard {
  constructor() {
    this.currentUser = null;
    this.themeManager = null;
    this.skillMapper = null;
    this.gamificationSystem = null;
    this.integrations = null;
    this.init();
  }

  init() {
    // Check authentication
    const savedUser = localStorage.getItem('cn_current_user');
    if (!savedUser) {
      console.log('No user session found, redirecting to login page.');
      window.location.href = 'index.html';
      return;
    }

    try {
      console.log('User session found. Initializing dashboard...');
      this.currentUser = JSON.parse(savedUser);
      
      // Initialize systems
      this.themeManager = new ThemeManager();
      this.skillMapper = new SkillMapper();
      this.gamificationSystem = new GamificationSystem();
      this.integrations = new PlatformIntegrations();
      
      this.setupUserInterface();
      this.initializeData();
      this.setupEventListeners();
      this.renderAll();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      localStorage.removeItem('cn_current_user');
      window.location.href = 'index.html';
    }
  }

  setupUserInterface() {
    // Display user name in sidebar
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) {
      userNameDisplay.textContent = this.currentUser.name || 'User';
    }
    
    // Display welcome name
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) {
      welcomeName.textContent = this.currentUser.name || 'User';
    }
  }

  getUserKey(baseKey) {
    return `${baseKey}_${this.currentUser.id}`;
  }

  initializeData() {
    // Initialize user-specific data keys
    this.KEY_PROFILE = this.getUserKey('mc_profile_v6');
    this.KEY_PROJECTS = this.getUserKey('mc_projects_v5');
    this.KEY_SKILLS = this.getUserKey('mc_skills_v5');
    this.KEY_CERTS = this.getUserKey('mc_certs_v5');
    this.KEY_EDU = this.getUserKey('mc_edu_v5');
    this.KEY_INTERNS = this.getUserKey('mc_interns_v2');
    this.KEY_SOCIAL = this.getUserKey('mc_social_v2');
    this.KEY_PREF = this.getUserKey('mc_prefs_v4');

    // Load user data
    this.profile = this.load(this.KEY_PROFILE, this.currentUser.profile || {
      name: this.currentUser.name || '',
      email: this.currentUser.email || '',
      phone: '',
      bio: '',
      photo: ''
    });
    
    this.projects = this.load(this.KEY_PROJECTS, []);
    this.skills = this.load(this.KEY_SKILLS, []);
    this.certs = this.load(this.KEY_CERTS, []);
    this.edu = this.load(this.KEY_EDU, []);
    this.interns = this.load(this.KEY_INTERNS, []);
    this.social = this.load(this.KEY_SOCIAL, []);

    const defaultSections = {profile:true, skills:true, projects:true, internships:true, certificates:true, education:true, social:true};
    const defaultOrder = ['profile', 'skills', 'projects', 'internships', 'certificates', 'education', 'social'];
    
    this.prefs = this.load(this.KEY_PREF, {
      sections: defaultSections,
      order: defaultOrder,
      theme: ['#6366f1', '#4338ca'],
      template: 'classic'
    });

    // Ensure all sections are present
    defaultOrder.forEach(sec => {
      if (this.prefs.sections[sec] === undefined) this.prefs.sections[sec] = true;
    });
    if (this.prefs.order.length !== defaultOrder.length) this.prefs.order = defaultOrder;
  }

  load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  setupEventListeners() {
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(link.dataset.target);
      });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('cn_current_user');
        window.location.href = 'index.html';
      }
    });

    // Forms
    this.setupFormHandlers();
    this.setupCustomizeModal();
    this.setupExportHandlers();
  }

  navigate(pageId) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('bg-white/20');
    });
    document.querySelector(`[data-target="${pageId}"]`).classList.add('bg-white/20');

    // Show page
    document.querySelectorAll('section').forEach(section => {
      section.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
    
    // Render specific page content
    this.renderPageContent(pageId);

    // Update URL
    history.replaceState(null, '', '#' + pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  renderPageContent(pageId) {
    switch (pageId) {
      case 'analytics':
        this.renderAnalytics();
        break;
      case 'integrations':
        this.integrations.renderIntegrationsPanel('integrationsContainer', this.currentUser.id);
        break;
      case 'achievements':
        this.renderAchievements();
        break;
    }
  }
  
  renderAnalytics() {
    // Generate skill map
    const skillMap = this.skillMapper.generateSkillMap(this.skills, this.projects, this.certs, this.interns);
    const radarData = this.skillMapper.generateRadarChartData(skillMap);
    
    // Render radar chart
    this.skillMapper.renderSkillRadarChart('skillRadarChart', radarData);
    
    // Render skill breakdown
    const skillBreakdown = document.getElementById('skillBreakdown');
    if (skillBreakdown) {
      skillBreakdown.innerHTML = radarData.map(item => `
        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span class="text-sm font-medium">${item.category}</span>
          <span class="text-sm text-indigo-600 font-semibold">${item.value}%</span>
        </div>
      `).join('');
    }
    
    // Render progress timeline
    this.renderProgressTimeline();
    
    // Render detailed stats
    this.renderDetailedStats(skillMap);
    
    // Render project pie chart
    const projectTechs = this.projects.flatMap(p => this.skillMapper.extractSkillsFromText(p.desc + ' ' + p.title));
    const techCount = {};
    projectTechs.forEach(tech => techCount[tech] = (techCount[tech] || 0) + 1);
    const pieData = Object.entries(techCount).map(([key, value]) => ({ category: key, value }));
    const pieChartContainer = document.getElementById('projectPieChart');
    if (pieChartContainer) {
      this.skillMapper.renderPieChart('projectPieChart', pieData);
    }

    // Render certificates bar chart
    const certsByIssuer = {};
    this.certs.forEach(c => certsByIssuer[c.issuer] = (certsByIssuer[c.issuer] || 0) + 1);
    const barData = Object.entries(certsByIssuer).map(([key, value]) => ({ tech: key, count: value }));
    const barChartContainer = document.getElementById('certificateBarChart');
    if (barChartContainer) {
      this.skillMapper.renderBarChart('certificateBarChart', barData);
    }
  }
  
  renderProgressTimeline() {
    const timeline = document.getElementById('progressTimeline');
    if (!timeline) return;
    
    const events = [
      { date: 'Today', event: 'Profile Updated', type: 'profile' },
      { date: 'This Week', event: `${this.projects.length} Projects Added`, type: 'project' },
      { date: 'This Month', event: `${this.skills.length} Skills Mastered`, type: 'skill' },
      { date: 'Recent', event: `${this.certs.length} Certificates Earned`, type: 'cert' }
    ];
    
    timeline.innerHTML = events.map(event => `
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div class="w-3 h-3 bg-indigo-500 rounded-full"></div>
        <div class="flex-1">
          <div class="font-semibold text-sm">${event.event}</div>
          <div class="text-xs text-gray-500">${event.date}</div>
        </div>
      </div>
    `).join('');
  }
  
  renderDetailedStats(skillMap) {
    // Skill categories
    const skillCategories = document.getElementById('skillCategories');
    if (skillCategories) {
      skillCategories.innerHTML = Object.entries(skillMap).map(([category, data]) => `
        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span class="text-sm">${category}</span>
          <span class="text-sm font-semibold">${data.count} skills</span>
        </div>
      `).join('');
    }
    
    // Project technologies
    const projectTech = document.getElementById('projectTechnologies');
    if (projectTech) {
      const techs = this.projects.flatMap(p => this.skillMapper.extractSkillsFromText(p.desc + ' ' + p.title));
      const techCount = {};
      techs.forEach(tech => techCount[tech] = (techCount[tech] || 0) + 1);
      
      projectTech.innerHTML = Object.entries(techCount).slice(0, 5).map(([tech, count]) => `
        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span class="text-sm">${tech}</span>
          <span class="text-sm font-semibold">${count} projects</span>
        </div>
      `).join('');
    }
    
    // Achievement summary
    const achievementSummary = document.getElementById('achievementSummary');
    if (achievementSummary) {
      const gameData = this.gamificationSystem.getGameData(this.currentUser.id);
      achievementSummary.innerHTML = `
        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span class="text-sm">Total XP</span>
          <span class="text-sm font-semibold">${gameData.xp}</span>
        </div>
        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span class="text-sm">Current Level</span>
          <span class="text-sm font-semibold">${gameData.level}</span>
        </div>
        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span class="text-sm">Badges Earned</span>
          <span class="text-sm font-semibold">${gameData.badges.length}</span>
        </div>
      `;
    }
  }
  
  renderAchievements() {
    const gameData = this.gamificationSystem.getGameData(this.currentUser.id);
    const currentLevel = this.gamificationSystem.getCurrentLevel(gameData.xp);
    const nextLevel = this.gamificationSystem.getNextLevel(currentLevel);
    
    // Render level progress
    this.gamificationSystem.renderGameStats('levelProgress', gameData, currentLevel, nextLevel);
    
    // Render badges
    this.gamificationSystem.renderBadges('badgesContainer', gameData.badges);
  }

  setupFormHandlers() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.profile.name = document.getElementById('name').value.trim();
      this.profile.email = document.getElementById('email').value.trim();
      this.profile.phone = document.getElementById('phone').value.trim();
      this.profile.bio = document.getElementById('bio').value.trim();
      this.save(this.KEY_PROFILE, this.profile);
      this.updateGameData();
      this.renderAll();
      this.showNotification('Profile saved successfully!');
    });

    // Photo upload
    document.getElementById('photoUpload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.profile.photo = event.target.result;
          this.save(this.KEY_PROFILE, this.profile);
          this.updatePhotoPreview();
          this.updateGameData();
          this.renderAll();
        };
        reader.readAsDataURL(file);
      }
    });

    // Skills form
    const skillsForm = document.getElementById('skillsForm');
    const skillLevel = document.getElementById('skillLevel');
    const skillLevelVal = document.getElementById('skillLevelVal');
    
    skillLevel.addEventListener('input', () => {
      skillLevelVal.textContent = skillLevel.value + '%';
    });

    skillsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('skillName').value.trim();
      const level = parseInt(document.getElementById('skillLevel').value || 0);
      
      if (!name) {
        this.showNotification('Please enter a skill name', true);
        return;
      }
      
      this.skills.unshift({name, level});
      this.save(this.KEY_SKILLS, this.skills);
      document.getElementById('skillName').value = '';
      document.getElementById('skillLevel').value = '75';
      skillLevelVal.textContent = '75%';
      this.updateGameData();
      this.renderAll();
    });

    // Projects form
    document.getElementById('projectsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('projectTitle').value.trim();
      const link = document.getElementById('projectLink').value.trim();
      const desc = document.getElementById('projectDesc').value.trim();
      
      if (!title) {
        this.showNotification('Please enter a project title', true);
        return;
      }
      
      this.projects.unshift({title, link, desc});
      this.save(this.KEY_PROJECTS, this.projects);
      this.clearForm('projectsForm');
      this.updateGameData();
      this.renderAll();
    });

    // Similar handlers for other forms...
    this.setupOtherFormHandlers();
    this.setupClearButtons();
  }

  setupOtherFormHandlers() {
    // Internships
    document.getElementById('internForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const company = document.getElementById('internCompany').value.trim();
      const role = document.getElementById('internRole').value.trim();
      const duration = document.getElementById('internDuration').value.trim();
      const desc = document.getElementById('internDesc').value.trim();
      
      if (!company || !role) {
        this.showNotification('Please enter company and role', true);
        return;
      }
      
      this.interns.unshift({company, role, duration, desc});
      this.save(this.KEY_INTERNS, this.interns);
      this.clearForm('internForm');
      this.updateGameData();
      this.renderAll();
    });

    // Certificates
    document.getElementById('certForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('certName').value.trim();
      const issuer = document.getElementById('certIssuer').value.trim();
      const link = document.getElementById('certLink').value.trim();
      
      if (!title) {
        this.showNotification('Please enter certificate title', true);
        return;
      }
      
      this.certs.unshift({title, issuer, link});
      this.save(this.KEY_CERTS, this.certs);
      this.clearForm('certForm');
      this.updateGameData();
      this.renderAll();
    });

    // Education
    document.getElementById('eduForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const institute = document.getElementById('eduInstitute').value.trim();
      const degree = document.getElementById('eduDegree').value.trim();
      const year = document.getElementById('eduYear').value.trim();
      
      if (!institute) {
        this.showNotification('Please enter institution name', true);
        return;
      }
      
      this.edu.unshift({institute, degree, year});
      this.save(this.KEY_EDU, this.edu);
      this.clearForm('eduForm');
      this.updateGameData();
      this.renderAll();
    });

    // Social Media
    document.getElementById('socialForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const platform = document.getElementById('socialPlatform').value.trim();
      const link = document.getElementById('socialLink').value.trim();
      
      if (!platform || !link) {
        this.showNotification('Please enter platform and link', true);
        return;
      }
      
      this.social.unshift({platform, link});
      this.save(this.KEY_SOCIAL, this.social);
      this.clearForm('socialForm');
      this.updateGameData();
      this.renderAll();
    });

    // Load sample data
    document.getElementById('loadSample').addEventListener('click', () => {
      this.loadSampleData();
    });
  }
  
  updateGameData() {
    // Calculate XP and update game data
    const gameData = this.gamificationSystem.getGameData(this.currentUser.id);
    const oldLevel = gameData.level;
    const oldBadges = [...gameData.badges];
    
    // Calculate new XP
    gameData.xp = this.gamificationSystem.calculateXP(
      this.profile, this.skills, this.projects, this.certs, 
      this.interns, this.social, this.edu
    );
    
    // Update level
    const currentLevel = this.gamificationSystem.getCurrentLevel(gameData.xp);
    gameData.level = currentLevel.level;
    
    // Update streak
    this.gamificationSystem.updateStreak(gameData);
    
    // Check for new badges
    const newBadges = this.gamificationSystem.checkBadges(
      this.profile, this.skills, this.projects, this.certs, 
      this.interns, this.social, gameData
    );
    
    // Add new badges
    newBadges.forEach(badge => {
      if (!gameData.badges.includes(badge)) {
        gameData.badges.push(badge);
        this.gamificationSystem.showBadgeNotification(badge);
      }
    });
    
    // Check for level up
    if (gameData.level > oldLevel) {
      this.gamificationSystem.showLevelUpNotification(currentLevel);
    }
    
    // Save game data
    this.gamificationSystem.saveGameData(this.currentUser.id, gameData);
    
    // Update snapshot level
    const snapLevel = document.getElementById('snapLevel');
    if (snapLevel) {
      snapLevel.textContent = `Level ${gameData.level} (${currentLevel.name})`;
    }
  }

  setupClearButtons() {
    const clearButtons = [
      { id: 'clearProfile', action: () => this.clearProfile() },
      { id: 'clearSkills', action: () => this.clearData('skills', this.KEY_SKILLS) },
      { id: 'clearProjects', action: () => this.clearData('projects', this.KEY_PROJECTS) },
      { id: 'clearInterns', action: () => this.clearData('interns', this.KEY_INTERNS) },
      { id: 'clearCerts', action: () => this.clearData('certs', this.KEY_CERTS) },
      { id: 'clearEdu', action: () => this.clearData('edu', this.KEY_EDU) },
      { id: 'clearSocial', action: () => this.clearData('social', this.KEY_SOCIAL) }
    ];

    clearButtons.forEach(({id, action}) => {
      document.getElementById(id).addEventListener('click', action);
    });
  }

  clearProfile() {
    if (!confirm('Clear all profile data?')) return;
    this.profile = {
      name: this.currentUser.name || '',
      email: this.currentUser.email || '',
      phone: '',
      bio: '',
      photo: ''
    };
    this.save(this.KEY_PROFILE, this.profile);
    this.updateFormFields();
    this.updateGameData();
    this.renderAll();
  }

  clearData(type, key) {
    if (!confirm(`Clear all ${type}?`)) return;
    this[type] = [];
    this.save(key, this[type]);
    this.updateGameData();
    this.renderAll();
  }

  clearForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      if (input.type !== 'submit' && input.type !== 'button') {
        input.value = '';
      }
    });
  }

  updateFormFields() {
    document.getElementById('name').value = this.profile.name || '';
    document.getElementById('email').value = this.profile.email || '';
    document.getElementById('phone').value = this.profile.phone || '';
    document.getElementById('bio').value = this.profile.bio || '';
    this.updatePhotoPreview();
  }

  updatePhotoPreview() {
    const preview = document.getElementById('photoPreview');
    const placeholder = document.getElementById('photoPlaceholder');
    
    if (this.profile.photo) {
      preview.src = this.profile.photo;
      preview.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      preview.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }
  }

  setupCustomizeModal() {
    const customizeBtn = document.getElementById('customizeBtn');
    const customizeBackdrop = document.getElementById('customizeBackdrop');
    const closeCustomize = document.getElementById('closeCustomize');
    const applyCustomize = document.getElementById('applyCustomize');

    customizeBtn.addEventListener('click', () => {
      customizeBackdrop.classList.remove('hidden');
      this.updateCustomizeModal();
    });

    closeCustomize.addEventListener('click', () => {
      customizeBackdrop.classList.add('hidden');
    });

    applyCustomize.addEventListener('click', () => {
      this.applyCustomization();
      customizeBackdrop.classList.add('hidden');
    });
  }

  updateCustomizeModal() {
    document.querySelectorAll('.rs-cb').forEach(cb => {
      cb.checked = this.prefs.sections[cb.dataset.section];
    });
    
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
      radio.checked = radio.value === this.prefs.theme.join('|');
    });
    
    document.querySelectorAll('input[name="template"]').forEach(radio => {
      radio.checked = radio.value === this.prefs.template;
    });
  }

  applyCustomization() {
    document.querySelectorAll('.rs-cb').forEach(cb => {
      this.prefs.sections[cb.dataset.section] = cb.checked;
    });
    
    const selectedTheme = document.querySelector('input[name="theme"]:checked').value.split('|');
    this.prefs.theme = selectedTheme;
    
    this.prefs.template = document.querySelector('input[name="template"]:checked').value;
    
    this.save(this.KEY_PREF, this.prefs);
    this.renderAll();
  }

  setupExportHandlers() {
    const exportBtn = document.getElementById('exportBtn');
    const downloadResume = document.getElementById('downloadResume');
    
    const exportFunction = () => {
      this.renderResumePreview();
      const opt = {
        margin: 0.3,
        filename: `${(this.profile.name || 'resume').replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      const content = document.querySelector('#resumePreview .resume-page');
      html2pdf().from(content).set(opt).save();
    };

    exportBtn.addEventListener('click', exportFunction);
    downloadResume.addEventListener('click', exportFunction);
  }

  loadSampleData() {
    if (!confirm('This will replace your current data with sample data. Continue?')) return;

    const sampleData = {
      profile: {
        name: this.currentUser.name || "John Doe",
        email: this.currentUser.email || "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        bio: "Passionate software developer with expertise in full-stack web development and a strong foundation in modern technologies.",
        photo: ""
      },
      skills: [
        { name: "JavaScript", level: 90 },
        { name: "React", level: 85 },
        { name: "Node.js", level: 80 },
        { name: "Python", level: 75 },
        { name: "HTML/CSS", level: 95 },
        { name: "MongoDB", level: 70 }
      ],
      projects: [
        {
          title: "E-commerce Platform",
          link: "https://github.com/johndoe/ecommerce",
          desc: "Full-stack e-commerce application built with React, Node.js, and MongoDB. Features include user authentication, payment processing, and admin dashboard."
        },
        {
          title: "Task Management App",
          link: "https://taskmanager-demo.com",
          desc: "Responsive web application for team collaboration and task tracking. Built with React and Firebase, featuring real-time updates and drag-and-drop functionality."
        },
        {
          title: "Weather Dashboard",
          link: "",
          desc: "Interactive weather application with location-based forecasts, built using vanilla JavaScript and OpenWeather API."
        }
      ],
      internships: [
        {
          company: "Tech Solutions Inc.",
          role: "Software Developer Intern",
          duration: "Jun 2023 – Aug 2023",
          desc: "Developed and maintained features for the company's flagship product. Collaborated with senior developers on code reviews and participated in agile development processes."
        },
        {
          company: "StartupXYZ",
          role: "Frontend Developer Intern",
          duration: "Jan 2023 – May 2023",
          desc: "Built responsive user interfaces using React and implemented modern design systems. Improved application performance by 30% through code optimization."
        }
      ],
      certificates: [
        { title: "React Developer Certification", issuer: "Meta", link: "https://coursera.org/cert/react123" },
        { title: "AWS Cloud Practitioner", issuer: "Amazon Web Services", link: "" },
        { title: "JavaScript Algorithms and Data Structures", issuer: "freeCodeCamp", link: "https://freecodecamp.org/cert/js456" },
        { title: "Full Stack Web Development", issuer: "Udemy", link: "" }
      ],
      education: [
        { institute: "State University", degree: "B.Sc. Computer Science", year: "2020-2024" },
        { institute: "Community College", degree: "Associate in Computer Programming", year: "2018-2020" }
      ],
      social: [
        { platform: "LinkedIn", link: "https://linkedin.com/in/johndoe" },
        { platform: "GitHub", link: "https://github.com/johndoe" },
        { platform: "Portfolio", link: "https://johndoe.dev" },
        { platform: "LeetCode", link: "https://leetcode.com/johndoe" }
      ]
    };

    this.profile = sampleData.profile;
    this.skills = sampleData.skills;
    this.projects = sampleData.projects;
    this.interns = sampleData.internships;
    this.certs = sampleData.certificates;
    this.edu = sampleData.education;
    this.social = sampleData.social;

    // Save all data
    this.save(this.KEY_PROFILE, this.profile);
    this.save(this.KEY_SKILLS, this.skills);
    this.save(this.KEY_PROJECTS, this.projects);
    this.save(this.KEY_INTERNS, this.interns);
    this.save(this.KEY_CERTS, this.certs);
    this.save(this.KEY_EDU, this.edu);
    this.save(this.KEY_SOCIAL, this.social);

    this.updateFormFields();
    this.updateGameData();
    this.renderAll();
    this.showNotification('Sample data loaded successfully!');
    this.navigate('home');
  }

  renderAll() {
    this.renderDashboard();
    this.renderLists();
    this.renderResumePreview();
    this.renderRecentAchievements();
  }
  
  renderRecentAchievements() {
    const container = document.getElementById('recentAchievements');
    if (!container) return;
    
    const gameData = this.gamificationSystem.getGameData(this.currentUser.id);
    const recentBadges = gameData.badges.slice(-3);
    
    if (recentBadges.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center col-span-3">Complete your profile to start earning achievements!</p>';
      return;
    }
    
    container.innerHTML = recentBadges.map(badgeId => {
      const badge = this.gamificationSystem.badges[badgeId];
      return `
        <div class="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200 text-center hover:scale-105 transition-transform duration-200">
          <div class="text-3xl mb-2">${badge.icon}</div>
          <h4 class="font-semibold text-sm text-gray-800">${badge.name}</h4>
          <p class="text-xs text-gray-600 mt-1">${badge.description}</p>
        </div>
      `;
    }).join('');
  }

  renderDashboard() {
    // Update game stats
    const gameData = this.gamificationSystem.getGameData(this.currentUser.id);
    const currentLevel = this.gamificationSystem.getCurrentLevel(gameData.xp);
    const nextLevel = this.gamificationSystem.getNextLevel(currentLevel);
    
    // Render game stats in welcome section
    this.gamificationSystem.renderGameStats('gameStatsContainer', gameData, currentLevel, nextLevel);
    
    // Update counts
    document.getElementById('projectCount').textContent = this.projects.length;
    document.getElementById('skillCount').textContent = this.skills.length;
    document.getElementById('certCount').textContent = this.certs.length;

    // Update snapshot
    document.getElementById('snapName').textContent = this.profile.name || '—';
    document.getElementById('snapLevel').textContent = `Level ${gameData.level} (${currentLevel.name})`;
    document.getElementById('snapProjCount').textContent = this.projects.length;
    document.getElementById('snapSkill').textContent = (this.skills[0] && this.skills[0].name) || '—';

    // Update snapshot photo
    const snapPhoto = document.getElementById('snapPhoto');
    if (this.profile.photo) {
      snapPhoto.src = this.profile.photo;
      snapPhoto.classList.remove('hidden');
    } else {
      snapPhoto.classList.add('hidden');
    }

    // Render recent projects
    const projectList = document.getElementById('projectList');
    projectList.innerHTML = '';
    this.projects.slice(-5).reverse().forEach(p => {
      const li = document.createElement('li');
      li.className = 'border-b last:border-0 border-gray-100 py-2 flex items-center gap-2';
      li.innerHTML = `
        <i class="fas fa-folder text-indigo-500 text-xs"></i>
        <span class="text-sm">${p.title}</span>
      `;
      projectList.appendChild(li);
    });

    // Render top skills
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = '';
    this.skills.slice(0, 6).forEach(s => {
      const pill = document.createElement('div');
      pill.className = 'flex items-center p-3 rounded-xl bg-gray-50 shadow-sm';
      pill.innerHTML = `
        <div class="font-semibold flex-1 text-sm">${s.name}</div>
        <div class="skill-progress-bar h-2 bg-gray-200 rounded-full w-24 ml-4">
          <div style="width: ${s.level || 70}%" class="h-full rounded-full"></div>
        </div>
      `;
      skillsContainer.appendChild(pill);
    });

    // Render certificates
    const certContainer = document.getElementById('certContainer');
    certContainer.innerHTML = '';
    this.certs.slice(0, 6).forEach(c => {
      const div = document.createElement('div');
      div.className = 'p-3 bg-gray-50 rounded-lg shadow-sm';
      div.innerHTML = `
        <div class="flex items-start gap-2">
          <i class="fas fa-certificate text-emerald-500 text-xs mt-1"></i>
          <div>
            <strong class="text-sm block">${c.title}</strong>
            <p class="text-xs text-slate-500">${c.issuer || ''}</p>
          </div>
        </div>
      `;
      certContainer.appendChild(div);
    });
  }

  renderLists() {
    const itemClasses = 'bg-white p-4 rounded-lg shadow-sm flex flex-col gap-2 relative border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105';
    const deleteButton = (cb) => `<button type="button" class="absolute top-2 right-2 text-sm text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50" onclick="${cb}" title="Delete"><i class="fas fa-trash text-xs"></i></button>`;

    // Projects
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';
    this.projects.slice().reverse().forEach((p, idx) => {
      const node = document.createElement('div');
      node.className = itemClasses;
      node.innerHTML = `
        <div>
          <div class="flex items-start gap-2 mb-2">
            <i class="fas fa-folder-open text-indigo-500 mt-1"></i>
            <strong class="text-base">${p.title}</strong>
          </div>
          <p class="text-sm text-slate-600 mb-2">${p.desc || ''}</p>
          ${p.link ? `<a href="${p.link}" target="_blank" class="text-sm text-blue-500 hover:underline flex items-center gap-1"><i class="fas fa-external-link-alt text-xs"></i>${p.link}</a>` : ''}
        </div>
        ${deleteButton(`dashboard.handleDelete('projects', ${this.projects.length - 1 - idx})`)}
      `;
      projectsList.appendChild(node);
    });

    // Skills
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = '';
    this.skills.slice().reverse().forEach((s, idx) => {
      const node = document.createElement('div');
      node.className = itemClasses;
      node.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <i class="fas fa-cog text-sky-500"></i>
              <strong class="text-base">${s.name}</strong>
            </div>
            <span class="text-sm font-semibold text-indigo-600">${s.level || 0}%</span>
          </div>
          <div class="skill-progress-bar h-2 bg-gray-200 rounded-full">
            <div style="width: ${s.level || 0}%" class="h-full rounded-full"></div>
          </div>
        </div>
        ${deleteButton(`dashboard.handleDelete('skills', ${this.skills.length - 1 - idx})`)}
      `;
      skillsList.appendChild(node);
    });

    // Continue with other lists...
    this.renderOtherLists(itemClasses, deleteButton);
  }

  renderOtherLists(itemClasses, deleteButton) {
    // Certificates
    const certsList = document.getElementById('certsList');
    certsList.innerHTML = '';
    this.certs.slice().reverse().forEach((c, idx) => {
      const node = document.createElement('div');
      node.className = itemClasses;
      node.innerHTML = `
        <div>
          <div class="flex items-start gap-2 mb-2">
            <i class="fas fa-certificate text-emerald-500 mt-1"></i>
            <div>
              <strong class="text-base block">${c.title}</strong>
              <p class="text-sm text-slate-600">${c.issuer || ''}</p>
            </div>
          </div>
          ${c.link ? `<a href="${c.link}" target="_blank" class="text-sm text-blue-500 hover:underline flex items-center gap-1"><i class="fas fa-external-link-alt text-xs"></i>View Certificate</a>` : ''}
        </div>
        ${deleteButton(`dashboard.handleDelete('certs', ${this.certs.length - 1 - idx})`)}
      `;
      certsList.appendChild(node);
    });

    // Education
    const eduList = document.getElementById('eduList');
    eduList.innerHTML = '';
    this.edu.slice().reverse().forEach((e, idx) => {
      const node = document.createElement('div');
      node.className = itemClasses;
      node.innerHTML = `
        <div>
          <div class="flex items-start gap-2 mb-2">
            <i class="fas fa-graduation-cap text-purple-500 mt-1"></i>
            <div>
              <strong class="text-base block">${e.institute}</strong>
              <p class="text-sm text-slate-600">${e.degree || ''} — ${e.year || ''}</p>
            </div>
          </div>
        </div>
        ${deleteButton(`dashboard.handleDelete('edu', ${this.edu.length - 1 - idx})`)}
      `;
      eduList.appendChild(node);
    });

    // Internships
    const internsList = document.getElementById('internsList');
    internsList.innerHTML = '';
    this.interns.slice().reverse().forEach((it, idx) => {
      const node = document.createElement('div');
      node.className = itemClasses;
      node.innerHTML = `
        <div>
          <div class="flex items-start gap-2 mb-2">
            <i class="fas fa-briefcase text-orange-500 mt-1"></i>
            <div>
              <strong class="text-base block">${it.company}</strong>
              <p class="text-sm text-slate-600">${it.role || ''}</p>
              <p class="text-sm text-slate-500">${it.duration || ''}</p>
            </div>
          </div>
          <p class="text-sm text-slate-600">${it.desc || ''}</p>
        </div>
        ${deleteButton(`dashboard.handleDelete('interns', ${this.interns.length - 1 - idx})`)}
      `;
      internsList.appendChild(node);
    });

    // Social Media
    const socialList = document.getElementById('socialList');
    socialList.innerHTML = '';
    this.social.slice().reverse().forEach((s, idx) => {
      const node = document.createElement('div');
      node.className = itemClasses;
      node.innerHTML = `
        <div>
          <div class="flex items-start gap-2 mb-2">
            <i class="fas fa-link text-blue-500 mt-1"></i>
            <div>
              <strong class="text-base block">${s.platform}</strong>
              <a href="${s.link}" target="_blank" class="text-sm text-blue-500 hover:underline flex items-center gap-1">
                <i class="fas fa-external-link-alt text-xs"></i>${s.link}
              </a>
            </div>
          </div>
        </div>
        ${deleteButton(`dashboard.handleDelete('social', ${this.social.length - 1 - idx})`)}
      `;
      socialList.appendChild(node);
    });
  }

  handleDelete(section, index) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    switch (section) {
      case 'projects':
        this.projects.splice(index, 1);
        this.save(this.KEY_PROJECTS, this.projects);
        break;
      case 'skills':
        this.skills.splice(index, 1);
        this.save(this.KEY_SKILLS, this.skills);
        break;
      case 'certs':
        this.certs.splice(index, 1);
        this.save(this.KEY_CERTS, this.certs);
        break;
      case 'edu':
        this.edu.splice(index, 1);
        this.save(this.KEY_EDU, this.edu);
        break;
      case 'interns':
        this.interns.splice(index, 1);
        this.save(this.KEY_INTERNS, this.interns);
        break;
      case 'social':
        this.social.splice(index, 1);
        this.save(this.KEY_SOCIAL, this.social);
        break;
    }
    this.updateGameData();
    this.renderAll();
  }

  renderResumePreview() {
    const resumePreview = document.getElementById('resumePreview');
    resumePreview.innerHTML = this.generateResumeHTML(
      this.prefs.sections,
      this.prefs.order,
      this.prefs.theme,
      this.prefs.template
    );

    // Initialize Sortable.js for drag and drop
    const sortableElement = document.getElementById('sortable-resume');
    if (sortableElement) {
      new Sortable(sortableElement, {
        animation: 150,
        onEnd: (evt) => {
          const oldIndex = evt.oldIndex;
          const newIndex = evt.newIndex;
          const item = this.prefs.order.splice(oldIndex, 1)[0];
          this.prefs.order.splice(newIndex, 0, item);
          this.save(this.KEY_PREF, this.prefs);
          this.renderResumePreview();
        }
      });
    }
  }

  generateResumeHTML(selectedSections, order, theme, template) {
    const include = sec => selectedSections[sec];
    const [accent1, accent2] = theme;
    
    // Update CSS variables
    document.documentElement.style.setProperty('--brand-color', accent1);
    document.documentElement.style.setProperty('--brand-dark', accent2);

    const photoHtml = this.profile.photo ? 
      `<div class="w-24 h-24 flex-shrink-0">
        <img src="${this.profile.photo}" alt="Profile Photo" class="w-full h-full object-cover rounded-full shadow-lg border-4 border-white/20">
      </div>` : '';

    // Section templates
    const sectionMap = {
      profile: `<section data-id="profile" class="resume-section p-4 cursor-grab bg-white rounded-lg shadow-md mb-4">
                  <h3 class="resume-h text-lg font-bold uppercase tracking-wide text-indigo-600 pb-2 mb-2">Professional Summary</h3>
                  <div class="resume-item text-sm text-gray-700">${this.profile.bio || 'Add a professional summary to highlight your key qualifications and career objectives.'}</div>
                </section>`,
      
      skills: `<section data-id="skills" class="resume-section p-4 cursor-grab bg-white rounded-lg shadow-md mb-4">
                <h3 class="resume-h text-lg font-bold uppercase tracking-wide text-indigo-600 pb-2 mb-2"> Skills</h3>
                <div class="flex flex-wrap gap-2">
                  ${this.skills.length ? 
                    this.skills.map(s => `<span class='resume-pill text-xs font-semibold px-3 py-1 bg-gray-100 rounded-full border border-gray-200'>${s.name} (${s.level || 0}%)</span>`).join('') : 
                    '<div class="text-sm text-gray-500">No skills added yet</div>'
                  }
                </div>
              </section>`,
      
      projects: `<section data-id="projects" class="resume-section p-4 cursor-grab bg-white rounded-lg shadow-md mb-4">
                  <h3 class="resume-h text-lg font-bold uppercase tracking-wide text-indigo-600 pb-2 mb-2">Projects</h3>
                  ${this.projects.length ? 
                    this.projects.map(p => `
                      <div class='resume-item mb-3'>
                        <div class='text-base font-semibold'>${p.title}</div>
                        ${p.link ? `<div class='text-sm text-gray-600 mb-1'><a href="${p.link}" target="_blank" class="text-blue-500 hover:underline">${p.link}</a></div>` : ''}
                        <p class="text-sm text-gray-700">${p.desc || ''}</p>
                      </div>
                    `).join('') : 
                    '<div class="text-sm text-gray-500">No projects added yet</div>'
                  }
                </section>`,
      
      internships: `<section data-id="internships" class="resume-section p-4 cursor-grab bg-white rounded-lg shadow-md mb-4">
                      <h3 class="resume-h text-lg font-bold uppercase tracking-wide text-indigo-600 pb-2 mb-2">Work Experience</h3>
                      ${this.interns.length ? 
                        this.interns.map(it => `
                          <div class='resume-item mb-3'>
                            <div class='text-base font-semibold'>${it.company} — ${it.role || ''}</div>
                            <div class='text-sm text-gray-600 mb-1'>${it.duration || ''}</div>
                            <p class="text-sm text-gray-700">${it.desc || ''}</p>
                          </div>
                        `).join('') : 
                        '<div class="text-sm text-gray-500">No work experience added yet</div>'
                      }
                    </section>`,
      
      certificates: `<section data-id="certificates" class="resume-section p-4 cursor-grab bg-white rounded-lg shadow-md mb-4">
                      <h3 class="resume-h text-lg font-bold uppercase tracking-wide text-indigo-600 pb-2 mb-2">Certifications</h3>
                      <div>
                        ${this.certs.length ? 
                          this.certs.map(c => `
                            <div class='resume-item mb-2'>
                              <strong class="text-sm">${c.title}</strong>
                              <span class='text-xs text-gray-500'>${c.issuer ? ` • ${c.issuer}` : ''}</span>
                            </div>
                          `).join('') : 
                          '<div class="text-sm text-gray-500">No certifications added yet</div>'
                        }
                      </div>
                    </section>`,
      
      education: `<section data-id="education" class="resume-section p-4 cursor-grab bg-white rounded-lg shadow-md mb-4">
                    <h3 class="resume-h text-lg font-bold uppercase tracking-wide text-indigo-600 pb-2 mb-2">Education</h3>
                    ${this.edu.length ? 
                      this.edu.map(e => `
                        <div class='resume-item mb-2'>
                          <strong class="text-base">${e.institute}</strong>
                          <p class="text-sm text-gray-600">${e.degree || ''} — ${e.year || ''}</p>
                        </div>
                      `).join('') : 
                      '<div class="text-sm text-gray-500">No education added yet</div>'
                    }
                  </section>`,
      
      social: `<section data-id="social" class="resume-section p-4 cursor-grab bg-white rounded-lg shadow-md mb-4">
                <h3 class="resume-h text-lg font-bold uppercase tracking-wide text-indigo-600 pb-2 mb-2">Links & Profiles</h3>
                <div>
                  ${this.social.length ? 
                    this.social.map(s => `
                      <div class='resume-item text-sm mb-1'>
                        <a href="${s.link}" target="_blank" class="text-blue-500 hover:underline">${s.platform}: ${s.link}</a>
                      </div>
                    `).join('') : 
                    '<div class="text-sm text-gray-500">No social links added yet</div>'
                  }
                </div>
              </section>`
    };

    const filteredSections = order.filter(sec => include(sec)).map(sec => sectionMap[sec]).join('');

    if (template === 'modern') {
      return `
        <div class="resume-page p-8 bg-white rounded-xl shadow-lg">
          <header class="pb-6 mb-6 border-b border-gray-300">
            <h1 class="text-4xl font-extrabold brand-title text-indigo-800">${this.profile.name || 'Your Name'}</h1>
            <p class="text-lg text-slate-600 mt-1">${this.profile.bio || ''}</p>
            <div class="text-sm text-slate-600 mt-2 flex flex-wrap gap-4">
              ${this.profile.email ? `<p class="flex items-center gap-1"><i class="fas fa-envelope text-indigo-600"></i> ${this.profile.email}</p>` : ''}
              ${this.profile.phone ? `<p class="flex items-center gap-1"><i class="fas fa-phone text-indigo-600"></i> ${this.profile.phone}</p>` : ''}
              ${this.social.length ? this.social.map(s => `<a href="${s.link}" target="_blank" class="flex items-center gap-1 text-blue-500 hover:underline"><i class="fas fa-link text-indigo-600"></i> ${s.platform}</a>`).join('') : ''}
            </div>
          </header>
          <div id="sortable-resume" class="space-y-6">
            ${filteredSections}
          </div>
        </div>
      `;
    }
    
    // Classic template
    return `
      <div class="resume-page p-6 bg-white rounded-xl shadow-lg">
        <header class="flex flex-col md:flex-row md:items-start justify-between pb-4 mb-6 gap-4 border-b-4 border-indigo-600">
          <div class="flex-1">
            <h1 class="text-4xl font-extrabold brand-title text-indigo-800">${this.profile.name || 'Your Name'}</h1>
            <p class="text-lg text-slate-600 mt-1">${this.profile.bio || ''}</p>
            <div class="text-sm text-slate-600 mt-4">
              ${this.profile.email ? `<p class="mb-1 flex items-center gap-2"><i class="fas fa-envelope text-indigo-600"></i> ${this.profile.email}</p>` : ''}
              ${this.profile.phone ? `<p class="flex items-center gap-2"><i class="fas fa-phone text-indigo-600"></i> ${this.profile.phone}</p>` : ''}
            </div>
          </div>
          ${photoHtml}
        </header>
        <div id="sortable-resume" class="space-y-4">
          ${filteredSections}
        </div>
      </div>
    `;
  }

  showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 transform transition-all duration-300 ${isError ? 'bg-red-500' : 'bg-green-500'}`;
    notification.innerHTML = `
      <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-2"></i>
      ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
      notification.remove();
      }, 300);
    }, 4000);
  }
}

// Initialize dashboard
const dashboard = new CareerNestDashboard();

// Make navigate function global for button clicks
window.navigate = (pageId) => dashboard.navigate(pageId);

// Initialize page based on URL hash
if (window.location.hash) {
  const pageId = window.location.hash.substring(1);
  dashboard.navigate(pageId);
} else {
  dashboard.navigate('home');
}
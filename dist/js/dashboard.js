// Dashboard functionality with user authentication
class CareerNestDashboard {
  constructor() {
    this.currentUser = null;
    this.skillMapper = new SkillMapper();
    this.gamification = new GamificationSystem();
    this.themeManager = new ThemeManager();
    this.init();
  }

  init() {
    // Check authentication
    const savedUser = localStorage.getItem('cn_current_user');
    if (!savedUser) {
      window.location.href = 'index.html';
      return;
    }

    try {
      this.currentUser = JSON.parse(savedUser);
      this.setupUserInterface();
      this.initializeData();
      this.setupEventListeners();
      this.renderAll();
      
      // Initialize new components
      this.integrations = new PlatformIntegrations();
      this.updateGameData();
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
    this.setupNewSectionHandlers();
  }

  setupNewSectionHandlers() {
    // Analytics refresh
    const analyticsRefresh = () => {
      if (document.getElementById('analytics').classList.contains('hidden')) return;
      this.renderAnalytics();
    };
    
    // Refresh analytics when navigating to it
    const originalNavigate = this.navigate;
    this.navigate = (pageId) => {
      originalNavigate.call(this, pageId);
      if (pageId === 'analytics') {
        setTimeout(analyticsRefresh, 100);
      } else if (pageId === 'integrations') {
        this.integrations.renderIntegrationsPanel('integrationsContainer', this.currentUser.id);
      } else if (pageId === 'achievements') {
        this.renderAchievements();
      }
    };
  }

  navigate(pageId) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('bg-white/10');
    });
    document.querySelector(`[data-target="${pageId}"]`).classList.add('bg-white/10');

    // Show page
    document.querySelectorAll('section').forEach(section => {
      section.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');

    // Update URL
    history.replaceState(null, '', '#' + pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      this.renderAll();
    });

    // Load sample data
    document.getElementById('loadSample').addEventListener('click', () => {
      this.loadSampleData();
    });
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
    this.renderAll();
  }

  clearData(type, key) {
    if (!confirm(`Clear all ${type}?`)) return;
    this[type] = [];
    this.save(key, this[type]);
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
    this.renderAll();
    this.showNotification('Sample data loaded successfully!');
    this.navigate('home');
  }

  renderAll() {
    this.renderDashboard();
    this.renderLists();
    this.renderResumePreview();
    this.updateGameData();
  }

  updateGameData() {
    // Calculate current XP and level
    const currentXP = this.gamification.calculateXP(
      this.profile, this.skills, this.projects, this.certs, 
      this.interns, this.social, this.edu
    );
    
    let gameData = this.gamification.getGameData(this.currentUser.id);
    const oldLevel = gameData.level;
    
    gameData.xp = currentXP;
    const currentLevel = this.gamification.getCurrentLevel(currentXP);
    gameData.level = currentLevel.level;
    
    // Update streak
    this.gamification.updateStreak(gameData);
    
    // Check for new badges
    const newBadges = this.gamification.checkBadges(
      this.profile, this.skills, this.projects, this.certs, 
      this.interns, this.social, gameData
    );
    
    newBadges.forEach(badgeId => {
      if (!gameData.badges.includes(badgeId)) {
        gameData.badges.push(badgeId);
        this.gamification.showBadgeNotification(badgeId);
      }
    });
    
    // Check for level up
    if (currentLevel.level > oldLevel) {
      this.gamification.showLevelUpNotification(currentLevel);
    }
    
    this.gamification.saveGameData(this.currentUser.id, gameData);
    
    // Render game stats in home
    const nextLevel = this.gamification.getNextLevel(currentLevel);
    this.gamification.renderGameStats('gameStatsContainer', gameData, currentLevel, nextLevel);
    
    // Update snapshot
    document.getElementById('snapLevel').textContent = `${currentLevel.name} (${currentLevel.level})`;
    
    // Render recent achievements
    this.renderRecentAchievements(gameData, newBadges);
  }

  renderDashboard() {
    // Update counts
    document.getElementById('projectCount').textContent = this.projects.length;
    document.getElementById('skillCount').textContent = this.skills.length;
    document.getElementById('certCount').textContent = this.certs.length;

    // Update snapshot
    document.getElementById('snapName').textContent = this.profile.name || '—';
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

    // Render recent achievements in home
    this.renderRecentAchievements();

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

  renderRecentAchievements(gameData, newBadges = []) {
    const container = document.getElementById('recentAchievements');
    if (!container) return;
    
    if (!gameData) {
      gameData = this.gamification.getGameData(this.currentUser.id);
    }
    
    const recentBadges = gameData.badges.slice(-3).reverse();
    const achievements = [];
    
    // Add recent badges
    recentBadges.forEach(badgeId => {
      const badge = this.gamification.badges[badgeId];
      if (badge) {
        achievements.push({
          type: 'badge',
          icon: badge.icon,
          title: badge.name,
          description: badge.description,
          isNew: newBadges.includes(badgeId)
        });
      }
    });
    
    // Add recent milestones
    if (this.projects.length > 0) {
      achievements.push({
        type: 'milestone',
        icon: '📂',
        title: 'Project Added',
        description: `Latest: ${this.projects[0].title}`,
        isNew: false
      });
    }
    
    if (achievements.length === 0) {
      container.innerHTML = `
        <div class="col-span-3 text-center py-8 text-gray-500">
          <i class="fas fa-trophy text-4xl mb-4 opacity-50"></i>
          <p>Start building your profile to earn achievements!</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = achievements.map(achievement => `
      <div class="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200 ${achievement.isNew ? 'ring-2 ring-yellow-400 animate-pulse' : ''}">
        <div class="flex items-center gap-3">
          <div class="text-2xl">${achievement.icon}</div>
          <div>
            <h4 class="font-semibold text-gray-800">${achievement.title}</h4>
            <p class="text-sm text-gray-600">${achievement.description}</p>
            ${achievement.isNew ? '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">NEW!</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  renderAnalytics() {
    // Generate skill map
    const skillMap = this.skillMapper.generateSkillMap(
      this.skills, this.projects, this.certs, this.interns
    );
    
    const radarData = this.skillMapper.generateRadarChartData(skillMap);
    
    // Render radar chart
    this.skillMapper.renderSkillRadarChart('skillRadarChart', radarData);
    
    // Render skill breakdown
    const skillBreakdown = document.getElementById('skillBreakdown');
    if (skillBreakdown) {
      skillBreakdown.innerHTML = radarData.map(item => `
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium">${item.category}</span>
          <span class="text-sm text-indigo-600 font-semibold">${item.value}%</span>
        </div>
      `).join('');
    }
    
    // Render progress timeline
    this.renderProgressTimeline();
    
    // Render detailed stats
    this.renderDetailedStats(skillMap);
  }

  renderProgressTimeline() {
    const container = document.getElementById('progressTimeline');
    if (!container) return;
    
    const events = [];
    
    // Add projects as timeline events
    this.projects.forEach(project => {
      events.push({
        type: 'project',
        title: project.title,
        description: 'Project completed',
        icon: '📂',
        color: 'indigo'
      });
    });
    
    // Add certificates
    this.certs.forEach(cert => {
      events.push({
        type: 'certificate',
        title: cert.title,
        description: `Certified by ${cert.issuer || 'Organization'}`,
        icon: '🏅',
        color: 'green'
      });
    });
    
    // Add work experience
    this.interns.forEach(intern => {
      events.push({
        type: 'experience',
        title: intern.role,
        description: `at ${intern.company}`,
        icon: '💼',
        color: 'purple'
      });
    });
    
    if (events.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">No timeline data available yet</p>';
      return;
    }
    
    container.innerHTML = events.slice(0, 8).map((event, index) => `
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 bg-${event.color}-100 text-${event.color}-600 rounded-full flex items-center justify-center">
          ${event.icon}
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-gray-800">${event.title}</h4>
          <p class="text-xs text-gray-500">${event.description}</p>
        </div>
      </div>
    `).join('');
  }

  renderDetailedStats(skillMap) {
    // Skill categories
    const skillCategories = document.getElementById('skillCategories');
    if (skillCategories) {
      const categories = Object.entries(skillMap).map(([category, data]) => `
        <div class="flex justify-between items-center py-2">
          <span class="text-sm">${category}</span>
          <span class="text-sm font-semibold text-indigo-600">${data.count} skills</span>
        </div>
      `).join('');
      skillCategories.innerHTML = categories || '<p class="text-gray-500 text-sm">No skill categories yet</p>';
    }
    
    // Project technologies
    const projectTech = document.getElementById('projectTechnologies');
    if (projectTech) {
      const technologies = new Set();
      this.projects.forEach(project => {
        const extractedSkills = this.skillMapper.extractSkillsFromText(project.desc + ' ' + project.title);
        extractedSkills.forEach(skill => technologies.add(skill));
      });
      
      const techArray = Array.from(technologies).slice(0, 8);
      projectTech.innerHTML = techArray.map(tech => `
        <div class="bg-gray-100 px-3 py-1 rounded-full text-sm">${tech}</div>
      `).join('') || '<p class="text-gray-500 text-sm">No project technologies detected</p>';
    }
    
    // Achievement summary
    const achievementSummary = document.getElementById('achievementSummary');
    if (achievementSummary) {
      const gameData = this.gamification.getGameData(this.currentUser.id);
      achievementSummary.innerHTML = `
        <div class="flex justify-between py-1">
          <span class="text-sm">Total XP</span>
          <span class="font-semibold">${gameData.xp}</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-sm">Current Level</span>
          <span class="font-semibold">${gameData.level}</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-sm">Badges Earned</span>
          <span class="font-semibold">${gameData.badges.length}</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-sm">Day Streak</span>
          <span class="font-semibold">${gameData.streak}</span>
        </div>
      `;
    }
  }

  renderAchievements() {
    const gameData = this.gamification.getGameData(this.currentUser.id);
    const currentLevel = this.gamification.getCurrentLevel(gameData.xp);
    const nextLevel = this.gamification.getNextLevel(currentLevel);
    
    // Render level progress
    this.gamification.renderGameStats('levelProgress', gameData, currentLevel, nextLevel);
    
    // Render badges
    this.gamification.renderBadges('badgesContainer', gameData.badges);
  }

  renderLists() {
    const itemClasses = 'bg-white p-4 rounded-lg shadow-sm flex flex-col gap-2 relative border border-gray-100 hover:shadow-md transition-shadow';
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
              <p class="text-sm text-slate-600">${e.degree || ''}</p>
              <p class="text-sm text-slate-500">${e.year || ''}</p>
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
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${isError ? 'bg-red-500' : 'bg-green-500'}`;
    notification.innerHTML = `
      <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-2"></i>
      ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
}

// Initialize dashboard
const dashboard = new CareerNestDashboard();
const integrations = new PlatformIntegrations();

// Make navigate function global for button clicks
window.navigate = (pageId) => dashboard.navigate(pageId);

// Initialize page based on URL hash
if (window.location.hash) {
  const pageId = window.location.hash.substring(1);
  dashboard.navigate(pageId);
} else {
  dashboard.navigate('home');
}
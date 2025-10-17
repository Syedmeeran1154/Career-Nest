// AI ChatBot Module
class ChatbotManager {
  constructor(dashboardInstance) {
    this.dashboard = dashboardInstance;
    this.chatContainer = document.getElementById('chatbotContainer');
    this.chatBody = document.getElementById('chatBody');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('chatSendBtn');
    this.welcomeMessage = "Hello! I'm Career Nest AI Assistant. Ask me anything about your dashboard data (Profile, Skills, Projects, etc.). Try: 'List my top projects' or 'What should I study next?'.";
    
    this.setupEventListeners();
    this.renderInitialMessage();
  }

  setupEventListeners() {
    this.sendButton.addEventListener('click', () => this.handleUserInput());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleUserInput();
      }
    });
  }
  
  renderInitialMessage() {
    // Only render if there are no existing messages
    if (this.chatBody.children.length === 0) {
        this.addMessage('bot', this.welcomeMessage);
    }
  }

  addMessage(sender, text, isAction = false, actionCallback = null) {
    const messageEl = document.createElement('div');
    messageEl.className = `flex mb-4 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const contentEl = document.createElement('div');
    // Use dynamic classes for dark mode compatibility
    contentEl.className = `max-w-xs px-4 py-3 rounded-xl shadow-md ${
      sender === 'user' 
        ? 'bg-indigo-500 text-white rounded-br-none' 
        : 'bg-gray-100 text-gray-800 rounded-tl-none theme-dark:bg-slate-700 theme-dark:text-slate-200'
    }`;
    
    // Simple markdown link conversion
    const htmlContent = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" class="text-indigo-300 hover:text-indigo-200 underline">$1</a>');
    
    contentEl.innerHTML = htmlContent;
    messageEl.appendChild(contentEl);
    this.chatBody.appendChild(messageEl);
    
    // Create an actionable button if this is an action prompt from the bot
    if (isAction && actionCallback) {
        const actionButton = document.createElement('button');
        actionButton.textContent = text;
        actionButton.className = 'mt-2 text-sm text-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors theme-dark:bg-indigo-700 theme-dark:text-indigo-100 theme-dark:hover:bg-indigo-600';
        actionButton.onclick = () => {
            actionCallback();
            this.addMessage('user', text);
            this.addMessage('bot', 'Action performed! Redirecting you now.', false);
            setTimeout(() => {
                document.getElementById('chatbotContainer').classList.add('hidden');
                document.getElementById('chatBotButton').classList.remove('fa-times');
                document.getElementById('chatBotButton').classList.add('fa-comments');
            }, 1000);
        };
        contentEl.innerHTML = ''; // Clear bot response to replace with button
        contentEl.appendChild(actionButton);
        // Change button container style to fit the button better
        contentEl.className = 'max-w-xs p-2 rounded-xl shadow-md bg-transparent';
    }

    this.chatBody.scrollTop = this.chatBody.scrollHeight;
  }

  // --- Data Access and Formatting Methods ---
  getFormattedProfile() {
    const p = this.dashboard.profile;
    const photoStatus = p.photo ? 'Yes (Photo uploaded)' : 'No (Placeholder)';
    return `**Name:** ${p.name || 'N/A'}\n**Email:** ${p.email || 'N/A'}\n**Phone:** ${p.phone || 'N/A'}\n**Photo:** ${photoStatus}\n\n**Bio Summary:**\n${p.bio || 'Please add a professional summary.'}`;
  }

  getFormattedList(type, max = 3) {
    const data = this.dashboard[type];
    if (!data || data.length === 0) {
      return `You currently have no ${type} listed. Visit the [${type} section](#${type}) to add them!`;
    }
    
    let listHtml = `You have ${data.length} ${type} recorded. Here are the top ${Math.min(data.length, max)}:\n`;
    
    data.slice(0, max).forEach((item, index) => {
      listHtml += `\n**${index + 1}.** `;
      switch (type) {
        case 'projects':
          listHtml += `${item.title} (${item.desc.substring(0, 40)}...)\n   Link: ${item.link || 'N/A'}`;
          break;
        case 'skills':
          listHtml += `${item.name} (${item.level}% Proficiency)`;
          break;
        case 'certs':
          listHtml += `${item.title} (Issued by: ${item.issuer || 'N/A'})`;
          break;
        case 'edu':
          listHtml += `${item.degree || 'N/A'} at ${item.institute} (${item.year || 'N/A'})`;
          break;
        case 'interns':
          listHtml += `${item.role || 'N/A'} at ${item.company} (${item.duration || 'N/A'})`;
          break;
        case 'social':
          listHtml += `${item.platform}: ${item.link}`;
          break;
        default:
            listHtml += JSON.stringify(item);
      }
    });
    
    if (data.length > max) {
        listHtml += `\n\n...and ${data.length - max} more. Visit the [${type} section](#${type}) for the full list.`;
    }
    
    return listHtml;
  }
  
  getSummary() {
    const gameData = this.dashboard?.gamificationSystem?.getGameData(this.dashboard.currentUser.id);
    return `Your dashboard data snapshot:\n- **Level:** ${this.dashboard?.gamificationSystem?.getCurrentLevel(gameData.xp).name || 'N/A'} (XP: ${gameData.xp || 0})\n- **Projects:** ${this.dashboard.projects.length}\n- **Skills:** ${this.dashboard.skills.length}\n- **Certificates:** ${this.dashboard.certs.length}\n- **Experience:** ${this.dashboard.interns.length}\n- **Education Records:** ${this.dashboard.edu.length}\n- **Social Links:** ${this.dashboard.social.length}`;
  }
  
  getRecommendation() {
      const skills = this.dashboard.skills;
      const skillMapper = this.dashboard.skillMapper;
      
      if (!skills || skills.length === 0) {
          return "You haven't added any skills yet! I recommend starting with foundational skills like **JavaScript** or **Python**. Head over to the [Skills section](#skills) to add your first skill!";
      }
      
      const skillMap = skillMapper.generateSkillMap(
          skills, 
          this.dashboard.projects, 
          this.dashboard.certs, 
          this.dashboard.interns
      );
      
      const recommendations = [];
      const userSkillNames = new Set(skills.map(s => s.name.toLowerCase()));
      
      const lowProficiencySkills = skills.filter(s => s.level < 70).slice(0, 1);
      if (lowProficiencySkills.length > 0) {
          recommendations.push(`**Improvement Goal:** Consider dedicating time to improving your proficiency in **${lowProficiencySkills[0].name}** (currently ${lowProficiencySkills[0].level}%).`);
      }
      
      const webDevSkills = skillMap['Web Development'];
      if (webDevSkills) {
          if (webDevSkills.skills.some(s => s.name.toLowerCase() === 'react') && !userSkillNames.has('node.js')) {
              recommendations.push("**Backend Bridge:** Since you know React, learning **Node.js** with Express will let you build full-stack applications. This will boost your Web Development average.");
          }
      }
      
      if (!skillMap['DevOps']) {
          recommendations.push("**Infrastructure Foundation:** To round out your profile, start learning about DevOps tools. **Git** and **Docker** are excellent starting points.");
      }

      if (recommendations.length === 0) {
          const topCategory = Object.entries(skillMap).sort((a, b) => b[1].average - a[1].average)[0][0];
          recommendations.push(`You have a strong profile, especially in **${topCategory}**! Try working on a complex project that combines your skills with a new technology you've never used before to reach the next level.`);
      }

      return recommendations.join('\n\n');
  }


  generateResponse(input) {
    const lowerInput = input.toLowerCase();
    
    // --- 1. Comprehensive Data Queries ---
    
    // Profile Query
    if (lowerInput.includes('profile') || lowerInput.includes('about me') || lowerInput.includes('name') || lowerInput.includes('email') || lowerInput.includes('bio')) {
        return { 
            text: `Here is your current profile information:\n\n${this.getFormattedProfile()}`, 
            isAction: false 
        };
    }
    
    // List Queries (Projects, Skills, Certs, Edu, Interns, Social)
    if (lowerInput.includes('list') || lowerInput.includes('show my')) {
        if (lowerInput.includes('project')) return { text: this.getFormattedList('projects'), isAction: false };
        if (lowerInput.includes('skill')) return { text: this.getFormattedList('skills'), isAction: false };
        if (lowerInput.includes('certif')) return { text: this.getFormattedList('certs'), isAction: false };
        if (lowerInput.includes('educat')) return { text: this.getFormattedList('edu'), isAction: false };
        if (lowerInput.includes('intern') || lowerInput.includes('experience')) return { text: this.getFormattedList('interns'), isAction: false };
        if (lowerInput.includes('social') || lowerInput.includes('links')) return { text: this.getFormattedList('social'), isAction: false };
    }
    
    // Summary Command (General data query)
    if (lowerInput.includes('my stats') || lowerInput.includes('summary') || lowerInput.includes('total') || lowerInput.includes('what data')) {
        return { text: this.getSummary(), isAction: false };
    }

    // --- 2. Recommendation/Advice ---
    if (lowerInput.includes('recommend') || lowerInput.includes('next study') || lowerInput.includes('study next') || lowerInput.includes('what should i do')) {
        const recommendationText = this.getRecommendation();
        return { 
            text: `Based on your current profile, here are a few personalized suggestions:\n\n${recommendationText}\n\nTo update your plan, go to the [Skills section](#skills) and add/update your current proficiency.`,
            isAction: false
        };
    }
    
    // --- 3. Navigation/Action Commands (Kept for ease of use) ---
    if (lowerInput.includes('go to') || lowerInput.includes('navigate') || lowerInput.includes('update')) {
        let target = '';
        if (lowerInput.includes('project')) target = 'projects';
        else if (lowerInput.includes('skill')) target = 'skills';
        else if (lowerInput.includes('profile')) target = 'profile';
        else if (lowerInput.includes('analytics')) target = 'analytics';
        else if (lowerInput.includes('resume')) target = 'resume';
        
        if (target) {
            return { 
                text: `Sure, let's navigate to your ${target} section. Click here to go!`, 
                isAction: true, 
                action: () => window.navigate(target)
            };
        }
    }

    // --- 4. Default Responses ---
    const userName = this.dashboard?.currentUser?.name || 'User';
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return { text: `Hello ${userName}! I'm ready to answer any questions about your data. Ask me about your **projects, skills, or certifications**!`, isAction: false };
    }
    
    if (lowerInput.includes('thank')) {
      return { text: "You're welcome! Happy to help you manage your career nest.", isAction: false };
    }
    
    return { 
      text: "I didn't quite catch that. Try a direct data query like 'List my projects' or a command like 'Go to profile'.", 
      isAction: false 
    };
  }
  
  handleUserInput() {
    const input = this.chatInput.value.trim();
    if (!input) return;
    
    this.addMessage('user', input);
    this.chatInput.value = '';
    
    // Simulate thinking/typing delay
    setTimeout(() => {
      const response = this.generateResponse(input);
      if (response.isAction) {
          this.addMessage('bot', response.text, true, response.action);
      } else {
          this.addMessage('bot', response.text, false);
      }
    }, 500);
  }
}

// Global function to toggle the Chatbot UI
window.toggleChatbot = function() {
  const chatbotContainer = document.getElementById('chatbotContainer');
  const chatBotButton = document.getElementById('chatBotButton');
  if (chatbotContainer.classList.contains('hidden')) {
    chatbotContainer.classList.remove('hidden');
    chatBotButton.classList.remove('fa-comments');
    chatBotButton.classList.add('fa-times');
    
    // Check if the global dashboard and chatbot instances are ready
    if (typeof dashboard !== 'undefined' && dashboard.chatbot) {
        window.chatbot = dashboard.chatbot; // Ensure global access
    }
    window.chatbot?.renderInitialMessage(); 
  } else {
    chatbotContainer.classList.add('hidden');
    chatBotButton.classList.remove('fa-times');
    chatBotButton.classList.add('fa-comments');
  }
}

// The initialization on DOMContentLoaded is removed. 
// Dashboard.js will now initialize the chatbot after its own setup.
// Skill Mapping and Analytics
class SkillMapper {
  constructor() {
    this.skillCategories = {
      'Programming': ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'PHP'],
      'Web Development': ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'HTML', 'CSS', 'Tailwind'],
      'Mobile Development': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin'],
      'Data Science': ['Machine Learning', 'Data Analysis', 'Statistics', 'Pandas', 'NumPy', 'TensorFlow'],
      'DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Jenkins', 'Git'],
      'Database': ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase'],
      'Design': ['UI/UX', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator'],
      'Soft Skills': ['Leadership', 'Communication', 'Problem Solving', 'Team Work', 'Project Management']
    };
  }

  categorizeSkill(skillName) {
    for (const [category, skills] of Object.entries(this.skillCategories)) {
      if (skills.some(skill => skillName.toLowerCase().includes(skill.toLowerCase()))) {
        return category;
      }
    }
    return 'Other';
  }

  generateSkillMap(skills, projects, certificates, internships) {
    const skillMap = {};
    
    // Process direct skills
    skills.forEach(skill => {
      const category = this.categorizeSkill(skill.name);
      if (!skillMap[category]) skillMap[category] = { total: 0, count: 0, skills: [] };
      skillMap[category].total += skill.level;
      skillMap[category].count += 1;
      skillMap[category].skills.push({ name: skill.name, level: skill.level });
    });

    // Extract skills from projects
    projects.forEach(project => {
      const extractedSkills = this.extractSkillsFromText(project.desc + ' ' + project.title);
      extractedSkills.forEach(skillName => {
        const category = this.categorizeSkill(skillName);
        if (!skillMap[category]) skillMap[category] = { total: 0, count: 0, skills: [] };
        
        const existingSkill = skillMap[category].skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
        if (!existingSkill) {
          skillMap[category].skills.push({ name: skillName, level: 60, source: 'project' });
          skillMap[category].total += 60;
          skillMap[category].count += 1;
        }
      });
    });

    // Calculate averages
    Object.keys(skillMap).forEach(category => {
      skillMap[category].average = Math.round(skillMap[category].total / skillMap[category].count);
    });

    return skillMap;
  }

  extractSkillsFromText(text) {
    const allSkills = Object.values(this.skillCategories).flat();
    const foundSkills = [];
    
    allSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });
    
    return [...new Set(foundSkills)];
  }

  generateRadarChartData(skillMap) {
    const categories = Object.keys(skillMap);
    const data = categories.map(category => ({
      category,
      value: skillMap[category].average || 0,
      skills: skillMap[category].skills || []
    }));
    
    return data.sort((a, b) => b.value - a.value);
  }

  renderSkillRadarChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const maxValue = 100;
    const centerX = 150;
    const centerY = 150;
    const radius = 120;
    const angleStep = (2 * Math.PI) / data.length;

    let svg = `
      <svg width="300" height="300" viewBox="0 0 300 300" class="skill-radar-chart">
        <!-- Grid circles -->
        <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.2}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.4}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.6}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.8}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        
        <!-- Grid lines -->
    `;

    // Add grid lines and labels
    data.forEach((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      svg += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
      
      // Labels
      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" class="text-xs fill-gray-600" font-family="Inter">${item.category}</text>`;
    });

    // Data polygon
    let pathData = '';
    data.forEach((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = (item.value / maxValue) * radius;
      const x = centerX + Math.cos(angle) * value;
      const y = centerY + Math.sin(angle) * value;
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });
    pathData += ' Z';

    svg += `
        <path d="${pathData}" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" stroke-width="2"/>
        
        <!-- Data points -->
    `;

    // Add data points
    data.forEach((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = (item.value / maxValue) * radius;
      const x = centerX + Math.cos(angle) * value;
      const y = centerY + Math.sin(angle) * value;
      
      svg += `<circle cx="${x}" cy="${y}" r="4" fill="#6366f1" stroke="white" stroke-width="2"/>`;
    });

    svg += '</svg>';
    
    container.innerHTML = svg;
  }
}
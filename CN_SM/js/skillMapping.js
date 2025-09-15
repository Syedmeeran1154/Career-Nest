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
  
  generatePieChartData(data) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const pieData = data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0
    }));
    return pieData;
  }
  
  renderPieChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const size = 300;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    let currentAngle = 0;
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6', '#0ea5e9'];
    
    data.forEach((item, index) => {
      if (item.value === 0) return;
      const sliceAngle = (item.value / 100) * 360;
      
      const startAngle = currentAngle * Math.PI / 180;
      const endAngle = (currentAngle + sliceAngle) * Math.PI / 180;
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      
      svg += `<path d="M${centerX},${centerY} L${x1},${y1} A${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z" fill="${colors[index % colors.length]}" />`;
      
      currentAngle += sliceAngle;
    });
    
    svg += `</svg>`;
    container.innerHTML = svg;
  }
  
  renderBarChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const maxHeight = 200;
    const maxWidth = 400;
    const barWidth = 30;
    const spacing = 10;
    
    let svg = `<svg width="${maxWidth}" height="${maxHeight + 30}" viewBox="0 0 ${maxWidth} ${maxHeight + 30}">`;
    
    const totalWidth = data.length * (barWidth + spacing);
    let xOffset = (maxWidth - totalWidth) / 2;
    
    const maxVal = Math.max(...data.map(item => item.count));
    
    data.forEach((item, index) => {
      const barHeight = (item.count / maxVal) * maxHeight;
      const y = maxHeight - barHeight;
      const x = xOffset + index * (barWidth + spacing);
      
      svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#6366f1" rx="5" ry="5" />`;
      svg += `<text x="${x + barWidth / 2}" y="${maxHeight + 20}" text-anchor="middle" font-size="12" fill="#333">${item.tech}</text>`;
      svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#333">${item.count}</text>`;
    });
    
    svg += `</svg>`;
    container.innerHTML = svg;
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
        <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.2}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.4}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.6}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.8}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        
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
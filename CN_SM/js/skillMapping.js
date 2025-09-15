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

    // Create radar chart using Chart.js
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const themeManager = window.themeManager || new ThemeManager();
    const colors = themeManager.getChartColors();

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: data.map(item => item.category),
        datasets: [{
          label: 'Skill Level',
          data: data.map(item => item.value),
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: colors.tooltip.background,
            titleColor: colors.tooltip.text,
            bodyColor: colors.tooltip.text,
            borderColor: colors.tooltip.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.r}%`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              color: colors.text,
              backdropColor: 'transparent'
            },
            grid: {
              color: colors.grid
            },
            pointLabels: {
              color: colors.text,
              font: {
                size: 12,
                family: 'Inter'
              }
            }
          }
        }
      }
    });
  }

  renderBarChart(containerId, skillsData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const themeManager = window.themeManager || new ThemeManager();
    const colors = themeManager.getChartColors();

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: skillsData.map(skill => skill.name),
        datasets: [{
          label: 'Skill Level (%)',
          data: skillsData.map(skill => skill.level),
          backgroundColor: colors.primary[0],
          borderColor: colors.primary[1],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: colors.tooltip.background,
            titleColor: colors.tooltip.text,
            bodyColor: colors.tooltip.text,
            borderColor: colors.tooltip.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: colors.text,
              maxRotation: 45
            },
            grid: {
              color: colors.grid
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: colors.text,
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: colors.grid
            }
          }
        }
      }
    });
  }

  renderLineChart(containerId, progressData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const themeManager = window.themeManager || new ThemeManager();
    const colors = themeManager.getChartColors();

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: progressData.labels,
        datasets: [{
          label: 'Skills Added',
          data: progressData.skills,
          borderColor: colors.primary[0],
          backgroundColor: colors.primary[0] + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.primary[0],
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }, {
          label: 'Projects Completed',
          data: progressData.projects,
          borderColor: colors.primary[2],
          backgroundColor: colors.primary[2] + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.primary[2],
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: colors.text,
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: colors.tooltip.background,
            titleColor: colors.tooltip.text,
            bodyColor: colors.tooltip.text,
            borderColor: colors.tooltip.border,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: {
              color: colors.text
            },
            grid: {
              color: colors.grid
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: colors.text
            },
            grid: {
              color: colors.grid
            }
          }
        }
      }
    });
  }

  renderPieChart(containerId, pieData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const themeManager = window.themeManager || new ThemeManager();
    const colors = themeManager.getChartColors();

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: pieData.map(item => item.category),
        datasets: [{
          data: pieData.map(item => item.value),
          backgroundColor: colors.primary,
          borderColor: colors.background,
          borderWidth: 3,
          hoverBorderWidth: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.text,
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: colors.tooltip.background,
            titleColor: colors.tooltip.text,
            bodyColor: colors.tooltip.text,
            borderColor: colors.tooltip.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
}
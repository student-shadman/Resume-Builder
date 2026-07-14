
// Resume Builder Application - Advanced JavaScript Implementation

class ResumeBuilder {
    constructor() {
        this.resumeData = {
            personal: {},
            experience: [],
            education: [],
            skills: []
        };
        
        this.currentStep = 'personal';
        this.currentTemplate = 'modern';
        this.experienceCounter = 0;
        this.educationCounter = 0;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadFromStorage();
        this.updatePreview();
        this.calculateATSScore();
        this.initializeTheme();
    }
    
    bindEvents() {
        // Navigation events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.showSection(section);
            }
        });
        
        // Form input events with debouncing
        document.addEventListener('input', this.debounce((e) => {
            if (e.target.matches('#personalForm input, #personalForm textarea')) {
                this.updatePersonalInfo(e.target);
            }
        }, 300));
        
        // Progress step navigation
        document.querySelectorAll('.progress-step').forEach(step => {
            step.addEventListener('click', () => {
                const stepName = step.dataset.step;
                this.goToStep(stepName);
            });
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Template selector
        document.getElementById('templateSelect').addEventListener('change', (e) => {
            this.changeTemplate(e.target.value);
        });
        
        // FAB menu toggle
        const fab = document.querySelector('.fab');
        const fabMenu = document.querySelector('.fab-menu');
        let fabMenuOpen = false;
        
        fab.addEventListener('click', () => {
            fabMenuOpen = !fabMenuOpen;
            fabMenu.classList.toggle('visible', fabMenuOpen);
        });
        
        // Close FAB menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-container') && fabMenuOpen) {
                fabMenuOpen = false;
                fabMenu.classList.remove('visible');
            }
        });
        
        // Auto-save functionality
        setInterval(() => {
            this.autoSave();
        }, 30000); // Auto-save every 30 seconds
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveProgress();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.showModal('exportModal');
                        break;
                }
            }
        });
    }
    
    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Section Navigation
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.nav-link[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    // Step Navigation in Builder
    goToStep(stepName) {
        // Hide all form sections
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target form section
        const targetForm = document.getElementById(`${stepName}Form`);
        if (targetForm) {
            targetForm.classList.add('active');
        }
        
        // Update progress indicator
        document.querySelectorAll('.progress-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const activeStep = document.querySelector(`[data-step="${stepName}"]`);
        if (activeStep) {
            activeStep.classList.add('active');
        }
        
        this.currentStep = stepName;
        this.updatePreview();
        this.calculateATSScore();
    }
    
    nextStep(nextStepName) {
        this.validateCurrentStep() && this.goToStep(nextStepName);
    }
    
    prevStep(prevStepName) {
        this.goToStep(prevStepName);
    }
    
    validateCurrentStep() {
        const currentForm = document.getElementById(`${this.currentStep}Form`);
        const requiredFields = currentForm.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'var(--danger)';
                isValid = false;
                
                // Remove error styling after user starts typing
                field.addEventListener('input', () => {
                    field.style.borderColor = '';
                }, { once: true });
            }
        });
        
        if (!isValid) {
            this.showNotification('Please fill in all required fields', 'error');
        }
        
        return isValid;
    }
    
    // Personal Information Management
    updatePersonalInfo(input) {
        const fieldName = input.id;
        const fieldValue = input.value;
        
        this.resumeData.personal[fieldName] = fieldValue;
        this.updatePreview();
        this.calculateATSScore();
    }
    
    // Experience Management
    addExperience() {
        this.experienceCounter++;
        const experienceItem = this.createExperienceItem(this.experienceCounter);
        document.getElementById('experienceList').appendChild(experienceItem);
        
        // Add to data
        this.resumeData.experience.push({
            id: this.experienceCounter,
            jobTitle: '',
            company: '',
            startDate: '',
            endDate: '',
            description: '',
            current: false
        });
        
        this.animateItemEntry(experienceItem);
    }
    
    createExperienceItem(id) {
        const div = document.createElement('div');
        div.className = 'dynamic-item';
        div.dataset.id = id;
        
        div.innerHTML = `
            <div class="item-header">
                <span class="item-title">Experience ${id}</span>
                <div class="item-actions">
                    <button class="btn-icon btn-delete" onclick="resumeApp.removeExperience(${id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Job Title</label>
                    <input type="text" data-field="jobTitle" placeholder="Software Engineer" required>
                </div>
                <div class="form-group">
                    <label>Company</label>
                    <input type="text" data-field="company" placeholder="Tech Corp" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="month" data-field="startDate" required>
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="month" data-field="endDate">
                    <label style="margin-top: 8px; font-weight: normal;">
                        <input type="checkbox" data-field="current" style="width: auto; margin-right: 8px;">
                        Currently working here
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea data-field="description" rows="3" placeholder="Describe your responsibilities and achievements..."></textarea>
                <div class="ai-assist">
                    <button type="button" class="btn-ai" onclick="resumeApp.generateDescription('experience', ${id})">
                        <i class="fas fa-robot"></i>
                        AI Assist
                    </button>
                </div>
            </div>
        `;
        
        // Bind events for this experience item
        this.bindExperienceEvents(div, id);
        
        return div;
    }
    
    bindExperienceEvents(container, id) {
        const inputs = container.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateExperienceData(id, e.target.dataset.field, e.target.value, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
            });
            
            // Handle current job checkbox
            if (input.dataset.field === 'current') {
                input.addEventListener('change', (e) => {
                    const endDateInput = container.querySelector('[data-field="endDate"]');
                    endDateInput.disabled = e.target.checked;
                    if (e.target.checked) {
                        endDateInput.value = '';
                    }
                });
            }
        });
    }
    
    updateExperienceData(id, field, value, checked = null) {
        const experienceItem = this.resumeData.experience.find(exp => exp.id === id);
        if (experienceItem) {
            if (field === 'current') {
                experienceItem[field] = checked;
            } else {
                experienceItem[field] = value;
            }
            this.updatePreview();
            this.calculateATSScore();
        }
    }
    
    removeExperience(id) {
        if (confirm('Are you sure you want to remove this experience?')) {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    element.remove();
                }, 300);
            }
            
            this.resumeData.experience = this.resumeData.experience.filter(exp => exp.id !== id);
            this.updatePreview();
            this.calculateATSScore();
        }
    }
    
    // Education Management
    addEducation() {
        this.educationCounter++;
        const educationItem = this.createEducationItem(this.educationCounter);
        document.getElementById('educationList').appendChild(educationItem);
        
        this.resumeData.education.push({
            id: this.educationCounter,
            degree: '',
            school: '',
            gradYear: '',
            gpa: ''
        });
        
        this.animateItemEntry(educationItem);
    }
    
    createEducationItem(id) {
        const div = document.createElement('div');
        div.className = 'dynamic-item';
        div.dataset.id = id;
        
        div.innerHTML = `
            <div class="item-header">
                <span class="item-title">Education ${id}</span>
                <div class="item-actions">
                    <button class="btn-icon btn-delete" onclick="resumeApp.removeEducation(${id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Degree</label>
                    <input type="text" data-field="degree" placeholder="Bachelor of Science in Computer Science" required>
                </div>
                <div class="form-group">
                    <label>School</label>
                    <input type="text" data-field="school" placeholder="University Name" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Graduation Year</label>
                    <input type="number" data-field="gradYear" min="1950" max="2030" placeholder="2023">
                </div>
                <div class="form-group">
                    <label>GPA (Optional)</label>
                    <input type="number" data-field="gpa" min="0" max="4" step="0.01" placeholder="3.8">
                </div>
            </div>
        `;
        
        this.bindEducationEvents(div, id);
        return div;
    }
    
    bindEducationEvents(container, id) {
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateEducationData(id, e.target.dataset.field, e.target.value);
            });
        });
    }
    
    updateEducationData(id, field, value) {
        const educationItem = this.resumeData.education.find(edu => edu.id === id);
        if (educationItem) {
            educationItem[field] = value;
            this.updatePreview();
            this.calculateATSScore();
        }
    }
    
    removeEducation(id) {
        if (confirm('Are you sure you want to remove this education entry?')) {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    element.remove();
                }, 300);
            }
            
            this.resumeData.education = this.resumeData.education.filter(edu => edu.id !== id);
            this.updatePreview();
            this.calculateATSScore();
        }
    }
    
    // Skills Management
    addSkill() {
        const skillInput = document.getElementById('skillInput');
        const skillLevel = document.getElementById('skillLevel');
        
        const skillName = skillInput.value.trim();
        const level = skillLevel.value;
        
        if (!skillName) {
            this.showNotification('Please enter a skill name', 'error');
            return;
        }
        
        // Check for duplicates
        if (this.resumeData.skills.some(skill => skill.name.toLowerCase() === skillName.toLowerCase())) {
            this.showNotification('This skill already exists', 'warning');
            return;
        }
        
        const skill = { name: skillName, level: level };
        this.resumeData.skills.push(skill);
        
        this.renderSkills();
        this.updatePreview();
        this.calculateATSScore();
        
        // Clear inputs
        skillInput.value = '';
        skillLevel.value = 'beginner';
    }
    
    renderSkills() {
        const skillsList = document.getElementById('skillsList');
        skillsList.innerHTML = '';
        
        this.resumeData.skills.forEach((skill, index) => {
            const skillTag = document.createElement('div');
            skillTag.className = `skill-tag ${skill.level}`;
            skillTag.innerHTML = `
                <span>${skill.name}</span>
                <button class="skill-remove" onclick="resumeApp.removeSkill(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            skillsList.appendChild(skillTag);
        });
    }
    
    removeSkill(index) {
        this.resumeData.skills.splice(index, 1);
        this.renderSkills();
        this.updatePreview();
        this.calculateATSScore();
    }
    
    // Animation helper
    animateItemEntry(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }
    
    // Resume Preview
    updatePreview() {
        const previewContainer = document.getElementById('resumePreview');
        const template = this.getTemplate();
        previewContainer.innerHTML = template;
    }
    
    getTemplate() {
        const { personal, experience, education, skills } = this.resumeData;
        
        // Check if we have any data to show
        const hasData = Object.keys(personal).length > 0 || experience.length > 0 || education.length > 0 || skills.length > 0;
        
        if (!hasData) {
            return `
                <div class="preview-placeholder">
                    <i class="fas fa-file-alt"></i>
                    <p>Start filling out your information to see the preview</p>
                </div>
            `;
        }
        
        switch (this.currentTemplate) {
            case 'modern':
                return this.getModernTemplate();
            case 'classic':
                return this.getClassicTemplate();
            case 'creative':
                return this.getCreativeTemplate();
            case 'minimal':
                return this.getMinimalTemplate();
            default:
                return this.getModernTemplate();
        }
    }
    
    getModernTemplate() {
        const { personal, experience, education, skills } = this.resumeData;
        
        return `
            <div class="resume-template modern-template">
                <div class="resume-header" style="background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: white;">
                    <div class="resume-name">${personal.firstName || 'First'} ${personal.lastName || 'Last'}</div>
                    <div class="resume-contact">
                        ${personal.email ? `<span><i class="fas fa-envelope"></i> ${personal.email}</span>` : ''}
                        ${personal.phone ? `<span><i class="fas fa-phone"></i> ${personal.phone}</span>` : ''}
                        ${personal.location ? `<span><i class="fas fa-map-marker-alt"></i> ${personal.location}</span>` : ''}
                        ${personal.linkedin ? `<span><i class="fab fa-linkedin"></i> ${personal.linkedin}</span>` : ''}
                    </div>
                </div>
                
                ${personal.summary ? `
                    <div class="resume-section">
                        <div class="section-title">Professional Summary</div>
                        <p>${personal.summary}</p>
                    </div>
                ` : ''}
                
                ${experience.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title">Work Experience</div>
                        ${experience.map(exp => `
                            <div class="experience-item">
                                <div class="item-header">
                                    <div>
                                        <div class="item-title">${exp.jobTitle}</div>
                                        <div class="item-company">${exp.company}</div>
                                    </div>
                                    <div class="item-date">
                                        ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'}
                                    </div>
                                </div>
                                ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${education.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title">Education</div>
                        ${education.map(edu => `
                            <div class="education-item">
                                <div class="item-header">
                                    <div>
                                        <div class="item-title">${edu.degree}</div>
                                        <div class="item-company">${edu.school}</div>
                                    </div>
                                    <div class="item-date">
                                        ${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${skills.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title">Skills</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${skills.map(skill => `
                                <span style="background: var(--primary); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;">
                                    ${skill.name}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    getClassicTemplate() {
        const { personal, experience, education, skills } = this.resumeData;
        
        return `
            <div class="resume-template classic-template">
                <div class="resume-header" style="border-bottom: 3px solid var(--gray-800); padding-bottom: 1rem;">
                    <div class="resume-name" style="color: var(--gray-800);">${personal.firstName || 'First'} ${personal.lastName || 'Last'}</div>
                    <div class="resume-contact" style="color: var(--gray-600);">
                        ${personal.email || ''} ${personal.phone ? `| ${personal.phone}` : ''} ${personal.location ? `| ${personal.location}` : ''}
                    </div>
                </div>
                
                ${personal.summary ? `
                    <div class="resume-section">
                        <div class="section-title" style="color: var(--gray-800); border-bottom: 1px solid var(--gray-800);">SUMMARY</div>
                        <p>${personal.summary}</p>
                    </div>
                ` : ''}
                
                ${experience.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title" style="color: var(--gray-800); border-bottom: 1px solid var(--gray-800);">EXPERIENCE</div>
                        ${experience.map(exp => `
                            <div class="experience-item">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <strong>${exp.jobTitle} - ${exp.company}</strong>
                                    <em>${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'}</em>
                                </div>
                                ${exp.description ? `<div>${exp.description}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${education.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title" style="color: var(--gray-800); border-bottom: 1px solid var(--gray-800);">EDUCATION</div>
                        ${education.map(edu => `
                            <div class="education-item">
                                <div style="display: flex; justify-content: space-between;">
                                    <strong>${edu.degree} - ${edu.school}</strong>
                                    <em>${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</em>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${skills.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title" style="color: var(--gray-800); border-bottom: 1px solid var(--gray-800);">SKILLS</div>
                        <div>${skills.map(skill => skill.name).join(' • ')}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    getCreativeTemplate() {
        const { personal, experience, education, skills } = this.resumeData;
        
        return `
            <div class="resume-template creative-template">
                <div class="resume-header" style="background: linear-gradient(45deg, var(--accent), var(--success)); color: white; border-radius: 0.5rem; margin-bottom: 1rem;">
                    <div class="resume-name">${personal.firstName || 'First'} ${personal.lastName || 'Last'}</div>
                    <div class="resume-contact">
                        ${personal.email ? `📧 ${personal.email}` : ''} ${personal.phone ? `📱 ${personal.phone}` : ''} ${personal.location ? `📍 ${personal.location}` : ''}
                    </div>
                </div>
                
                ${personal.summary ? `
                    <div class="resume-section">
                        <div class="section-title" style="color: var(--accent); border-left: 4px solid var(--accent); padding-left: 1rem;">💡 About Me</div>
                        <p style="font-style: italic;">${personal.summary}</p>
                    </div>
                ` : ''}
                
                ${experience.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title" style="color: var(--accent); border-left: 4px solid var(--accent); padding-left: 1rem;">💼 Experience</div>
                        ${experience.map(exp => `
                            <div class="experience-item" style="border-left: 2px solid var(--gray-300); padding-left: 1rem; margin-left: 1rem;">
                                <div class="item-header">
                                    <div>
                                        <div class="item-title" style="color: var(--success);">${exp.jobTitle}</div>
                                        <div class="item-company" style="color: var(--gray-600);">${exp.company}</div>
                                    </div>
                                    <div class="item-date" style="background: var(--gray-100); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">
                                        ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'}
                                    </div>
                                </div>
                                ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${education.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title" style="color: var(--accent); border-left: 4px solid var(--accent); padding-left: 1rem;">🎓 Education</div>
                        ${education.map(edu => `
                            <div class="education-item" style="background: var(--gray-50); padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
                                <div class="item-header">
                                    <div>
                                        <div class="item-title">${edu.degree}</div>
                                        <div class="item-company">${edu.school}</div>
                                    </div>
                                    <div class="item-date">${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${skills.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title" style="color: var(--accent); border-left: 4px solid var(--accent); padding-left: 1rem;">🛠️ Skills</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem;">
                            ${skills.map(skill => {
                                const levelColors = {
                                    beginner: '#gray-500',
                                    intermediate: '#warning',
                                    advanced: '#success',
                                    expert: '#danger'
                                };
                                return `
                                    <div style="background: var(--${levelColors[skill.level] || 'gray-500'}); color: white; padding: 0.5rem; border-radius: 0.5rem; text-align: center; font-weight: 600;">
                                        ${skill.name}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    getMinimalTemplate() {
        const { personal, experience, education, skills } = this.resumeData;
        
        return `
            <div class="resume-template minimal-template">
                <div class="resume-header" style="text-align: left; border-bottom: 1px solid var(--gray-300); padding-bottom: 1rem;">
                    <div class="resume-name" style="font-size: 2.5rem; font-weight: 300; color: var(--gray-900);">${personal.firstName || 'First'} ${personal.lastName || 'Last'}</div>
                    <div class="resume-contact" style="font-size: 0.9rem; color: var(--gray-600); margin-top: 0.5rem;">
                        ${[personal.email, personal.phone, personal.location, personal.linkedin].filter(Boolean).join(' | ')}
                    </div>
                </div>
                
                ${personal.summary ? `
                    <div class="resume-section">
                        <p style="font-size: 1rem; line-height: 1.6; color: var(--gray-700);">${personal.summary}</p>
                    </div>
                ` : ''}
                
                ${experience.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title" style="font-size: 1rem; font-weight: 600; color: var(--gray-800); margin-bottom: 1rem; border: none;">Experience</div>
                        ${experience.map(exp => `
                            <div class="experience-item" style="margin-bottom: 1.5rem;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">
                                    <div style="font-weight: 600; color: var(--gray-800);">${exp.jobTitle}</div>
                                    <div style="font-size: 0.85rem; color: var(--gray-600);">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'}</div>
                                </div>
                                <div style="font-size: 0.9rem; color: var(--gray-600); margin-bottom: 0.5rem;">${exp.company}</div>
                                ${exp.description ? `<div style="font-size: 0.9rem; color: var(--gray-700); line-height: 1.5;">${exp.description}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${education.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title" style="font-size: 1rem; font-weight: 600; color: var(--gray-800); margin-bottom: 1rem; border: none;">Education</div>
                        ${education.map(edu => `
                            <div class="education-item" style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                    <div>
                                        <div style="font-weight: 600; color: var(--gray-800);">${edu.degree}</div>
                                        <div style="font-size: 0.9rem; color: var(--gray-600);">${edu.school}</div>
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--gray-600);">${edu.gradYear}${edu.gpa ? ` | ${edu.gpa}` : ''}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${skills.length > 0 ? `
                    <div class="resume-section">
                        <div class="section-title" style="font-size: 1rem; font-weight: 600; color: var(--gray-800); margin-bottom: 1rem; border: none;">Skills</div>
                        <div style="font-size: 0.9rem; color: var(--gray-700); line-height: 1.6;">
                            ${skills.map(skill => skill.name).join(', ')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    changeTemplate(templateName) {
        this.currentTemplate = templateName;
        this.updatePreview();
    }
    
    // ATS Score Calculation
    calculateATSScore() {
        let score = 0;
        let maxScore = 100;
        
        const checks = [
            { condition: this.resumeData.personal.email && this.resumeData.personal.phone, points: 15, name: 'Contact Information' },
            { condition: this.resumeData.personal.summary && this.resumeData.personal.summary.length > 50, points: 15, name: 'Professional Summary' },
            { condition: this.resumeData.experience.length > 0, points: 25, name: 'Work Experience' },
            { condition: this.resumeData.education.length > 0, points: 15, name: 'Education' },
            { condition: this.resumeData.skills.length >= 5, points: 15, name: 'Skills (5+)' },
            { condition: this.hasQuantifiedAchievements(), points: 10, name: 'Quantified Achievements' },
            { condition: this.hasKeywords(), points: 5, name: 'Industry Keywords' }
        ];
        
        checks.forEach(check => {
            if (check.condition) {
                score += check.points;
            }
        });
        
        // Update ATS Circle
        this.updateATSCircle(score);
        
        // Update recommendations
        this.updateATSRecommendations(checks.filter(check => !check.condition));
        
        return score;
    }
    
    hasQuantifiedAchievements() {
        return this.resumeData.experience.some(exp => 
            exp.description && /\d+%|\d+\+|\$\d+|\d+ (years|months|weeks)|increased|decreased|improved|reduced/i.test(exp.description)
        );
    }
    
    hasKeywords() {
        const commonKeywords = ['management', 'leadership', 'project', 'team', 'development', 'analysis', 'strategy', 'communication'];
        const allText = (this.resumeData.personal.summary || '') + 
                       this.resumeData.experience.map(exp => exp.description || '').join(' ') +
                       this.resumeData.skills.map(skill => skill.name).join(' ');
        
        return commonKeywords.some(keyword => 
            allText.toLowerCase().includes(keyword.toLowerCase())
        );
    }
    
    updateATSCircle(score) {
        const circle = document.getElementById('atsCircle');
        const scoreText = document.getElementById('atsScore');
        
        if (circle && scoreText) {
            const circumference = 283; // 2 * Math.PI * 45
            const offset = circumference - (score / 100) * circumference;
            
            circle.style.strokeDashoffset = offset;
            scoreText.textContent = score;
            
            // Color coding
            if (score >= 80) {
                circle.style.stroke = 'var(--success)';
            } else if (score >= 60) {
                circle.style.stroke = 'var(--warning)';
            } else {
                circle.style.stroke = 'var(--danger)';
            }
        }
    }
    
    updateATSRecommendations(failedChecks) {
        const recommendationsEl = document.getElementById('atsRecommendations');
        if (!recommendationsEl) return;
        
        if (failedChecks.length === 0) {
            recommendationsEl.innerHTML = '<p style="color: var(--success);"><i class="fas fa-check-circle"></i> Excellent! Your resume passes all ATS checks.</p>';
            return;
        }
        
        const recommendations = {
            'Contact Information': 'Add your email and phone number',
            'Professional Summary': 'Write a detailed professional summary (50+ words)',
            'Work Experience': 'Add your work experience',
            'Education': 'Include your educational background',
            'Skills (5+)': 'List at least 5 relevant skills',
            'Quantified Achievements': 'Add numbers, percentages, or metrics to your achievements',
            'Industry Keywords': 'Include industry-relevant keywords'
        };
        
        const html = `
            <div style="color: var(--warning);">
                <strong>Recommendations:</strong>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    ${failedChecks.map(check => `<li>${recommendations[check.name]}</li>`).join('')}
                </ul>
            </div>
        `;
        
        recommendationsEl.innerHTML = html;
    }
    
    // AI Assistant Functions
    async generateSummary() {
        const summaryField = document.getElementById('summary');
        const originalText = summaryField.value;
        
        this.showLoadingState(summaryField, 'Generating professional summary...');
        
        try {
            // Simulate AI generation with realistic delay
            await this.delay(2000);
            
            const aiSummary = this.getAISummaryTemplate();
            summaryField.value = aiSummary;
            this.updatePersonalInfo(summaryField);
            
            this.showNotification('AI-generated summary added!', 'success');
        } catch (error) {
            this.showNotification('Failed to generate summary. Please try again.', 'error');
            summaryField.value = originalText;
        } finally {
            this.hideLoadingState(summaryField);
        }
    }
    
    async generateDescription(type, id) {
        const container = document.querySelector(`[data-id="${id}"]`);
        const descriptionField = container.querySelector('[data-field="description"]');
        const jobTitle = container.querySelector('[data-field="jobTitle"]').value;
        const company = container.querySelector('[data-field="company"]').value;
        
        if (!jobTitle || !company) {
            this.showNotification('Please fill in job title and company first', 'warning');
            return;
        }
        
        const originalText = descriptionField.value;
        this.showLoadingState(descriptionField, 'Generating job description...');
        
        try {
            await this.delay(2000);
            
            const aiDescription = this.getAIDescriptionTemplate(jobTitle, company);
            descriptionField.value = aiDescription;
            this.updateExperienceData(id, 'description', aiDescription);
            
            this.showNotification('AI-generated description added!', 'success');
        } catch (error) {
            this.showNotification('Failed to generate description. Please try again.', 'error');
            descriptionField.value = originalText;
        } finally {
            this.hideLoadingState(descriptionField);
        }
    }
    
    getAISummaryTemplate() {
        const templates = [
            "Results-driven professional with extensive experience in problem-solving and team collaboration. Proven track record of delivering high-quality projects on time and exceeding performance expectations. Strong analytical skills with the ability to adapt quickly to new technologies and methodologies.",
            "Dynamic and motivated professional with a passion for innovation and continuous improvement. Experienced in leading cross-functional teams and implementing strategic initiatives that drive business growth. Excellent communication skills with a focus on building strong stakeholder relationships.",
            "Detail-oriented professional with expertise in project management and process optimization. Demonstrated ability to streamline operations, reduce costs, and improve efficiency. Committed to delivering exceptional results while maintaining the highest standards of quality and professionalism."
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    getAIDescriptionTemplate(jobTitle, company) {
        const templates = [
            `• Led cross-functional team initiatives resulting in 25% improvement in project delivery time
• Implemented innovative solutions that increased operational efficiency by 30%
• Collaborated with stakeholders to develop strategic plans and achieve business objectives
• Mentored junior team members and contributed to professional development programs`,
            
            `• Managed end-to-end project lifecycle from conception to implementation
• Developed and maintained strong client relationships, achieving 95% customer satisfaction
• Analyzed complex data sets to identify trends and provide actionable insights
• Streamlined processes resulting in $50K annual cost savings`,
            
            `• Spearheaded digital transformation initiatives improving system performance by 40%
• Coordinated with multiple departments to ensure seamless project execution
• Delivered presentations to C-level executives on project status and strategic recommendations
• Achieved quarterly targets consistently, exceeding goals by an average of 15%`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    showLoadingState(element, message) {
        element.style.position = 'relative';
        element.disabled = true;
        
        const loader = document.createElement('div');
        loader.className = 'field-loader';
        loader.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; border-radius: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--primary);">
                    <div class="spinner" style="width: 16px; height: 16px; border: 2px solid var(--primary); border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <span style="font-size: 0.875rem;">${message}</span>
                </div>
            </div>
        `;
        
        element.parentNode.style.position = 'relative';
        element.parentNode.appendChild(loader);
    }
    
    hideLoadingState(element) {
        element.disabled = false;
        const loader = element.parentNode.querySelector('.field-loader');
        if (loader) {
            loader.remove();
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Theme Management
    initializeTheme() {
        const savedTheme = localStorage.getItem('resumeBuilderTheme') || 'light';
        this.applyTheme(savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
    
    applyTheme(theme) {
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            icon.className = 'fas fa-sun';
        } else {
            document.body.classList.remove('dark-theme');
            icon.className = 'fas fa-moon';
        }
        
        localStorage.setItem('resumeBuilderTheme', theme);
    }
    
    // Portfolio Generation
    generatePortfolio() {
        const theme = document.getElementById('portfolioTheme').value;
        const layout = document.getElementById('portfolioLayout').value;
        
        this.showModal('loadingOverlay');
        
        setTimeout(() => {
            const portfolioHTML = this.createPortfolioHTML(theme, layout);
            this.displayPortfolioPreview(portfolioHTML);
            this.closeModal('loadingOverlay');
            this.showNotification('Portfolio generated successfully!', 'success');
        }, 3000);
    }
    
    createPortfolioHTML(theme, layout) {
        const { personal, experience, education, skills } = this.resumeData;
        
        const themeStyles = {
            dark: {
                bg: '#1a1a1a',
                text: '#ffffff',
                accent: '#6366f1',
                secondary: '#8b5cf6'
            },
            light: {
                bg: '#ffffff',
                text: '#333333',
                accent: '#6366f1',
                secondary: '#8b5cf6'
            },
            gradient: {
                bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                text: '#ffffff',
                accent: '#ffffff',
                secondary: '#f0f0f0'
            }
        };
        
        const currentTheme = themeStyles[theme];
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personal.firstName || 'Your'} ${personal.lastName || 'Portfolio'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', sans-serif; 
            background: ${currentTheme.bg}; 
            color: ${currentTheme.text};
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .hero { text-align: center; padding: 4rem 0; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; color: ${currentTheme.accent}; }
        .hero p { font-size: 1.2rem; margin-bottom: 2rem; }
        .section { margin: 4rem 0; }
        .section h2 { font-size: 2rem; margin-bottom: 2rem; color: ${currentTheme.accent}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { 
            background: rgba(255,255,255,0.1); 
            padding: 2rem; 
            border-radius: 1rem; 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .skill-tag { 
            display: inline-block; 
            background: ${currentTheme.accent}; 
            color: white; 
            padding: 0.5rem 1rem; 
            border-radius: 2rem; 
            margin: 0.25rem; 
        }
        .contact-btn {
            background: ${currentTheme.accent};
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 1.1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <section class="hero">
            <h1>${personal.firstName || 'Your'} ${personal.lastName || 'Name'}</h1>
            <p>${personal.summary || 'Professional summary goes here'}</p>
            <div>
                ${personal.email ? `<a href="mailto:${personal.email}" class="contact-btn">Email Me</a>` : ''}
                ${personal.linkedin ? `<a href="https://${personal.linkedin}" class="contact-btn">LinkedIn</a>` : ''}
            </div>
        </section>
        
        ${experience.length > 0 ? `
        <section class="section">
            <h2>Experience</h2>
            <div class="grid">
                ${experience.map(exp => `
                    <div class="card">
                        <h3>${exp.jobTitle}</h3>
                        <h4>${exp.company}</h4>
                        <p><em>${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</em></p>
                        <p>${exp.description || ''}</p>
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
        
        ${skills.length > 0 ? `
        <section class="section">
            <h2>Skills</h2>
            <div style="text-align: center;">
                ${skills.map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
            </div>
        </section>
        ` : ''}
        
        ${education.length > 0 ? `
        <section class="section">
            <h2>Education</h2>
            <div class="grid">
                ${education.map(edu => `
                    <div class="card">
                        <h3>${edu.degree}</h3>
                        <h4>${edu.school}</h4>
                        <p>${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</p>
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
    </div>
</body>
</html>
        `;
    }
    
    displayPortfolioPreview(html) {
        const previewContainer = document.getElementById('portfolioPreview');
        previewContainer.classList.remove('hidden');
        
        previewContainer.innerHTML = `
            <div style="border: 1px solid var(--gray-300); border-radius: 0.5rem; overflow: hidden;">
                <div style="background: var(--gray-100); padding: 1rem; border-bottom: 1px solid var(--gray-300); display: flex; justify-content: space-between; align-items: center;">
                    <h3>Portfolio Preview</h3>
                    <button class="btn btn-primary" onclick="resumeApp.downloadPortfolio()">
                        <i class="fas fa-download"></i>
                        Download HTML
                    </button>
                </div>
                <iframe srcdoc="${html.replace(/"/g, '&quot;')}" style="width: 100%; height: 600px; border: none;"></iframe>
            </div>
        `;
    }
    
    downloadPortfolio() {
        const portfolioHTML = this.createPortfolioHTML(
            document.getElementById('portfolioTheme').value,
            document.getElementById('portfolioLayout').value
        );
        
        this.downloadFile(portfolioHTML, 'portfolio.html', 'text/html');
    }
    
    // Export Functions
    exportToPDF() {
        this.showNotification('PDF export feature coming soon!', 'info');
        // In a real implementation, you would use libraries like jsPDF or Puppeteer
    }
    
    exportToWord() {
        const resumeText = this.generateResumeText();
        this.downloadFile(resumeText, 'resume.txt', 'text/plain');
        this.showNotification('Resume exported as text file', 'success');
    }
    
    exportToHTML() {
        const resumeHTML = this.generateResumeHTML();
        this.downloadFile(resumeHTML, 'resume.html', 'text/html');
        this.showNotification('Resume exported as HTML', 'success');
    }
    
    generateResumeText() {
        const { personal, experience, education, skills } = this.resumeData;
        
        let text = `${personal.firstName || 'First'} ${personal.lastName || 'Last'}\n`;
        text += `${personal.email || ''} | ${personal.phone || ''} | ${personal.location || ''}\n\n`;
        
        if (personal.summary) {
            text += `PROFESSIONAL SUMMARY\n${personal.summary}\n\n`;
        }
        
        if (experience.length > 0) {
            text += `WORK EXPERIENCE\n`;
            experience.forEach(exp => {
                text += `${exp.jobTitle} - ${exp.company}\n`;
                text += `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
                if (exp.description) text += `${exp.description}\n`;
                text += `\n`;
            });
        }
        
        if (education.length > 0) {
            text += `EDUCATION\n`;
            education.forEach(edu => {
                text += `${edu.degree} - ${edu.school}\n`;
                text += `${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}\n\n`;
            });
        }
        
        if (skills.length > 0) {
            text += `SKILLS\n`;
            text += skills.map(skill => skill.name).join(', ') + '\n';
        }
        
        return text;
    }
    
    generateResumeHTML() {
        const currentPreview = document.getElementById('resumePreview').innerHTML;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${this.resumeData.personal.firstName || 'Your'} ${this.resumeData.personal.lastName || 'Name'}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        .resume-template { background: white; }
        /* Include relevant CSS styles here */
    </style>
</head>
<body>
    ${currentPreview}
</body>
</html>
        `;
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Storage Functions
    saveProgress() {
        try {
            localStorage.setItem('resumeBuilderData', JSON.stringify(this.resumeData));
            localStorage.setItem('resumeBuilderMeta', JSON.stringify({
                currentStep: this.currentStep,
                currentTemplate: this.currentTemplate,
                savedAt: new Date().toISOString()
            }));
            this.showNotification('Progress saved successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to save progress', 'error');
        }
    }
    
    loadProgress() {
        try {
            const savedData = localStorage.getItem('resumeBuilderData');
            const savedMeta = localStorage.getItem('resumeBuilderMeta');
            
            if (savedData) {
                this.resumeData = JSON.parse(savedData);
                
                if (savedMeta) {
                    const meta = JSON.parse(savedMeta);
                    this.currentStep = meta.currentStep || 'personal';
                    this.currentTemplate = meta.currentTemplate || 'modern';
                }
                
                this.populateFormFields();
                this.updatePreview();
                this.calculateATSScore();
                this.goToStep(this.currentStep);
                
                this.showNotification('Progress loaded successfully!', 'success');
            } else {
                this.showNotification('No saved progress found', 'info');
            }
        } catch (error) {
            this.showNotification('Failed to load progress', 'error');
        }
    }
    
    loadFromStorage() {
        // Auto-load on page refresh
        const savedData = localStorage.getItem('resumeBuilderData');
        if (savedData) {
            try {
                this.resumeData = JSON.parse(savedData);
                this.populateFormFields();
            } catch (error) {
                console.error('Failed to load saved data:', error);
            }
        }
    }
    
    autoSave() {
        // Silent auto-save without notification
        try {
            localStorage.setItem('resumeBuilderData', JSON.stringify(this.resumeData));
            localStorage.setItem('resumeBuilderAutoSave', new Date().toISOString());
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    
    populateFormFields() {
        // Populate personal info
        Object.keys(this.resumeData.personal).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                field.value = this.resumeData.personal[key];
            }
        });
        
        // Populate experience
        this.resumeData.experience.forEach(exp => {
            this.addExperience();
            const container = document.querySelector(`[data-id="${exp.id}"]`);
            if (container) {
                Object.keys(exp).forEach(key => {
                    const field = container.querySelector(`[data-field="${key}"]`);
                    if (field) {
                        if (field.type === 'checkbox') {
                            field.checked = exp[key];
                        } else {
                            field.value = exp[key];
                        }
                    }
                });
            }
        });
        
        // Populate education
        this.resumeData.education.forEach(edu => {
            this.addEducation();
            const container = document.querySelector(`[data-id="${edu.id}"]`);
            if (container) {
                Object.keys(edu).forEach(key => {
                    const field = container.querySelector(`[data-field="${key}"]`);
                    if (field) {
                        field.value = edu[key];
                    }
                });
            }
        });
        
        // Populate skills
        this.renderSkills();
    }
    
    resetForm() {
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
            this.resumeData = {
                personal: {},
                experience: [],
                education: [],
                skills: []
            };
            
            this.experienceCounter = 0;
            this.educationCounter = 0;
            
            // Clear form fields
            document.querySelectorAll('input, textarea').forEach(field => {
                field.value = '';
                field.checked = false;
            });
            
            // Clear dynamic lists
            document.getElementById('experienceList').innerHTML = '';
            document.getElementById('educationList').innerHTML = '';
            document.getElementById('skillsList').innerHTML = '';
            
            // Clear localStorage
            localStorage.removeItem('resumeBuilderData');
            localStorage.removeItem('resumeBuilderMeta');
            
            this.updatePreview();
            this.calculateATSScore();
            this.goToStep('personal');
            
            this.showNotification('All data has been reset', 'info');
        }
    }
    
    // Modal Functions
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    // Notification System
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: 'var(--success)',
            error: 'var(--danger)',
            warning: 'var(--warning)',
            info: 'var(--primary)'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 2rem;
            background: white;
            color: ${colors[type]};
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-left: 4px solid ${colors[type]};
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 300px;
            max-width: 500px;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: currentColor; cursor: pointer; padding: 0.25rem;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
}

// Template Selection
function selectTemplate(templateName) {
    if (window.resumeApp) {
        window.resumeApp.changeTemplate(templateName);
        window.resumeApp.showSection('builder');
    }
}

// Global Functions for HTML onclick handlers
function showSection(sectionName) {
    window.resumeApp?.showSection(sectionName);
}

function nextStep(stepName) {
    window.resumeApp?.nextStep(stepName);
}

function prevStep(stepName) {
    window.resumeApp?.prevStep(stepName);
}

function addExperience() {
    window.resumeApp?.addExperience();
}

function addEducation() {
    window.resumeApp?.addEducation();
}

function addSkill() {
    window.resumeApp?.addSkill();
}

function changeTemplate() {
    const select = document.getElementById('templateSelect');
    window.resumeApp?.changeTemplate(select.value);
}

function generateSummary() {
    window.resumeApp?.generateSummary();
}

function generatePortfolio() {
    window.resumeApp?.generatePortfolio();
}

function exportToPDF() {
    window.resumeApp?.exportToPDF();
}

function exportToWord() {
    window.resumeApp?.exportToWord();
}

function exportToHTML() {
    window.resumeApp?.exportToHTML();
}

function saveProgress() {
    window.resumeApp?.saveProgress();
}

function loadProgress() {
    window.resumeApp?.loadProgress();
}

function resetForm() {
    window.resumeApp?.resetForm();
}

function showModal(modalId) {
    window.resumeApp?.showModal(modalId);
}

function closeModal(modalId) {
    window.resumeApp?.closeModal(modalId);
}

// CSS Animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
            max-height: 200px;
            margin-bottom: 1.5rem;
        }
        to {
            opacity: 0;
            transform: translateX(-100%);
            max-height: 0;
            margin-bottom: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.resumeApp = new ResumeBuilder();
});

// Handle page visibility for auto-save
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && window.resumeApp) {
        window.resumeApp.autoSave();
    }
});

// Handle before unload for unsaved changes warning
window.addEventListener('beforeunload', (e) => {
    const hasUnsavedChanges = localStorage.getItem('resumeBuilderData') !== 
                             JSON.stringify(window.resumeApp?.resumeData || {});
    
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
});

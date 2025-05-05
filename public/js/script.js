document.addEventListener('DOMContentLoaded', () => {
    const DOM = {
      usernameInput: document.getElementById('username-input'),
      searchBtn: document.getElementById('search-btn'),
      profileContainer: document.getElementById('profile-container')
    };
  
    // GitHub Octocat animation
    const githubCorner = document.querySelector('.github-corner');
    if (githubCorner) {
      githubCorner.addEventListener('mouseenter', () => {
        const octoArm = githubCorner.querySelector('.octo-arm');
        if (octoArm) {
          octoArm.style.animation = 'octocat-wave 560ms ease-in-out';
          setTimeout(() => {
            octoArm.style.animation = '';
          }, 560);
        }
      });
    }
  
    // Event listeners with debounce
    let debounceTimer;
    DOM.searchBtn.addEventListener('click', generateProfile);
    DOM.usernameInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (DOM.usernameInput.value.trim().length > 2) {
          generateProfile();
        }
      }, 500);
    });
    DOM.usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') generateProfile();
    });
  
    // Generate profile with loading state
    async function generateProfile() {
      const username = DOM.usernameInput.value.trim();
      if (!username) {
        showError('Please enter a GitHub username');
        return;
      }
  
      showLoading(username);
  
      try {
        const response = await fetch(`/api/user/${encodeURIComponent(username)}`);
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch profile data');
        }
  
        renderProfile(data);
        animateElements();
      } catch (error) {
        showError(error.message);
      }
    }
  
    // Show loading state with cool animation
    function showLoading(username) {
      DOM.profileContainer.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Generating <span class="username">${username}</span>'s premium profile...</p>
        </div>
      `;
      
      // Add pulsing animation to username
      const usernameEl = DOM.profileContainer.querySelector('.username');
      if (usernameEl) {
        usernameEl.style.display = 'inline-block';
        usernameEl.style.animation = 'pulse 1.5s infinite';
      }
    }
  
    // Show error state
    function showError(message) {
      DOM.profileContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>${message}</h3>
          <p>Please check the username and try again</p>
          <button>
            <i class="fas fa-sync-alt"></i> Try Again
          </button>
        </div>
      `;
  
      // Add event listener to try again button
      const tryAgainBtn = DOM.profileContainer.querySelector('button');
      if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
          DOM.usernameInput.focus();
          DOM.profileContainer.innerHTML = `
            <div class="welcome-message">
              <i class="fab fa-github"></i>
              <h2>GitHub Profile Visualizer</h2>
              <p>Transform any GitHub profile into a beautiful, interactive portfolio.</p>
            </div>
          `;
        });
      }
    }
  
    // Render profile with all data
    function renderProfile(data) {
      const { profile, stats, topRepos } = data;
      const langColors = generateLanguageColors(stats.languages);
  
      DOM.profileContainer.innerHTML = `
        <div class="profile-content">
          <!-- Profile Header -->
          <div class="profile-header">
            <img src="${profile.avatar}" alt="${profile.username}" class="profile-avatar" loading="lazy">
            <h1 class="profile-name">${profile.name || profile.username}</h1>
            <h2 class="profile-username">${profile.username}</h2>
            ${profile.bio ? `<p class="profile-bio">${profile.bio}</p>` : ''}
            
            <div class="profile-meta">
              ${profile.location ? `
                <div class="meta-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>${profile.location}</span>
                </div>
              ` : ''}
              
              ${profile.company ? `
                <div class="meta-item">
                  <i class="fas fa-building"></i>
                  <span>${profile.company}</span>
                </div>
              ` : ''}
              
              ${profile.website ? `
                <div class="meta-item">
                  <i class="fas fa-globe"></i>
                  <a href="${formatWebsite(profile.website)}" target="_blank">${profile.website}</a>
                </div>
              ` : ''}
              
              <div class="meta-item">
                <i class="far fa-calendar-alt"></i>
                <span>Joined ${formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <!-- Stats Cards -->
          <div class="profile-stats">
            <div class="stat-card">
              <div class="stat-value">${profile.publicRepos}</div>
              <div class="stat-label">Repositories</div>
              <i class="stat-icon fas fa-code"></i>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">${stats.totalStars}</div>
              <div class="stat-label">Stars</div>
              <i class="stat-icon fas fa-star"></i>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">${stats.totalForks}</div>
              <div class="stat-label">Forks</div>
              <i class="stat-icon fas fa-code-branch"></i>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">${profile.followers}</div>
              <div class="stat-label">Followers</div>
              <i class="stat-icon fas fa-users"></i>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">${profile.following}</div>
              <div class="stat-label">Following</div>
              <i class="stat-icon fas fa-user-plus"></i>
            </div>
          </div>
          
          <!-- Languages -->
          ${stats.languages.length > 0 ? `
            <div class="profile-section">
              <h3 class="section-title">
                <i class="fas fa-code"></i>
                Top Languages
              </h3>
              <div class="languages-container">
                ${stats.languages.slice(0, 8).map(lang => `
                  <div class="language-item">
                    <div class="language-color" style="background-color: ${langColors[lang.language]}; box-shadow: 0 0 8px ${langColors[lang.language]}"></div>
                    <span>${lang.language}</span>
                    <span class="language-count">${lang.count} repos</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Top Repositories -->
          <div class="profile-section">
            <h3 class="section-title">
              <i class="fas fa-book"></i>
              Top Repositories
            </h3>
            <div class="repos-grid">
              ${topRepos.map(repo => `
                <a href="${repo.url}" target="_blank" class="repo-card">
                  <h4 class="repo-name">${repo.name}</h4>
                  ${repo.description ? `<p class="repo-description">${repo.description}</p>` : ''}
                  
                  <div class="repo-meta">
                    ${repo.language ? `
                      <div class="repo-stat repo-language">
                        <div class="repo-language-color" style="background-color: ${langColors[repo.language] || '#58a6ff'}; box-shadow: 0 0 5px ${langColors[repo.language] || '#58a6ff'}"></div>
                        <span>${repo.language}</span>
                      </div>
                    ` : ''}
                    
                    <div class="repo-stat">
                      <i class="fas fa-star"></i>
                      <span>${formatNumber(repo.stars)}</span>
                    </div>
                    
                    <div class="repo-stat">
                      <i class="fas fa-code-branch"></i>
                      <span>${formatNumber(repo.forks)}</span>
                    </div>
                  </div>
                  
                  <div class="repo-updated">
                    <i class="far fa-clock"></i>
                    Updated ${formatDate(repo.updatedAt)}
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }
  
    // Animate elements after rendering
    function animateElements() {
      const animateOnScroll = (elements, animation) => {
        elements.forEach((element, index) => {
          setTimeout(() => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  element.style.opacity = '1';
                  element.style.transform = 'translateY(0)';
                  element.style.transition = `all 0.5s ease ${index * 0.1}s`;
                  observer.unobserve(entry.target);
                }
              });
            }, { threshold: 0.1 });
  
            observer.observe(element);
          }, index * 50);
        });
      };
  
      const statCards = document.querySelectorAll('.stat-card');
      const languageItems = document.querySelectorAll('.language-item');
      const repoCards = document.querySelectorAll('.repo-card');
  
      animateOnScroll(statCards, 'fadeInUp');
      animateOnScroll(languageItems, 'fadeInUp');
      animateOnScroll(repoCards, 'fadeInUp');
    }
  
    // Helper functions
    function generateLanguageColors(languages) {
      const colors = {};
      const colorPalette = [
        '#1f6feb', '#58a6ff', '#2ea043', '#3fb950', 
        '#e3b341', '#db6d28', '#f0883e', '#a371f7',
        '#8957e5', '#d6409f', '#ea4aaa', '#ff7b72'
      ];
      
      languages.forEach((lang, i) => {
        colors[lang.language] = colorPalette[i % colorPalette.length];
      });
      
      return colors;
    }
  
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  
    function formatWebsite(url) {
      if (!url) return '#';
      return url.startsWith('http') ? url : `https://${url}`;
    }
  
    function formatNumber(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
      }
      return num;
    }
  });
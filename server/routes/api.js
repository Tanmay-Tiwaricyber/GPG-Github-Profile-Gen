const express = require('express');
const router = express.Router();
const axios = require('axios');

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Simple username validation middleware
const validateUsername = (req, res, next) => {
  const { username } = req.params;
  if (!username || !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
    return res.status(400).json({ error: 'Invalid GitHub username' });
  }
  next();
};

router.get('/user/:username', validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    
    const [userResponse, reposResponse] = await Promise.all([
      axios.get(`${GITHUB_API_URL}/users/${username}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
      }),
      axios.get(`${GITHUB_API_URL}/users/${username}/repos`, {
        params: { sort: 'updated', per_page: 100 },
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
      })
    ]);

    // Process the data...
    const userData = userResponse.data;
    const reposData = reposResponse.data;

    const languages = {};
    let totalStars = 0;
    let totalForks = 0;

    reposData.forEach(repo => {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    const response = {
      profile: {
        username: userData.login,
        name: userData.name,
        avatar: userData.avatar_url,
        bio: userData.bio,
        location: userData.location,
        website: userData.blog,
        company: userData.company,
        followers: userData.followers,
        following: userData.following,
        publicRepos: userData.public_repos,
        createdAt: userData.created_at,
      },
      stats: {
        totalStars,
        totalForks,
        languages: Object.entries(languages)
          .sort((a, b) => b[1] - a[1])
          .map(([language, count]) => ({ language, count })),
        repoCount: reposData.length,
      },
      topRepos: reposData
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 6)
        .map(repo => ({
          name: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          url: repo.html_url,
          updatedAt: repo.updated_at,
        })),
    };

    res.json(response);
  } catch (error) {
    console.error('GitHub API error:', error);
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data.message || 'GitHub API error'
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch GitHub data' });
    }
  }
});

module.exports = router;
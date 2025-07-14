#!/bin/bash

# GitHub Branch Protection Setup Script
# This script sets up branch protection rules for your repository
# Run this after creating your GitHub repository

REPO_OWNER="your-github-username"
REPO_NAME="dummy-card-issuer-api"
BRANCH="main"

echo "Setting up branch protection for $REPO_OWNER/$REPO_NAME on branch $BRANCH"

# You'll need a GitHub Personal Access Token with repo permissions
# Set it as an environment variable: export GITHUB_TOKEN="your_token_here"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set"
    echo "Please set your GitHub Personal Access Token:"
    echo "export GITHUB_TOKEN=\"your_token_here\""
    exit 1
fi

# Create branch protection rule
curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection" \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "Code Quality & API Validation",
        "API Contract Validation",
        "Security Scan"
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false,
      "require_last_push_approval": true
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false
  }'

echo ""
echo "Branch protection rules have been applied!"
echo ""
echo "Your main branch is now protected with:"
echo "✅ Required status checks (all CI jobs must pass)"
echo "✅ Required pull request reviews (at least 1 approval)"
echo "✅ Dismiss stale reviews when new commits are pushed"
echo "✅ Enforce for administrators"
echo "✅ No force pushes allowed"
echo "✅ No deletions allowed"

#!/bin/bash

# Mezon ERP Project Board Setup Script
# This script helps create and populate a GitHub Project Board V2

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Mezon ERP Project Board Setup ===${NC}\n"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    echo ""
    echo "macOS: brew install gh"
    echo "Then run: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Not authenticated with GitHub CLI.${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

REPO="weissv/mezon_admin"

echo -e "${GREEN}Creating project board: Mezon ERP${NC}"

# Create the project board
PROJECT_ID=$(gh project create --owner weissv --title "Mezon ERP" --format json | jq -r '.id')

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Failed to create project. It may already exist.${NC}"
    echo "To use an existing project, get its ID with:"
    echo "  gh project list --owner weissv"
    exit 1
fi

echo -e "${GREEN}Created project with ID: $PROJECT_ID${NC}\n"

# Create custom fields and columns
echo -e "${BLUE}Setting up project columns...${NC}"

# Note: GitHub Projects V2 uses views and field values instead of traditional columns
# The default "Status" field should already exist

# Add issues to project
echo -e "\n${BLUE}Adding issues to project...${NC}\n"

# Array of issue numbers and their intended status
declare -A issues_done=(
    [3]="Done" [4]="Done" [5]="Done" [6]="Done" [7]="Done" [8]="Done" [9]="Done"
    [10]="Done" [11]="Done" [12]="Done" [13]="Done" [14]="Done" [15]="Done"
    [16]="Done" [17]="Done" [18]="Done" [19]="Done" [20]="Done" [21]="Done"
    [22]="Done" [23]="Done" [24]="Done" [25]="Done"
)

declare -A issues_review=(
    [26]="In Review" [27]="In Review" [29]="In Review"
)

declare -A issues_ready=(
    [28]="Ready" [31]="Ready" [32]="Ready"
)

declare -A issues_progress=(
    [30]="In Progress" [33]="In Progress"
)

declare -A issues_backlog=(
    [2]="Backlog" [34]="Backlog" [35]="Backlog" [36]="Backlog"
)

# Add issues from Done category (23 issues)
for issue in "${!issues_done[@]}"; do
    echo -e "${GREEN}Adding issue #$issue to project (${issues_done[$issue]})${NC}"
    gh project item-add $PROJECT_ID --owner weissv --url "https://github.com/$REPO/issues/$issue"
done

# Add issues from In Review category (3 issues)
for issue in "${!issues_review[@]}"; do
    echo -e "${YELLOW}Adding issue #$issue to project (${issues_review[$issue]})${NC}"
    gh project item-add $PROJECT_ID --owner weissv --url "https://github.com/$REPO/issues/$issue"
done

# Add issues from Ready category (3 issues)
for issue in "${!issues_ready[@]}"; do
    echo -e "${BLUE}Adding issue #$issue to project (${issues_ready[$issue]})${NC}"
    gh project item-add $PROJECT_ID --owner weissv --url "https://github.com/$REPO/issues/$issue"
done

# Add issues from In Progress category (2 issues)
for issue in "${!issues_progress[@]}"; do
    echo -e "${YELLOW}Adding issue #$issue to project (${issues_progress[$issue]})${NC}"
    gh project item-add $PROJECT_ID --owner weissv --url "https://github.com/$REPO/issues/$issue"
done

# Add issues from Backlog category (4 issues)
for issue in "${!issues_backlog[@]}"; do
    echo -e "Adding issue #$issue to project (${issues_backlog[$issue]})"
    gh project item-add $PROJECT_ID --owner weissv --url "https://github.com/$REPO/issues/$issue"
done

echo -e "\n${GREEN}=== Project Board Setup Complete! ===${NC}"
echo -e "\nProject URL: https://github.com/users/weissv/projects"
echo -e "\n${YELLOW}Note: You'll need to manually organize items into columns in the GitHub UI.${NC}"
echo -e "The default Status field has: Todo, In Progress, Done"
echo -e "You may want to customize it to have: Backlog, Ready, In Progress, In Review, Done"
echo ""
echo "To customize columns:"
echo "1. Go to your project board"
echo "2. Click Settings (gear icon)"
echo "3. Manage the 'Status' field options"
echo "4. Add/rename options as needed"
echo ""
echo -e "${GREEN}Total issues added: 35${NC}"
echo "  - Done: 23 issues (#3-25)"
echo "  - In Review: 3 issues (#26, #27, #29)"
echo "  - Ready: 3 issues (#28, #31, #32)"
echo "  - In Progress: 2 issues (#30, #33)"
echo "  - Backlog: 4 issues (#2, #34-36)"

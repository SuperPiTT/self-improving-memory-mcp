#!/bin/bash
# Agent Start Notifier - PreToolUse hook for Task tool
# Shows visual notification when agents start executing

input=$(cat)

# Extract tool name and input
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
tool_input=$(echo "$input" | jq -r '.tool_input // empty')

# Only process Task tool calls
if [[ "$tool_name" != "Task" ]]; then
  exit 0
fi

# Extract subagent_type from tool input
subagent_type=$(echo "$tool_input" | jq -r '.subagent_type // empty')

# Agent metadata (icon, color, description)
declare -A agent_info

# General purpose agents
agent_info["general-purpose|pattern-recognition"]="🔍|cyan|Pattern Recognition Agent|Searching memory for relevant knowledge"
agent_info["general-purpose|error-detector"]="❌|red|Error Detection Agent|Capturing error context and symptoms"
agent_info["general-purpose|solution-capture"]="✅|green|Solution Capture Agent|Recording successful fix"
agent_info["general-purpose|decision-tracker"]="📋|blue|Decision Tracker Agent|Documenting technical decision"
agent_info["general-purpose|confidence-evaluator"]="🎯|yellow|Confidence Evaluator Agent|Updating knowledge confidence scores"
agent_info["general-purpose|user-intent-capture"]="💬|magenta|User Intent Capture Agent|Recording user requirements"
agent_info["general-purpose|style-preferences"]="🎨|cyan|Style Preferences Agent|Learning code style preferences"
agent_info["general-purpose|session-context"]="💾|blue|Session Context Agent|Saving work-in-progress state"
agent_info["general-purpose|pre-compact-interceptor"]="🚨|red|Pre-Compact Interceptor Agent|Creating context checkpoint"
agent_info["general-purpose|context-recovery"]="💡|green|Context Recovery Agent|Restoring previous session"
agent_info["general-purpose|memory-guide"]="📚|blue|Memory Guide Agent|Providing system documentation"

# Default for unknown agents
agent_info["default"]="🤖|white|Agent|Processing task"

# Get agent key
agent_key="${subagent_type}|${subagent_type}"
if [[ -z "${agent_info[$agent_key]}" ]]; then
  agent_key="default"
fi

# Parse agent info
IFS='|' read -r icon color name description <<< "${agent_info[$agent_key]}"

# ANSI color codes
declare -A colors
colors["red"]="\033[1;31m"
colors["green"]="\033[1;32m"
colors["yellow"]="\033[1;33m"
colors["blue"]="\033[1;34m"
colors["magenta"]="\033[1;35m"
colors["cyan"]="\033[1;36m"
colors["white"]="\033[1;37m"
reset="\033[0m"
dim="\033[2m"

color_code="${colors[$color]}"

# Build notification message
echo ""
echo -e "${color_code}╭─────────────────────────────────────────────────╮${reset}"
echo -e "${color_code}│${reset} ${icon}  ${color_code}${name}${reset}"
echo -e "${color_code}│${reset} ${dim}${description}...${reset}"
echo -e "${color_code}╰─────────────────────────────────────────────────╯${reset}"
echo ""

# Allow the tool to proceed
exit 0

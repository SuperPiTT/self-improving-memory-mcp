#!/bin/bash
# Agent Complete Notifier - PostToolUse hook for Task tool
# Shows visual notification when agents finish executing

input=$(cat)

# Extract tool name and input
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
tool_input=$(echo "$input" | jq -r '.tool_input // empty')
tool_response=$(echo "$input" | jq -r '.tool_response // empty')

# Only process Task tool calls
if [[ "$tool_name" != "Task" ]]; then
  exit 0
fi

# Extract subagent_type from tool input
subagent_type=$(echo "$tool_input" | jq -r '.subagent_type // empty')

# Try to extract a summary from response (first 100 chars)
response_preview=$(echo "$tool_response" | head -c 100)
if [[ ${#tool_response} -gt 100 ]]; then
  response_preview="${response_preview}..."
fi

# Agent metadata (icon, color, name)
declare -A agent_info

# General purpose agents
agent_info["general-purpose|pattern-recognition"]="🔍|cyan|Pattern Recognition"
agent_info["general-purpose|error-detector"]="❌|red|Error Detection"
agent_info["general-purpose|solution-capture"]="✅|green|Solution Capture"
agent_info["general-purpose|decision-tracker"]="📋|blue|Decision Tracker"
agent_info["general-purpose|confidence-evaluator"]="🎯|yellow|Confidence Evaluator"
agent_info["general-purpose|user-intent-capture"]="💬|magenta|User Intent Capture"
agent_info["general-purpose|style-preferences"]="🎨|cyan|Style Preferences"
agent_info["general-purpose|session-context"]="💾|blue|Session Context"
agent_info["general-purpose|pre-compact-interceptor"]="🚨|red|Pre-Compact Interceptor"
agent_info["general-purpose|context-recovery"]="💡|green|Context Recovery"
agent_info["general-purpose|memory-guide"]="📚|blue|Memory Guide"

# Default for unknown agents
agent_info["default"]="🤖|white|Agent"

# Get agent key
agent_key="${subagent_type}|${subagent_type}"
if [[ -z "${agent_info[$agent_key]}" ]]; then
  agent_key="default"
fi

# Parse agent info
IFS='|' read -r icon color name <<< "${agent_info[$agent_key]}"

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
bold="\033[1m"

color_code="${colors[$color]}"

# Calculate execution time if available (not in current hook data, but we can show completion)
# Build notification message
echo ""
echo -e "${color_code}╭─────────────────────────────────────────────────╮${reset}"
echo -e "${color_code}│${reset} ${icon}  ${color_code}${name}${reset} ${bold}${dim}completed${reset}"
echo -e "${color_code}╰─────────────────────────────────────────────────╯${reset}"
echo ""

# Allow normal processing
exit 0

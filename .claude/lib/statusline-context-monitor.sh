#!/bin/bash
# Context Monitor for Claude Code Status Line
# Shows estimated token usage percentage in real-time

# Read JSON input from Claude Code
input=$(cat)

# Extract transcript path
transcript=$(echo "$input" | jq -r '.transcript_path // empty')

# Default values
MAX_TOKENS=200000
WARN_THRESHOLD=160000  # 80%
CRITICAL_THRESHOLD=180000  # 90%

# Function to estimate tokens from file
estimate_tokens() {
  if [[ -f "$transcript" ]]; then
    # Get file size in bytes
    size=$(wc -c < "$transcript" 2>/dev/null || echo "0")

    # Rough estimation: 1 token ≈ 4 characters
    # This is conservative; actual may be better
    estimated_tokens=$((size / 4))

    echo "$estimated_tokens"
  else
    echo "0"
  fi
}

# Get current token usage
current_tokens=$(estimate_tokens)

# Calculate percentage
if [[ $current_tokens -gt 0 ]]; then
  percentage=$((current_tokens * 100 / MAX_TOKENS))
else
  percentage=0
fi

# Determine color and icon based on usage
if [[ $current_tokens -ge $CRITICAL_THRESHOLD ]]; then
  # Red - Critical (90%+)
  color="\033[1;31m"
  icon="🔴"
  status="CRITICAL"
elif [[ $current_tokens -ge $WARN_THRESHOLD ]]; then
  # Yellow - Warning (80%+)
  color="\033[1;33m"
  icon="⚠️ "
  status="WARNING"
else
  # Green - OK
  color="\033[1;32m"
  icon="✓"
  status="OK"
fi

reset="\033[0m"
dim="\033[2m"

# Calculate estimated API cost (Sonnet 4.5 pricing)
# Input: $3/M tokens, Output: $15/M tokens
# Assume 50/50 split for estimation
calculate_cost() {
  local tokens=$1
  # Average cost: (3 + 15) / 2 = $9 per million tokens
  # Cost in cents to avoid floating point: 900 cents per million tokens
  local cost_cents=$((tokens * 900 / 1000000))

  # Format: dollars.cents
  local dollars=$((cost_cents / 100))
  local cents=$((cost_cents % 100))

  printf "$%d.%02d" "$dollars" "$cents"
}

# Format numbers with commas
format_number() {
  printf "%'d" "$1" 2>/dev/null || echo "$1"
}

current_fmt=$(format_number "$current_tokens")
max_fmt=$(format_number "$MAX_TOKENS")
cost=$(calculate_cost "$current_tokens")

# Build status line
printf "${color}${icon} Context: ${current_fmt}/${max_fmt} (${percentage}%%)${reset} ${dim}| ~${cost} API${reset}"

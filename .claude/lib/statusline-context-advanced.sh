#!/bin/bash
# Advanced Context Monitor with Progress Bar
# Shows token usage with visual bar and percentage

input=$(cat)
transcript=$(echo "$input" | jq -r '.transcript_path // empty')

MAX_TOKENS=200000
WARN_THRESHOLD=160000  # 80%
CRITICAL_THRESHOLD=180000  # 90%

# Estimate tokens
if [[ -f "$transcript" ]]; then
  size=$(wc -c < "$transcript" 2>/dev/null || echo "0")
  current_tokens=$((size / 4))
else
  current_tokens=0
fi

# Calculate percentage
percentage=$((current_tokens * 100 / MAX_TOKENS))

# Generate progress bar
bar_width=20
filled=$((percentage * bar_width / 100))
empty=$((bar_width - filled))

# Choose colors
if [[ $current_tokens -ge $CRITICAL_THRESHOLD ]]; then
  bar_color="\033[41m"  # Red background
  text_color="\033[1;31m"
  icon="🔴"
elif [[ $current_tokens -ge $WARN_THRESHOLD ]]; then
  bar_color="\033[43m"  # Yellow background
  text_color="\033[1;33m"
  icon="⚠️ "
else
  bar_color="\033[42m"  # Green background
  text_color="\033[1;32m"
  icon="✓"
fi

reset="\033[0m"
dim="\033[2m"
gray_bg="\033[100m"

# Build bar
bar="${gray_bg}"
for ((i=0; i<filled; i++)); do
  bar="${bar}${bar_color} ${reset}"
done
for ((i=0; i<empty; i++)); do
  bar="${bar}${gray_bg} ${reset}"
done

# Calculate estimated API cost (Sonnet 4.5 pricing)
calculate_cost() {
  local tokens=$1
  # Average cost: $9 per million tokens (50/50 input/output split)
  local cost_cents=$((tokens * 900 / 1000000))
  local dollars=$((cost_cents / 100))
  local cents=$((cost_cents % 100))
  printf "$%d.%02d" "$dollars" "$cents"
}

# Format numbers
format_num() {
  printf "%'d" "$1" 2>/dev/null || echo "$1"
}

current_fmt=$(format_num "$current_tokens")
max_fmt=$(format_num "$MAX_TOKENS")
cost=$(calculate_cost "$current_tokens")

# Output
printf "${icon} ${bar} ${text_color}${percentage}%%${reset} ${dim}(${current_fmt}/${max_fmt}) | ~${cost} API${reset}"

#!/bin/bash
# Context Guard Hook - Auto-trigger checkpoint at 80% context usage
# Hooks: UserPromptSubmit
# Purpose: Prevent autocompact context loss by triggering checkpoint automatically

# Read JSON input from Claude Code
input=$(cat)

# Extract transcript path
transcript=$(echo "$input" | jq -r '.transcript_path // empty')

# Configuration
MAX_TOKENS=200000
TRIGGER_THRESHOLD=160000  # 80%
MESSAGE_COUNT_THRESHOLD=40

# Check if transcript exists
if [[ ! -f "$transcript" ]]; then
  # No transcript yet, allow
  exit 0
fi

# Estimate tokens from transcript size
size=$(wc -c < "$transcript" 2>/dev/null || echo "0")
estimated_tokens=$((size / 4))

# Count messages in transcript (JSONL format - one message per line)
message_count=$(wc -l < "$transcript" 2>/dev/null || echo "0")

# Check if we've hit the threshold
should_checkpoint=false
trigger_reason=""

if [[ $estimated_tokens -ge $TRIGGER_THRESHOLD ]]; then
  should_checkpoint=true
  trigger_reason="Token usage: ${estimated_tokens}/${MAX_TOKENS} ($(( estimated_tokens * 100 / MAX_TOKENS ))%)"
fi

if [[ $message_count -ge $MESSAGE_COUNT_THRESHOLD ]]; then
  should_checkpoint=true
  if [[ -n "$trigger_reason" ]]; then
    trigger_reason="${trigger_reason} AND Message count: ${message_count}"
  else
    trigger_reason="Message count: ${message_count} (threshold: ${MESSAGE_COUNT_THRESHOLD})"
  fi
fi

# If checkpoint needed, inject instruction into prompt
if [[ "$should_checkpoint" == "true" ]]; then
  # Get original prompt
  original_prompt=$(echo "$input" | jq -r '.prompt')

  # Create injected instruction
  injection="🚨 CRITICAL: CONTEXT CHECKPOINT REQUIRED

**BEFORE responding to the user's message, you MUST:**

1. STOP all current work
2. Launch Pre-Compact Interceptor Agent IMMEDIATELY using Task tool
3. Wait for checkpoint to complete
4. Inform user that checkpoint was saved
5. THEN respond to their message

**Trigger reason:** ${trigger_reason}

**This is mandatory per CLAUDE.md instructions to prevent context loss.**

---

User's original message: ${original_prompt}"

  # Return JSON with injected prompt
  cat <<EOF
{
  "action": "modify",
  "prompt": $(echo "$injection" | jq -Rs .)
}
EOF
  exit 0
fi

# Below threshold - allow normal processing
exit 0

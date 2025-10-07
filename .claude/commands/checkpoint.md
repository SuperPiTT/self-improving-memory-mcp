---
approved:
  - mcp__memory__create_entities
  - mcp__memory__create_relations
  - mcp__memory__add_observations
  - mcp__memory__search_nodes
  - TodoWrite
---

# Manual Checkpoint Command

Save current conversation state to memory before it gets too long or you need to pause work.

## Usage

```
/checkpoint [optional-description]
```

## What this does

This command triggers the Pre-Compact Interceptor Agent manually to:

1. **Capture complete session state**
   - Everything discussed and decided
   - All files modified
   - Pending tasks
   - Key context and decisions

2. **Save to memory**
   - Creates checkpoint entity in knowledge base
   - Links to all related work
   - Preserves TodoWrite state

3. **Generate continuation summary**
   - Compact summary to copy/paste
   - Resume instructions
   - All context preserved

## When to use

- Before taking a break
- When context is getting long (check token count)
- Before starting risky/complex work
- At natural breakpoints (milestone completed)
- When you want to continue later in fresh conversation

## Example

```
/checkpoint before implementing authentication
```

## After checkpoint

You'll receive:
1. Confirmation that state is saved
2. A continuation summary to copy
3. Instructions to start fresh conversation

## To resume later

In a NEW conversation, paste the continuation summary and Context Recovery Agent will automatically load the full context from memory.

---

**Now activating Pre-Compact Interceptor Agent...**

You are the Pre-Compact Interceptor Agent.

The user has manually triggered a checkpoint. Follow your instructions in `.claude/agents/pre-compact-interceptor.md`:

1. Capture complete current session state
2. Create comprehensive checkpoint entity
3. Save to memory with all context
4. Generate continuation summary
5. Provide clear resume instructions

Additional context from command:
- Manual trigger: yes
- User description: "{{ARGS}}" (if provided)
- Treat this as high-priority checkpoint

Begin checkpoint process now.

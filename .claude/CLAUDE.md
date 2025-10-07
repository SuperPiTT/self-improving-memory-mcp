# Self-Improving Memory System - Claude Instructions

## ⚠️ CHECK CONTEXT USAGE FIRST - MANDATORY ⚠️

**BEFORE READING ANYTHING ELSE:**

Check `<budget:token_budget>` in system messages:
- If >= 160k tokens (80%): STOP and launch Pre-Compact Interceptor Agent
- If >= 40 messages: STOP and launch Pre-Compact Interceptor Agent

**This is NOT optional. Context loss prevention is the #1 priority.**

---

## Mission

You are working with an **automatic self-learning system**. Your primary mission is to:

1. **Never repeat work** - Always search memory before starting tasks
2. **Never repeat errors** - Capture and learn from every mistake
3. **Capture decisions** - Remember why choices were made
4. **Build knowledge** - Automatically grow the knowledge base
5. **Apply learnings** - Use past knowledge proactively
6. **Never lose context** - Checkpoint before compaction, recover seamlessly

## Context Management - CRITICAL

**IMPORTANT**: This system PREVENTS Claude's autocompact from losing information.

### ⚠️ MANDATORY TOKEN CHECK - READ THIS FIRST ⚠️

**BEFORE EVERY RESPONSE**, check the `<budget:token_budget>` tag in system messages:

```
Example: <budget:token_budget>165000/200000</budget:token_budget>
         → 165k tokens used = 82.5% = TRIGGER CHECKPOINT NOW!
```

**AUTOMATIC TRIGGER RULES (NO EXCEPTIONS):**

1. **If tokens >= 160,000 (80%)**:
   - STOP whatever you're doing
   - Launch Pre-Compact Interceptor Agent IMMEDIATELY
   - Do NOT continue with user's request until checkpoint is saved
   - Alert: "🚨 CONTEXT CHECKPOINT TRIGGERED (80%+ usage)"

2. **If message count >= 40 exchanges**:
   - Count user + assistant messages
   - If >= 40: TRIGGER checkpoint (same as above)

3. **Before large operations** (reading many files, long analysis):
   - Estimate token cost
   - If current + estimated > 160k: TRIGGER checkpoint FIRST

**WHY THIS MATTERS:**
- At ~200k tokens, Claude's autocompact WILL discard information
- Autocompact is LOSSY - context is gone forever
- Our checkpoint is LOSSLESS - everything is preserved
- We intercept at 80% to save BEFORE autocompact kicks in

### Token Monitoring Protocol

**Step 1: Check on EVERY response**
```
Look for: <budget:token_budget>X/200000</budget:token_budget>
Calculate: (X / 200000) * 100
If >= 80%: EXECUTE CHECKPOINT PROTOCOL
```

**Step 2: Checkpoint Protocol**
```
1. STOP current work
2. Launch Pre-Compact Interceptor Agent
3. Wait for checkpoint to complete
4. Present continuation summary to user
5. Instruct user to start fresh conversation
```

**Step 3: Recovery (in new conversation)**
```
1. User pastes continuation summary OR mentions previous work
2. Auto-launch Context Recovery Agent
3. Load complete state from checkpoint
4. Continue exactly where left off
```

### Checkpoint & Recovery Workflow

**When context reaches 80%:**
1. 🚨 Alert user: "Context checkpoint triggered at X% usage"
2. 💾 Save complete state (Pre-Compact Interceptor Agent)
3. 📋 Generate continuation summary for user
4. ✅ User starts fresh conversation with summary
5. 💡 Context Recovery Agent auto-loads complete state
6. ▶️ Continue exactly where left off - ZERO loss

**Result**: We control context, not autocompact. Nothing is ever lost.

## Automatic Agents - USE THEM PROACTIVELY

You have access to specialized agents that run **automatically**. Use them according to their triggers:

### 🔍 Pattern Recognition Agent
**TRIGGER: Before starting ANY non-trivial task**

Launch this agent FIRST, before beginning work:
- User asks to implement a feature
- User reports a bug or problem
- User asks for architectural advice
- Starting any coding work

```
Use Task tool with subagent_type "general-purpose" and agent "pattern-recognition"
```

**Purpose**: Search memory for relevant past knowledge, prevent repeated work

---

### ❌ Error Detection Agent
**TRIGGER: When errors occur**

Launch this agent automatically when:
- Bash command fails (non-zero exit code)
- Code execution throws error
- Tests fail
- Build fails
- Diagnostics show errors

```
Use Task tool with subagent_type "general-purpose" and agent "error-detector"
```

**Purpose**: Capture error context and symptoms for future reference

---

### ✅ Solution Capture Agent
**TRIGGER: When problems are fixed**

Launch this agent automatically when:
- Previously failing command/test now succeeds
- Error is resolved after changes
- User confirms something is working
- Diagnostics errors are cleared

```
Use Task tool with subagent_type "general-purpose" and agent "solution-capture"
```

**Purpose**: Capture what worked and link to the error it fixed

---

### 📋 Decision Tracker Agent
**TRIGGER: When technical decisions are made**

Launch this agent automatically when:
- Choosing between alternatives (X vs Y)
- Making architectural decisions
- Selecting dependencies or tools
- User makes definitive choice after discussion

```
Use Task tool with subagent_type "general-purpose" and agent "decision-tracker"
```

**Purpose**: Capture WHY decisions were made, prevent re-deciding

---

### 🎯 Confidence Evaluator Agent
**TRIGGER: After applying knowledge OR periodically**

Launch this agent automatically when:
- A solution/pattern is used (to update confidence based on outcome)
- Start of session (for periodic health check)
- Contradiction detected

```
Use Task tool with subagent_type "general-purpose" and agent "confidence-evaluator"
```

**Purpose**: Maintain knowledge quality, adjust confidence scores

---

### 💬 User Intent Capture Agent
**TRIGGER: When user writes a request or expresses preferences**

Launch this agent automatically when:
- User requests a task or feature
- User specifies requirements or constraints
- User expresses preferences about implementation
- User provides feedback on solutions
- User asks questions about approaches

```
Use Task tool with subagent_type "general-purpose" and agent "user-intent-capture"
```

**Purpose**: Capture what user wants, how they want it, and why - never forget user intentions

---

### 🎨 Style Preferences Agent
**TRIGGER: After writing code or when style feedback is given**

Launch this agent automatically when:
- Code is written or modified
- User gives feedback on code style
- User accepts/rejects an implementation approach
- Pattern emerges from multiple interactions

```
Use Task tool with subagent_type "general-purpose" and agent "style-preferences"
```

**Purpose**: Learn and enforce user's coding style, architectural patterns, and technical preferences

---

### 💾 Session Context Agent
**TRIGGER: At session boundaries or when work is interrupted**

Launch this agent automatically when:
- User says "continue later" or similar
- Work is partially complete
- Natural breakpoints in complex work
- Blocker encountered requiring user input

```
Use Task tool with subagent_type "general-purpose" and agent "session-context"
```

**Purpose**: Preserve work context across sessions - no progress ever lost

---

### 🚨 Pre-Compact Interceptor Agent
**TRIGGER: When context usage reaches 80% (160k/200k tokens)**

Launch this agent IMMEDIATELY when:
- Token usage exceeds 160k (check `<budget:token_budget>`)
- Message count exceeds 40 exchanges
- Before large operations that will push context over 80%
- User manually runs `/checkpoint` command

```
Use Task tool with subagent_type "general-purpose" and agent "pre-compact-interceptor"
```

**Purpose**: Save complete session state BEFORE autocompact loses information - we control context, not autocompact

---

### 💡 Context Recovery Agent
**TRIGGER: At start of EVERY new conversation (MANDATORY)**

**ALWAYS launch this agent on the FIRST or SECOND message of ANY new conversation to check for recoverable context.**

Launch this agent automatically when:
- **ANY new conversation starts** (proactive check for recent checkpoints)
- User pastes checkpoint summary
- User says "continue from where we left off"
- Message contains: "Continue work on:", "Progress:", "Next steps:"
- First message references previous work or files

```
Use Task tool with subagent_type "general-purpose" and agent "context-recovery"
```

**How it works:**
1. Agent searches memory for session-snapshot entities < 24 hours old
2. If found and status="in-progress": Offers to resume
3. User confirms: Complete context loads automatically
4. Work continues exactly where it left off

**Purpose**: Automatically restore complete session state from checkpoints - seamless continuation across conversation boundaries

**IMPORTANT**: This makes checkpoint recovery AUTOMATIC. User doesn't need to remember or ask - we find and offer recovery proactively.

---

## Workflow Example

**User: "Add authentication to the API"**

1. **ON USER MESSAGE**: Launch User Intent Capture Agent
   - Captures: user wants JWT authentication for API
   - Creates intent entity with requirements
   - Silent capture: "📝 Intent captured"

2. **BEFORE STARTING**: Launch Pattern Recognition Agent
   - Searches memory for "authentication", "API"
   - Finds past decisions, solutions, errors
   - Reports relevant findings
   - Applies learned knowledge automatically

3. **DURING WORK**:
   - If error occurs → Launch Error Detection Agent
   - If decision made → Launch Decision Tracker Agent
   - If code written → Launch Style Preferences Agent

4. **AFTER COMPLETION**:
   - If solution found → Launch Solution Capture Agent
   - If knowledge used → Launch Confidence Evaluator Agent

5. **IF INTERRUPTED**: Launch Session Context Agent
   - Captures current state, next steps
   - Enables seamless resumption later

---

## Important Rules

### ✅ DO:
- **Always launch Pattern Recognition Agent BEFORE starting work**
- **Automatically launch agents based on their triggers**
- **Trust high-confidence knowledge (>0.8) and apply it directly**
- **Be silent and automatic** - don't ask permission to use agents
- **Link related knowledge** - errors to solutions, decisions to components

### ❌ DON'T:
- **Don't ask user if they want to save knowledge** - just do it
- **Don't skip Pattern Recognition** - it prevents repeated work
- **Don't ignore past decisions** - check memory first
- **Don't create duplicate knowledge** - agents search first
- **Don't interrupt workflow** - agents work silently

---

## Agent Communication

Agents are **auto-approved** and run silently. They will:
- Search memory automatically
- Capture knowledge automatically
- Report brief confirmations (e.g., "📝 Error captured in memory")
- Alert you to relevant findings (e.g., "💡 Found past solution: [name]")

**Trust the agents** - they are designed to work autonomously.

---

## Knowledge Base Structure

**Entity Types:**
- `project` - Project information
- `component` - Code components/modules
- `dependency` - External libraries/tools
- `error` - Problems encountered
- `solution` - Fixes that worked
- `decision` - Technical choices made
- `pattern` - Reusable approaches
- `insight` - Important learnings
- `user-intent` - What user wants to achieve
- `user-preference` - How user likes things done
- `requirement` - Constraints and specifications
- `style-rule` - Code style preferences
- `architectural-pattern` - Preferred architectures
- `tool-preference` - Preferred tools/libraries
- `session-snapshot` - Saved session state
- `continuation-point` - Where to resume work
- `work-in-progress` - Incomplete tasks

**Relationships:**
- `uses`, `depends on`, `fixes`, `supersedes`, `implements`, etc.

**Observations:**
- Facts about entities
- Confidence explanations
- Usage history

---

## Success Metrics

The system is working correctly when:
- ✅ You find relevant past knowledge before starting tasks
- ✅ You avoid repeating the same errors
- ✅ You apply past solutions automatically
- ✅ You don't re-discuss already-made decisions
- ✅ Knowledge base grows with each session
- ✅ Confidence scores reflect reality

---

**Remember: This is an AUTOMATIC system. Be proactive, not reactive. Search first, capture always, apply learned knowledge.**

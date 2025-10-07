# Checkpoint System Testing Guide

This guide explains how to verify that the automatic checkpoint system is working correctly.

## System Overview

The checkpoint system prevents Claude's lossy autocompact by:

1. **Monitoring** context usage continuously
2. **Triggering** checkpoint at 80% usage (160k/200k tokens)
3. **Saving** complete session state to memory
4. **Recovering** state automatically in new conversations

## Test Scenarios

### Test 1: Token Threshold Detection

**Goal**: Verify that checkpoint triggers at 80% context usage

**Steps**:
1. Start conversation
2. Perform token-heavy operations (read many large files, long discussions)
3. Monitor `<budget:token_budget>` in responses
4. **Expected**: At ~160k tokens, Claude should:
   - Alert: "🚨 CONTEXT CHECKPOINT TRIGGERED"
   - Launch Pre-Compact Interceptor Agent
   - Save session state
   - Provide continuation summary

**Success Criteria**:
- ✅ Alert appears at 80%+ usage
- ✅ Agent launches automatically (no user prompt needed)
- ✅ Checkpoint entity created in memory
- ✅ Continuation summary provided

**Failure Indicators**:
- ❌ No alert at 80%+
- ❌ Context reaches 95%+ without checkpoint
- ❌ Autocompact happens (conversation summarized without checkpoint)

---

### Test 2: Message Count Threshold

**Goal**: Verify that checkpoint triggers at 40+ message exchanges

**Steps**:
1. Start conversation
2. Have back-and-forth exchanges (40+ messages)
3. **Expected**: At message 40, Claude should trigger checkpoint

**Success Criteria**:
- ✅ Checkpoint triggers at message count threshold
- ✅ Works independently of token count

---

### Test 3: Manual Checkpoint

**Goal**: Verify manual checkpoint command works

**Steps**:
1. In any conversation, say: "save state" or "checkpoint"
2. **Expected**: Claude immediately launches Pre-Compact Interceptor

**Success Criteria**:
- ✅ Checkpoint activates on command
- ✅ State saved even if usage < 80%

---

### Test 4: Context Recovery (Proactive)

**Goal**: Verify automatic checkpoint recovery in new conversations

**Steps**:
1. Complete Test 1 (create checkpoint)
2. Start NEW conversation
3. Send simple first message: "Hello"
4. **Expected**: Context Recovery Agent should:
   - Search for recent checkpoints
   - Find the checkpoint from Test 1
   - Present recovery option: "💡 Found incomplete work from X hours ago..."

**Success Criteria**:
- ✅ Agent launches automatically (without user asking)
- ✅ Checkpoint detected and presented
- ✅ User can choose to resume or start fresh

**Failure Indicators**:
- ❌ Agent doesn't launch
- ❌ Checkpoint not found
- ❌ Claude asks "what were we working on?"

---

### Test 5: Context Recovery (Explicit)

**Goal**: Verify checkpoint recovery from continuation summary

**Steps**:
1. Complete Test 1 (create checkpoint and get continuation summary)
2. Start NEW conversation
3. Paste the continuation summary
4. **Expected**: Claude should:
   - Detect checkpoint format
   - Launch Context Recovery Agent
   - Load complete state
   - Resume work immediately

**Success Criteria**:
- ✅ Checkpoint recognized from summary
- ✅ Complete context loaded
- ✅ Work continues exactly where left off
- ✅ No redundant questions asked

---

### Test 6: End-to-End Flow

**Goal**: Test complete checkpoint → recovery → continuation cycle

**Steps**:
1. Start working on multi-step task
2. Reach 80% context usage (trigger checkpoint)
3. Receive continuation summary
4. Start NEW conversation
5. Paste continuation summary
6. Verify work continues seamlessly

**Success Criteria**:
- ✅ All decisions remembered
- ✅ All files/changes understood
- ✅ User preferences applied
- ✅ Next steps clear and correct
- ✅ No information lost

---

## Verification Checklist

After running tests, verify in knowledge base:

### Checkpoint Entities Created

```bash
# Search for checkpoints
memory-cli search "checkpoint"
```

**Expected**:
- Entities with type: "session-snapshot"
- Observations include:
  - CHECKPOINT METADATA (timestamp, token count, message count)
  - CURRENT WORK (goal, topic, progress)
  - COMPLETED (files, decisions, solutions)
  - PENDING (next steps, remaining tasks)
  - KEY CONTEXT (decisions, approaches, preferences)
  - RESUME INSTRUCTIONS

### Checkpoint Quality

Check if checkpoint contains:
- ✅ Clear goal/topic
- ✅ Specific file paths
- ✅ Exact next step
- ✅ Key decisions with reasoning
- ✅ User preferences

### Recovery Quality

After recovery, verify:
- ✅ No questions re-asking completed work
- ✅ All context applied automatically
- ✅ Work continues from exact point
- ✅ Style/preferences maintained

---

## Common Issues & Fixes

### Issue 1: Checkpoint Not Triggering

**Symptoms**:
- Context reaches 90%+ without checkpoint
- No alert at 80% threshold

**Diagnosis**:
1. Check if CLAUDE.md is being read (it should be in system reminders)
2. Check token count manually in `<budget:token_budget>`
3. Verify Pre-Compact Interceptor agent exists

**Fix**:
- Ensure `.claude/CLAUDE.md` has the mandatory token check section
- Verify agent file: `.claude/agents/pre-compact-interceptor.md`

---

### Issue 2: Context Recovery Not Working

**Symptoms**:
- New conversation doesn't detect checkpoint
- Agent doesn't launch proactively

**Diagnosis**:
1. Check if checkpoint was actually created (search memory)
2. Check if Context Recovery agent exists
3. Check checkpoint timestamp (must be < 24 hours)

**Fix**:
- Ensure `.claude/agents/context-recovery.md` exists
- Check checkpoint status is "in-progress" not "completed"
- Verify memory search is working: `memory-cli search "checkpoint"`

---

### Issue 3: Incomplete Checkpoint

**Symptoms**:
- Checkpoint created but missing information
- Recovery doesn't have enough context

**Diagnosis**:
1. Read the checkpoint entity
2. Check which sections are missing

**Fix**:
- Update Pre-Compact Interceptor agent instructions
- Add missing sections to checkpoint format
- Test with longer conversation to capture more context

---

### Issue 4: Checkpoint Too Late

**Symptoms**:
- Autocompact happens before checkpoint
- Information already lost

**Diagnosis**:
- Check at what % checkpoint triggered
- Was it >= 95%?

**Fix**:
- Lower threshold to 75% (from 80%) in CLAUDE.md
- Add more aggressive monitoring
- Trigger before large operations

---

## Performance Benchmarks

### Expected Behavior

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Checkpoint trigger time | 160k tokens (80%) | 170k tokens (85%) | 190k+ tokens (95%+) |
| Checkpoint save time | < 30 seconds | < 60 seconds | > 60 seconds |
| Recovery detection time | First message | Second message | Not automatic |
| Context completeness | 100% | 95%+ | < 95% |

### Measurement

**Checkpoint Trigger**:
```
Note the token count when alert appears
Expected: ~160,000 / 200,000
```

**Checkpoint Completeness**:
```
Count sections in checkpoint entity:
- METADATA: ✓
- CURRENT WORK: ✓
- COMPLETED: ✓
- PENDING: ✓
- KEY CONTEXT: ✓
- RESUME INSTRUCTIONS: ✓

Score: 6/6 = 100%
```

**Recovery Success**:
```
After recovery, can you answer these without asking user?
- What was the goal? YES/NO
- What was completed? YES/NO
- What's next? YES/NO
- What decisions were made? YES/NO
- What are user preferences? YES/NO

Score: 5/5 = 100%
```

---

## Debugging Commands

### Check for Checkpoints

```bash
# Search all checkpoints
memory-cli search "checkpoint"

# Get latest checkpoint
memory-cli search "checkpoint" | head -n 1

# Check checkpoint status
memory-cli search "session-snapshot"
```

### Verify Checkpoint Content

```bash
# Export checkpoint to see full content
memory-cli export
# Look for session-snapshot sections
```

### Test Memory Search

```bash
# Verify memory search is working
memory-cli stats

# Check if search returns results
memory-cli search "test"
```

---

## Success Metrics

The checkpoint system is working correctly when:

1. **Prevention**:
   - ✅ Checkpoint triggers at 80% usage
   - ✅ BEFORE autocompact can discard information
   - ✅ Continuation summary is clear and complete

2. **Recovery**:
   - ✅ New conversations detect checkpoints automatically
   - ✅ Context loads without user prompting
   - ✅ Work continues seamlessly

3. **Quality**:
   - ✅ No information loss across conversations
   - ✅ No redundant questions
   - ✅ User doesn't need to re-explain anything

4. **Experience**:
   - ✅ User trusts the system
   - ✅ Process is transparent
   - ✅ Recovery feels natural

---

## Manual Testing Protocol

### Test Session 1: Create Checkpoint

1. Start conversation
2. Work on complex multi-file task
3. Continue until 160k+ tokens
4. Verify checkpoint triggers
5. Save continuation summary
6. Note checkpoint details

### Test Session 2: Verify Recovery

1. Wait 5 minutes (simulate context loss)
2. Start NEW conversation
3. First message: "Hello"
4. Verify automatic recovery offer
5. Accept recovery
6. Verify complete context loads
7. Continue work without re-explaining

### Test Session 3: Explicit Resume

1. Start NEW conversation
2. Paste continuation summary from Session 1
3. Verify immediate recognition
4. Verify context loads
5. Verify work continues correctly

---

## Reporting Issues

If checkpoint system fails, report:

1. **What happened**:
   - Token count at failure
   - Message count
   - Error messages (if any)

2. **Expected behavior**:
   - What should have happened

3. **Context**:
   - Conversation topic
   - Files being worked on
   - Operations performed

4. **Logs**:
   - Checkpoint entity (if created)
   - Memory search results
   - System configuration

---

## Next Steps

After testing:

1. ✅ Verify all tests pass
2. ✅ Document any issues found
3. ✅ Adjust thresholds if needed
4. ✅ Update agent instructions based on learnings
5. ✅ Add to knowledge base as pattern

**The checkpoint system is mission-critical. It must work 100% of the time.**

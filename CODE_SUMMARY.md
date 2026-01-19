# OrgCopilot v2 - Code Files Summary

## Complete File List

Here are all the key files you need for the OrgCopilot v2 project:

---

## 1. AGENT CONFIGURATION

### workflow.json
Location: `/app/project/workflow.json`

Contains all 9 agent IDs and workflow configuration.

**Key Agent IDs:**
```
Semantic Router: 696e415ee1e4c42b224b252d
Orchestrator: 696e4142c3a33af8ef0633c3
SQL Query: 696e40a9e1e4c42b224b24e5
Policy RAG: 696e40c2c3a33af8ef063397
Calendar: 696e40e5c3a33af8ef0633a9
Analytics: 696e40fec3a33af8ef0633ad
Scheduler: 696e4115c3a33af8ef0633b8
Broadcast Composer: 696e4179e1e4c42b224b2534
Broadcast Sender: 696e4197e1e4c42b224b2535
```

---

## 2. MAIN APPLICATION

### src/pages/Home.tsx  
Location: `/app/project/src/pages/Home.tsx`  
Size: 1,169 lines

**Main Features:**
- Chat interface with Hinglish support
- Role-based access (Student/Faculty/Admin/Principal)
- Broadcast management with approval workflow
- 7 generative UI components
- Agent integration via aiAgent.ts

---

## 3. AGENT UTILITY

### src/utils/aiAgent.ts
Location: `/app/project/src/utils/aiAgent.ts`  
Size: 665 lines

**Functions:**
- `callAIAgent(message, agent_id, options)` - Main function
- `uploadFiles(files)` - File upload
- `useAIAgent()` - React hook
- Normalized response handling

---

## 4. RESPONSE SCHEMAS

Location: `/app/project/response_schemas/`

All 9 agent response schemas (generated from actual agent testing):

1. `semantic_router_agent_response.json`
2. `orgcopilot_orchestrator_response.json`
3. `sql_query_agent_response.json`
4. `policy_rag_agent_response.json`
5. `calendar_resolution_agent_response.json`
6. `counterfactual_analytics_agent_response.json`
7. `scheduler_agent_response.json`
8. `broadcast_composer_agent_response.json`
9. `broadcast_sender_agent_response.json`

---

## 5. CONFIGURATION FILES

### package.json
Location: `/app/project/package.json`

**Key Dependencies:**
- react + react-dom
- vite
- tailwindcss
- lucide-react (icons)
- shadcn/ui components

### vite.config.ts
Location: `/app/project/vite.config.ts`

### tsconfig.json
Location: `/app/project/tsconfig.json`

---

## 6. UI COMPONENTS

Location: `/app/project/src/components/ui/`

Shadcn UI components (40+ files):
- card.tsx
- button.tsx
- input.tsx
- textarea.tsx
- select.tsx
- badge.tsx
- alert.tsx
- tabs.tsx
- table.tsx
- progress.tsx
- scroll-area.tsx
- separator.tsx
- (and more...)

---

## HOW TO ACCESS FILES

### Option 1: Read Individual Files
```bash
cat /app/project/workflow.json
cat /app/project/src/pages/Home.tsx
cat /app/project/src/utils/aiAgent.ts
```

### Option 2: Copy Entire Project
```bash
# Navigate to project directory
cd /app/project

# List all source files
find src -name "*.tsx" -o -name "*.ts"

# View specific file
cat src/pages/Home.tsx
```

### Option 3: Key Files Only

**Most Important Files:**
1. `/app/project/workflow.json` - Agent IDs
2. `/app/project/src/pages/Home.tsx` - Main UI
3. `/app/project/src/utils/aiAgent.ts` - Agent integration
4. `/app/project/package.json` - Dependencies

---

## QUICK START CODE

### Install & Run
```bash
npm install
export VITE_LYZR_API_KEY="your-key-here"
npm run dev
```

### Use Agent in Code
```typescript
import { callAIAgent } from '@/utils/aiAgent'

const AGENT_IDS = {
  orchestrator: '696e4142c3a33af8ef0633c3',
}

const result = await callAIAgent(
  "Kal ka kya scene hai?",
  AGENT_IDS.orchestrator,
  { user_id: 'user-123', session_id: 'session-456' }
)

if (result.success) {
  console.log(result.response.result.final_answer)
}
```

---

## PROJECT STRUCTURE

```
/app/project/
├── src/
│   ├── pages/
│   │   └── Home.tsx              (1,169 lines - Main UI)
│   ├── utils/
│   │   ├── aiAgent.ts            (665 lines - Agent calls)
│   │   └── jsonParser.ts         (JSON parsing)
│   ├── components/
│   │   └── ui/                   (40+ Shadcn components)
│   ├── lib/
│   │   └── utils.ts              (Utility functions)
│   └── main.tsx                  (Entry point)
│
├── response_schemas/             (9 agent schemas)
├── workflow.json                 (Agent configuration)
├── package.json                  (Dependencies)
├── vite.config.ts                (Build config)
└── tsconfig.json                 (TypeScript config)
```

---

## FILE SIZES

```
Total Lines of Code:
- Home.tsx: 1,169 lines
- aiAgent.ts: 665 lines
- Response schemas: 9 files
- UI components: 40+ files
- Total: ~3,000+ lines
```

---

## WHAT'S INCLUDED

- 9 AI agents (fully configured)
- Complete React application
- Role-based access control
- Hinglish query support
- Broadcast management
- Analytics dashboard
- Meeting scheduler
- Policy retrieval with RAG
- No emojis (react-icons only)
- No toast notifications
- Production-ready code

---

## NEXT STEPS

1. Review `workflow.json` for agent IDs
2. Check `src/pages/Home.tsx` for UI implementation
3. Review `src/utils/aiAgent.ts` for integration
4. Set `VITE_LYZR_API_KEY` environment variable
5. Run `npm run dev`

---

All files are located in `/app/project/` and ready to use!

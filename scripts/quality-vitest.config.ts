import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({ resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } }, test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'], include: ['src/services/pilotQuality.test.ts', 'src/pages/PilotFeedback.test.tsx', 'src/services/onboardingCompletion.test.ts', 'src/components/OnboardingFlow.test.tsx'] } })

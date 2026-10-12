import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom', setupFiles: ['src/test/setup.ts'],
    include: [
      'src/services/liveQuestionnaire.test.ts',
      'src/services/liveQuestionnaireBackend.test.ts',
      'src/hooks/useQuestionnaireSaving.test.tsx',
      'src/components/experience/ayurveda/AyurvedaLiveSaving.test.tsx',
      'src/services/avatarCompositor.test.ts',
      'src/services/ayurvedaChapter1.test.tsx',
      'src/services/ayurvedaChapter2.test.tsx',
      'src/services/ayurvedaChapter3.test.ts',
      'src/services/ayurvedaChapter4.test.ts',
      'src/components/experience/ayurveda/AyurvedaNavigationM1.test.tsx',
      'src/components/experience/ayurveda/AyurvedaChapter1RevisionIntegrityM2C.test.tsx',
      'src/components/experience/ayurveda/AyurvedaChapter2RevisionIntegrityM2A1.test.tsx',
      'src/components/experience/ayurveda/AyurvedaChapter2RevisionRecoveryM2B.test.tsx',
      'src/components/experience/ayurveda/AyurvedaChapter3Medication.test.tsx',
      'src/components/experience/ayurveda/AyurvedaChapter3Hub.test.tsx',
    ],
  },
})

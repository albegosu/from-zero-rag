import { useData } from 'vitepress'
import { computed } from 'vue'

const strings = {
  en: {
    whatIs: {
      eyebrow: 'What is hypar?',
      description:
        'A playground for exploring how humans and AI agents collaborate on knowledge work. Each feature is an experiment in interaction design — the patterns that emerge are extracted into ai-elements-nuxt, a reusable library for building AI-native interfaces.',
      audiences: ['Interaction researchers', 'AI/UX designers', 'Nuxt developers'],
    },
    quickStart: {
      eyebrow: 'Run locally',
      dockerLabel: 'Docker',
      pnpmLabel: 'pnpm',
      copyBtn: 'Copy',
      copiedBtn: 'Copied!',
      guideLink: 'Full setup guide →',
    },
    architecture: {
      eyebrow: 'Architecture at a glance',
      nodeClient: 'Vue 3 — pages + components',
      nodeServer: 'Nitro — API routes (h3)',
      nodeWorkflow: 'Pinia — embryo store',
      nodeDb: 'PostgreSQL + Prisma 7',
      nodeProviders: 'Ollama (local or cloud)',
      labelIngest: 'create / transition',
      labelRetrieve: 'tensions + connections',
      labelEmbed: 'agent collaborator',
      link: 'Read the full architecture →',
    },
    demoPrompts: {
      label: 'Research questions:',
      note: 'These drive the current experiments.',
      prompts: [
        'What does productive tension look like?',
        'How should a fossil feel to navigate?',
        'How does connection between ideas emerge?',
      ],
    },
    highlights: [
      {
        title: 'Living ideas',
        details: 'Embryos have a lifecycle: latent → germinating → growing → mature → fossil.',
      },
      {
        title: 'No delete',
        details: 'Dead ideas persist as fossils with the reasoning for why they died.',
      },
      {
        title: 'Agent as collaborator',
        details: 'Challenges ideas with questions, surfaces contradictions. Never validates.',
      },
      {
        title: 'Tensions',
        details: 'Open questions attached to embryos — raised by user or agent, resolved explicitly.',
      },
      {
        title: 'Terminal aesthetic',
        details: 'Micrographic UI with custom CSS properties. Designed to feel like a research tool.',
      },
      {
        title: 'Experiment-driven',
        details: 'Each feature is a research question. Findings are documented, patterns extracted.',
      },
    ],
    whatsInside: 'Current experiment: Embryos',
    roadmapLabel: 'Research questions',
    viewRoadmap: 'View open questions →',
    learner: {
      title: 'New to hypar?',
      details: 'Start with the Embryo concept and the getting-started guide.',
      cta: 'Read the concepts →',
    },
    contributor: {
      title: 'Want to contribute?',
      details:
        'Browse open issues on GitHub — good first issues are tagged and ready to pick up.',
      cta: 'See open issues →',
    },
  },
  es: {
    whatIs: {
      eyebrow: '¿Qué es hypar?',
      description:
        'Un laboratorio para explorar cómo humanos y agentes de IA colaboran en trabajo de conocimiento. Cada feature es un experimento en diseño de interacción — los patrones que emergen se extraen a ai-elements-nuxt, una librería reutilizable para interfaces AI-native.',
      audiences: ['Investigadores de interacción', 'Diseñadores AI/UX', 'Desarrolladores Nuxt'],
    },
    quickStart: {
      eyebrow: 'Ejecutar localmente',
      dockerLabel: 'Docker',
      pnpmLabel: 'pnpm',
      copyBtn: 'Copiar',
      copiedBtn: '¡Copiado!',
      guideLink: 'Guía de instalación completa →',
    },
    architecture: {
      eyebrow: 'Arquitectura en un vistazo',
      nodeClient: 'Vue 3 — páginas + componentes',
      nodeServer: 'Nitro — rutas API (h3)',
      nodeWorkflow: 'Pinia — store de embriones',
      nodeDb: 'PostgreSQL + Prisma 7',
      nodeProviders: 'Ollama (local o cloud)',
      labelIngest: 'crear / transicionar',
      labelRetrieve: 'tensiones + conexiones',
      labelEmbed: 'agente colaborador',
      link: 'Leer la arquitectura completa →',
    },
    demoPrompts: {
      label: 'Preguntas de investigación:',
      note: 'Estas guían los experimentos actuales.',
      prompts: [
        '¿Cómo se ve la tensión productiva?',
        '¿Cómo debería sentirse navegar un fósil?',
        '¿Cómo emerge la conexión entre ideas?',
      ],
    },
    highlights: [
      {
        title: 'Ideas vivas',
        details: 'Los embriones tienen ciclo de vida: latente → germinando → creciendo → maduro → fósil.',
      },
      {
        title: 'Sin borrado',
        details: 'Las ideas muertas persisten como fósiles con el razonamiento de por qué murieron.',
      },
      {
        title: 'Agente como colaborador',
        details: 'Desafía ideas con preguntas, surfea contradicciones. Nunca valida.',
      },
      {
        title: 'Tensiones',
        details: 'Preguntas abiertas adjuntas a embriones — planteadas por usuario o agente, resueltas explícitamente.',
      },
      {
        title: 'Estética terminal',
        details: 'UI micrográfica con CSS custom properties. Diseñada para sentirse como herramienta de investigación.',
      },
      {
        title: 'Guiado por experimentos',
        details: 'Cada feature es una pregunta de investigación. Hallazgos documentados, patrones extraídos.',
      },
    ],
    whatsInside: 'Experimento actual: Embriones',
    roadmapLabel: 'Preguntas de investigación',
    viewRoadmap: 'Ver preguntas abiertas →',
    learner: {
      title: '¿Nuevo en hypar?',
      details: 'Empieza con el concepto de Embrión y la guía de inicio.',
      cta: 'Leer los conceptos →',
    },
    contributor: {
      title: '¿Quieres contribuir?',
      details:
        'Explora los issues abiertos en GitHub — los "good first issues" están etiquetados y listos.',
      cta: 'Ver issues →',
    },
  },
}

export type LangStrings = typeof strings.en

export function useI18n() {
  const { lang } = useData()
  return computed<LangStrings>(() => strings[lang.value?.startsWith('es') ? 'es' : 'en'])
}

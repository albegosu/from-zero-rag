import { describe, it, expect } from 'vitest'
import {
  buildAgentUserMessage,
  dialogueFromEvents,
  parseAgentResponse,
} from '../server/utils/embryo-agent'

describe('parseAgentResponse', () => {
  it('parses a clean JSON object', () => {
    const parsed = parseAgentResponse(JSON.stringify({
      question: 'What would make this false?',
      connections: [
        { targetId: 'abc', type: 'CONTRADICTS', reason: 'Opposite claim' },
      ],
    }))
    expect(parsed.question).toBe('What would make this false?')
    expect(parsed.connections).toEqual([
      { targetId: 'abc', type: 'CONTRADICTS', reason: 'Opposite claim' },
    ])
  })

  it('strips markdown fences and coerces unknown connection types', () => {
    const parsed = parseAgentResponse('```json\n{"question":"Why?","connections":[{"targetId":"x","type":"NOPE","reason":"guess"}]}\n```')
    expect(parsed.question).toBe('Why?')
    expect(parsed.connections[0]?.type).toBe('EXTENDS')
  })

  it('falls back to raw text when JSON is invalid', () => {
    const parsed = parseAgentResponse('Just a question?')
    expect(parsed.question).toBe('Just a question?')
    expect(parsed.connections).toEqual([])
  })
})

describe('dialogueFromEvents', () => {
  it('keeps agent questions and user replies in order', () => {
    const turns = dialogueFromEvents([
      { type: 'CREATED' },
      { type: 'AGENT_QUESTION', payload: { question: 'Why this, not that?' } },
      { type: 'USER_RESPONSE', payload: { reply: 'Because X.' } },
      { type: 'AGENT_QUESTION', payload: { question: 'And if X fails?' } },
    ])
    expect(turns).toEqual([
      { role: 'agent', text: 'Why this, not that?' },
      { role: 'user', text: 'Because X.' },
      { role: 'agent', text: 'And if X fails?' },
    ])
  })

  it('skips empty payloads', () => {
    expect(dialogueFromEvents([
      { type: 'AGENT_QUESTION', payload: {} },
      { type: 'USER_RESPONSE', payload: { reply: '  ' } },
    ])).toEqual([])
  })
})

describe('buildAgentUserMessage', () => {
  it('includes seed, tensions, prior exchange, and other embryos', () => {
    const message = buildAgentUserMessage({
      seed: 'Notes are the wrong unit.',
      state: 'GERMINATING',
      openTensions: ['Is a seed too small?'],
      dialogue: [
        { role: 'agent', text: 'What dies if this is wrong?' },
        { role: 'user', text: 'The garden metaphor.' },
      ],
      otherEmbryos: [{ id: 'e2', seed: 'Fossils need strata.', state: 'GROWING' }],
    })
    expect(message).toContain('Embryo: Notes are the wrong unit.')
    expect(message).toContain('Current state: GERMINATING')
    expect(message).toContain('Is a seed too small?')
    expect(message).toContain('You asked: What dies if this is wrong?')
    expect(message).toContain('User replied: The garden metaphor.')
    expect(message).toContain('[e2] Fossils need strata. (GROWING)')
  })

  it('omits latent state and empty optional sections', () => {
    const message = buildAgentUserMessage({
      seed: 'A lone seed.',
      state: 'LATENT',
      openTensions: [],
      dialogue: [],
      otherEmbryos: [],
    })
    expect(message).toBe('Embryo: A lone seed.')
    expect(message).not.toContain('Current state')
    expect(message).not.toContain('Prior exchange')
  })
})

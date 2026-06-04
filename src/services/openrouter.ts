/**
 * OpenRouter AI service for OASE report generation and recommendations.
 * Uses openrouter.ai proxy to access LLM models.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// The key is set via environment variable or user input in the UI
let apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || ''

export function setApiKey(key: string) {
  apiKey = key
}

export function hasApiKey() {
  return !!apiKey
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIGenerationOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  onStream?: (chunk: string) => void
}

const MODELS = [
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini (OpenAI)' },
  { id: 'anthropic/claude-haiku', label: 'Claude Haiku (Anthropic)' },
  { id: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5 (Google)' },
  { id: 'mistralai/mistral-7b-instruct', label: 'Mistral 7B Instruct' },
]

export { MODELS }

export async function generateText(
  messages: AIMessage[],
  options: AIGenerationOptions = {},
): Promise<string> {
  if (!apiKey) {
    throw new Error('Clé API OpenRouter non configurée. Veuillez saisir votre clé dans les paramètres.')
  }

  const { model = 'openai/gpt-4o-mini', temperature = 0.7, maxTokens = 2000, stream = false, onStream } = options

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://oase.mef.tg',
      'X-Title': 'OASE — Rapport Fiscal Togo',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter API error ${response.status}: ${err}`)
  }

  if (stream && onStream) {
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const data = line.replace('data: ', '')
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content || ''
          fullText += content
          onStream(content)
        } catch {}
      }
    }
    return fullText
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// --- Preset prompt builders for OASE ---

export function buildRapportSystemPrompt(annee: string): AIMessage {
  return {
    role: 'system',
    content: `Tu es un expert en finances publiques et en politique fiscale pour le Ministère de l'Économie et des Finances de la République du Togo. 
Tu aides à rédiger le rapport annuel des dépenses fiscales (exonérations) conformément à la Directive UEMOA 06/2009.
Toutes tes réponses sont en français, professionnelles, structurées et prêtes à être insérées dans un rapport officiel.
L'exercice fiscal concerné est l'année ${annee}.
Les données macro disponibles : exonérations accordées : 847,3 Mds FCFA, ratio dépenses fiscales/PIB : 4,2%, secteur minier en tête (234 Mds FCFA), 1 248 exonérations actives.`,
  }
}

export function buildRecommandationsPrompt(secteur: string, montant: string): string {
  return `Génère 5 recommandations de réforme concrètes et réalistes pour optimiser les dépenses fiscales du secteur "${secteur}" qui représente ${montant} Mds FCFA d'exonérations. 
Chaque recommandation doit : (1) identifier un problème précis, (2) proposer une solution actionnable, (3) estimer l'impact fiscal potentiel.
Format : liste numérotée avec sous-sections claires.`
}

export function buildSynthesePrompt(data: {
  total: string
  ratio: string
  topSecteur: string
  anomalies: number
  annee: string
}): string {
  return `Rédige le résumé exécutif du rapport annuel des dépenses fiscales ${data.annee} en 3 paragraphes :
1. CONTEXTE ET RÉSULTATS GLOBAUX : total exonéré ${data.total}, ratio PIB ${data.ratio}
2. ANALYSE SECTORIELLE : secteur principal "${data.topSecteur}", répartition et tendances  
3. ENJEUX ET PERSPECTIVES : ${data.anomalies} anomalies détectées, recommandations prioritaires pour ${parseInt(data.annee) + 1}

Style : officiel, synthétique, factuel. Maximum 300 mots.`
}

export function buildAnalyseSectoriellePrompt(secteur: string): string {
  return `Analyse le secteur "${secteur}" dans le contexte des exonérations fiscales au Togo. 
Développe : (1) justification économique des exonérations accordées, (2) impact sur l'emploi et l'investissement, (3) risques de dérive ou d'abus identifiés, (4) comparaison avec les meilleures pratiques UEMOA.
Format : 4 paragraphes structurés, style rapport officiel.`
}

import React, { useEffect, useRef, useState, useTransition } from 'react'
import {
  AvatarConfiguration,
  AvatarPresentation,
  AvatarStructure,
  DEFAULT_AVATAR_CONFIG,
  HAIR_COLORS,
  HairColorId,
  SKIN_TONES,
  SkinToneId,
  renderAvatarToCanvas,
} from '@/services/avatarCompositor'
import { demoAdapter } from '@/services/demoAdapter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, RotateCcw, Sparkles, ShieldAlert, Layers, Palette, LayoutGrid } from 'lucide-react'

export function isBancadaAyurvedaAuthorized(): boolean {
  // Acessível apenas em desenvolvimento local ou quando o modo demonstração interno estiver ativo
  const isDev = import.meta.env.DEV
  const isDemo = demoAdapter.isEnabled()
  return Boolean(isDev || isDemo)
}

const STRUCTURE_LABELS: Record<AvatarStructure, { title: string; subtitle: string }> = {
  light_narrow: {
    title: 'Estrutura Leve / Estreita',
    subtitle: 'Ossatura fina, contornos longilíneos',
  },
  intermediate: {
    title: 'Estrutura Intermediária',
    subtitle: 'Proporções moderadas e musculatura média',
  },
  broad_solid: {
    title: 'Estrutura Ampla / Sólida',
    subtitle: 'Ossatura larga, compleição robusta',
  },
}

export function AyurvedaAvatarBancadaPage() {
  const isAuthorized = isBancadaAyurvedaAuthorized()

  const [config, setConfig] = useState<AvatarConfiguration>(DEFAULT_AVATAR_CONFIG)
  const [qaShowAllStructures, setQaShowAllStructures] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  const [, startTransition] = useTransition()

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const compLightRef = useRef<HTMLCanvasElement | null>(null)
  const compInterRef = useRef<HTMLCanvasElement | null>(null)
  const compBroadRef = useRef<HTMLCanvasElement | null>(null)

  // Render principal
  useEffect(() => {
    if (!isAuthorized) return
    let active = true

    const runRender = async () => {
      if (!mainCanvasRef.current) return
      setIsRendering(true)
      try {
        await renderAvatarToCanvas(config, mainCanvasRef.current)
      } catch (err) {
        console.error('[AyurvedaAvatarBancada] Erro ao compor avatar:', err)
      } finally {
        if (active) setIsRendering(false)
      }
    }

    runRender()
    return () => {
      active = false
    }
  }, [config, isAuthorized])

  // Render comparação QA (3 estruturas simultâneas)
  useEffect(() => {
    if (!isAuthorized || !qaShowAllStructures) return
    let active = true

    const runComparison = async () => {
      try {
        if (compLightRef.current) {
          await renderAvatarToCanvas({ ...config, structure: 'light_narrow' }, compLightRef.current)
        }
        if (compInterRef.current) {
          await renderAvatarToCanvas({ ...config, structure: 'intermediate' }, compInterRef.current)
        }
        if (compBroadRef.current) {
          await renderAvatarToCanvas({ ...config, structure: 'broad_solid' }, compBroadRef.current)
        }
      } catch (err) {
        console.error('[AyurvedaAvatarBancada] Erro na comparação QA:', err)
      }
    }

    runComparison()
    return () => {
      active = false
    }
  }, [config, qaShowAllStructures, isAuthorized])

  if (!isAuthorized) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Alert variant="destructive">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            A Bancada Visual Ayurveda é um módulo técnico interno para calibração de assets e QA.
            Ela está indisponível fora do ambiente de desenvolvimento ou sem o modo demonstração
            habilitado.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleReset = () => {
    startTransition(() => {
      setConfig(DEFAULT_AVATAR_CONFIG)
    })
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header e Aviso Regulatório */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Bancada Visual — Avatar Ayurveda (Lote 0B1)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Ambiente de calibração estética, preservação tonal e composição das máscaras canônicas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs border-amber-500/50 text-amber-700 dark:text-amber-300"
            >
              Uso Interno / QA
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 h-8 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar padrão
            </Button>
          </div>
        </div>

        {/* Banner Mandatório */}
        <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800">
          <Info className="h-4 w-4 text-amber-800 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold">
            Personalização estética — não participa da avaliação Ayurveda
          </AlertTitle>
          <AlertDescription className="text-amber-800/90 dark:text-amber-300/80 text-xs">
            Esta tela opera com zero chamadas ao banco de dados PocketBase e sem alteração de
            respostas clínicas. As variações de tom de pele e cor de cabelo não interferem nas
            determinações de dosha, Prakriti ou recomendações terapêuticas.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Controles (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Apresentação */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Apresentação
                </CardTitle>
                <CardDescription className="text-xs">
                  Alterna silhueta base feminina ou masculina
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={config.presentation}
                  onValueChange={(val) =>
                    setConfig((c) => ({ ...c, presentation: val as AvatarPresentation }))
                  }
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="feminine" className="text-xs">
                      Feminina
                    </TabsTrigger>
                    <TabsTrigger value="masculine" className="text-xs">
                      Masculina
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* 2. Tons de Pele */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Tom de Pele (6 Amostras)
                </CardTitle>
                <CardDescription className="text-xs">
                  Pigmentação aplicada sob a máscara com preservação de luz e sombras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {SKIN_TONES.map((tone) => {
                    const isSelected = config.skinTone === tone.id
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, skinTone: tone.id }))}
                        className={`flex flex-col items-center p-2 rounded-md border text-center transition-all ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-muted/50 font-medium'
                            : 'border-border hover:bg-muted/30'
                        }`}
                      >
                        <span
                          className="w-7 h-7 rounded-full shadow-xs border border-black/15 mb-1.5 shrink-0"
                          style={{ backgroundColor: tone.hex }}
                        />
                        <span className="text-[11px] leading-tight text-foreground">
                          {tone.label.split(' ')[0]} {tone.label.split(' ')[1]}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {tone.hex}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 3. Cores de Cabelo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Cor de Cabelo (6 Opções)
                </CardTitle>
                <CardDescription className="text-xs">
                  Pigmentação aplicada sob a máscara capilar canônica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {HAIR_COLORS.map((hair) => {
                    const isSelected = config.hairColor === hair.id
                    return (
                      <button
                        key={hair.id}
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, hairColor: hair.id }))}
                        className={`flex flex-col items-center p-2 rounded-md border text-center transition-all ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-muted/50 font-medium'
                            : 'border-border hover:bg-muted/30'
                        }`}
                      >
                        <span
                          className="w-7 h-7 rounded-full shadow-xs border border-black/15 mb-1.5 shrink-0"
                          style={{ backgroundColor: hair.hex }}
                        />
                        <span className="text-[11px] leading-tight text-foreground truncate max-w-full">
                          {hair.label}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {hair.hex}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 4. Estrutura Corporal (Padrão: Intermediária) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-primary" />
                  Estrutura Corporal
                </CardTitle>
                <CardDescription className="text-xs">
                  Padrão inicial: intermediária. Modo QA permite visualização lado a lado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {(['light_narrow', 'intermediate', 'broad_solid'] as AvatarStructure[]).map(
                    (struc) => {
                      const isSelected = config.structure === struc
                      const info = STRUCTURE_LABELS[struc]
                      return (
                        <button
                          key={struc}
                          type="button"
                          onClick={() => setConfig((c) => ({ ...c, structure: struc }))}
                          className={`w-full text-left p-2.5 rounded-md border transition-all ${
                            isSelected
                              ? 'border-primary ring-1 ring-primary/30 bg-primary/5'
                              : 'border-border hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">
                              {info.title}
                            </span>
                            {struc === 'intermediate' && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Padrão
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {info.subtitle}
                          </p>
                        </button>
                      )
                    },
                  )}
                </div>

                <div className="pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant={qaShowAllStructures ? 'secondary' : 'outline'}
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setQaShowAllStructures((v) => !v)}
                  >
                    {qaShowAllStructures
                      ? 'Ocultar comparação das 3 estruturas'
                      : 'Comparar as 3 estruturas lado a lado (QA)'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Preview / Canvas Principal (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 border-b border-border bg-stone-100/50 dark:bg-stone-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Composição em Tempo Real (1024×1536)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {STRUCTURE_LABELS[config.structure].title} • Apresentação{' '}
                      {config.presentation === 'feminine' ? 'Feminina' : 'Masculina'}
                    </CardDescription>
                  </div>
                  {isRendering && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      Renderizando...
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center justify-center bg-stone-900/5 dark:bg-black/30">
                <div className="relative max-w-sm w-full aspect-[2/3] rounded-lg shadow-md border border-border overflow-hidden bg-stone-100 dark:bg-stone-900 flex items-center justify-center">
                  <canvas
                    ref={mainCanvasRef}
                    className="w-full h-full object-contain pointer-events-none select-none"
                    aria-label="Avatar Ayurveda composto esteticamente"
                  />
                </div>

                <div className="mt-4 text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 justify-center">
                  <span>
                    Pele:{' '}
                    <strong>
                      {SKIN_TONES.find((s) => s.id === config.skinTone)?.label} (
                      {SKIN_TONES.find((s) => s.id === config.skinTone)?.hex})
                    </strong>
                  </span>
                  <span>
                    Cabelo:{' '}
                    <strong>
                      {HAIR_COLORS.find((h) => h.id === config.hairColor)?.label} (
                      {HAIR_COLORS.find((h) => h.id === config.hairColor)?.hex})
                    </strong>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Modo Comparação de Estruturas Lado a Lado (QA) */}
            {qaShowAllStructures && (
              <Card className="border-dashed border-primary/40">
                <CardHeader className="pb-2 bg-muted/30">
                  <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Modo QA: Comparação das Três Estruturas Corporais
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Validação visual da coerência de cores nas 3 máscaras correspondentes
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 text-center">
                      <div className="aspect-[2/3] rounded border bg-black/10 overflow-hidden">
                        <canvas ref={compLightRef} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Leve / Estreita
                      </span>
                    </div>

                    <div className="space-y-1 text-center">
                      <div className="aspect-[2/3] rounded border bg-black/10 overflow-hidden">
                        <canvas ref={compInterRef} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Intermediária
                      </span>
                    </div>

                    <div className="space-y-1 text-center">
                      <div className="aspect-[2/3] rounded border bg-black/10 overflow-hidden">
                        <canvas ref={compBroadRef} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Ampla / Sólida
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

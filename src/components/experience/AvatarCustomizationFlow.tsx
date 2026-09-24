import React, { useState, useEffect, useRef } from 'react'
import {
  AvatarPresentation,
  AvatarStructure,
  SkinToneId,
  HairColorId,
  SKIN_TONES,
  HAIR_COLORS,
  AvatarConfiguration,
  renderAvatarToCanvas,
} from '@/services/avatarCompositor'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight, ArrowLeft, RotateCcw, AlertTriangle, Check } from 'lucide-react'

export interface AvatarCustomizationResult {
  presentation: AvatarPresentation
  skinTone: SkinToneId
  hairColor: HairColorId
}

export interface AvatarCustomizationFlowProps {
  initialConfig?: Partial<AvatarCustomizationResult>
  onConfirm: (result: AvatarCustomizationResult) => void | Promise<void>
  onDefer: () => void | Promise<void>
  isEditing?: boolean
  onCancel?: () => void
}

type Step = 1 | 2 | 3 | 'confirmation'

export const AvatarCustomizationFlow: React.FC<AvatarCustomizationFlowProps> = ({
  initialConfig,
  onConfirm,
  onDefer,
  isEditing = false,
  onCancel,
}) => {
  // Estado local das escolhas
  const [step, setStep] = useState<Step>(1)
  const [selectedPresentation, setSelectedPresentation] = useState<AvatarPresentation | null>(
    initialConfig?.presentation || null,
  )
  const [comparingBoth, setComparingBoth] = useState<boolean>(false)
  const [selectedSkinTone, setSelectedSkinTone] = useState<SkinToneId>(
    initialConfig?.skinTone || 'skin_02',
  )
  const [selectedHairColor, setSelectedHairColor] = useState<HairColorId>(
    initialConfig?.hairColor || 'hair_dark_brown',
  )

  // Status de render e erro
  const [isRendering, setIsRendering] = useState<boolean>(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const compareFemCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const compareMascCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Estrutura sempre 'intermediate' nesta jornada
  const structure: AvatarStructure = 'intermediate'

  // Renderização em tempo real do avatar único
  useEffect(() => {
    let active = true
    const currentPres = selectedPresentation || 'feminine'
    const config: AvatarConfiguration = {
      presentation: currentPres,
      structure,
      skinTone: selectedSkinTone,
      hairColor: selectedHairColor,
    }

    const render = async () => {
      if (!canvasRef.current || comparingBoth) return
      setIsRendering(true)
      setRenderError(null)
      try {
        await renderAvatarToCanvas(config, canvasRef.current)
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Falha ao carregar asset visual'
          setRenderError(msg)
        }
      } finally {
        if (active) setIsRendering(false)
      }
    }

    render()
    return () => {
      active = false
    }
  }, [selectedPresentation, selectedSkinTone, selectedHairColor, comparingBoth, step])

  // Renderização do comparador lado a lado (Etapa 1: "Quero comparar as duas")
  useEffect(() => {
    if (!comparingBoth || step !== 1) return
    let active = true

    const renderComparison = async () => {
      setIsRendering(true)
      setRenderError(null)
      try {
        const femConfig: AvatarConfiguration = {
          presentation: 'feminine',
          structure,
          skinTone: selectedSkinTone,
          hairColor: selectedHairColor,
        }
        const mascConfig: AvatarConfiguration = {
          presentation: 'masculine',
          structure,
          skinTone: selectedSkinTone,
          hairColor: selectedHairColor,
        }

        if (compareFemCanvasRef.current) {
          await renderAvatarToCanvas(femConfig, compareFemCanvasRef.current)
        }
        if (compareMascCanvasRef.current) {
          await renderAvatarToCanvas(mascConfig, compareMascCanvasRef.current)
        }
      } catch (err: unknown) {
        if (active) {
          const msg =
            err instanceof Error ? err.message : 'Falha ao renderizar figuras para comparação'
          setRenderError(msg)
        }
      } finally {
        if (active) setIsRendering(false)
      }
    }

    renderComparison()
    return () => {
      active = false
    }
  }, [comparingBoth, step, selectedSkinTone, selectedHairColor])

  const handleNextFromStep1 = () => {
    if (!selectedPresentation) return
    setComparingBoth(false)
    setStep(2)
  }

  const handleNextFromStep2 = () => {
    setStep(3)
  }

  const handleNextFromStep3 = () => {
    setStep('confirmation')
  }

  const handleAdjust = () => {
    // Volta ao início mantendo escolhas atuais
    setComparingBoth(false)
    setStep(1)
  }

  const handleConfirm = async () => {
    if (!selectedPresentation) return
    setIsSubmitting(true)
    try {
      await onConfirm({
        presentation: selectedPresentation,
        skinTone: selectedSkinTone,
        hairColor: selectedHairColor,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetryRender = () => {
    setRenderError(null)
    setIsRendering(true)
    const currentPres = selectedPresentation || 'feminine'
    const config: AvatarConfiguration = {
      presentation: currentPres,
      structure,
      skinTone: selectedSkinTone,
      hairColor: selectedHairColor,
    }
    if (canvasRef.current) {
      renderAvatarToCanvas(config, canvasRef.current)
        .catch((e) => setRenderError(e instanceof Error ? e.message : 'Erro ao recarregar'))
        .finally(() => setIsRendering(false))
    }
  }

  const stepNumber = step === 'confirmation' ? 3 : step

  return (
    <div
      data-testid="avatar-customization-flow"
      className="max-w-2xl mx-auto py-6 px-4 sm:px-6 space-y-6 text-foreground"
    >
      {/* Header Acolhedor Oficial */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant="outline"
            className="text-[11px] font-normal tracking-wide uppercase border-primary/30 text-primary bg-primary/5"
          >
            {step === 'confirmation' ? 'Confirmação da Representação' : `Etapa ${stepNumber} de 3`}
          </Badge>
          {isEditing && (
            <Badge variant="secondary" className="text-[10px]">
              Edição
            </Badge>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-foreground">
          {step === 'confirmation'
            ? 'Esta é a representação que acompanhará você'
            : 'Antes de começar, monte sua representação'}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {step === 'confirmation'
            ? 'Ela serve apenas para tornar sua experiência mais próxima e pessoal. Suas escolhas visuais não interferem na avaliação do seu corpo.'
            : 'Esta figura acompanhará você durante a experiência. Escolha as características que ajudam você a se reconhecer nela. Essas escolhas servem apenas para personalizar a imagem e não fazem parte da avaliação.'}
        </p>
        {step !== 'confirmation' && (
          <p className="text-[11px] text-muted-foreground/80 italic">
            Você poderá alterar sua representação depois, sem apagar suas respostas.
          </p>
        )}
      </div>

      {/* Barra de Progresso Acolhedora */}
      <div
        className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={step === 'confirmation' ? 100 : (stepNumber / 3) * 100}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da personalização da figura"
      >
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{
            width:
              step === 'confirmation'
                ? '100%'
                : step === 1
                  ? '33.3%'
                  : step === 2
                    ? '66.6%'
                    : '100%',
          }}
        />
      </div>

      {/* Notificação de Erro se asset falhar — nunca imagem quebrada */}
      {renderError && (
        <Card className="border-destructive/40 bg-destructive/5 text-destructive">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Não foi possível carregar a imagem neste momento.</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetryRender}
              className="text-xs h-7 gap-1 border-destructive/40 hover:bg-destructive/10"
            >
              <RotateCcw className="w-3 h-3" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Visualizador do Canvas (Quando não estiver em modo comparação) */}
      {!comparingBoth && (
        <div className="flex flex-col items-center justify-center">
          <div
            className="relative w-44 sm:w-56 aspect-[2/3] rounded-xl shadow-sm border border-border/80 overflow-hidden bg-stone-100 dark:bg-stone-900 flex items-center justify-center transition-all"
            aria-label="Visualização em tempo real da representação escolhida"
          >
            <canvas
              ref={canvasRef}
              data-testid="avatar-preview-canvas"
              className="w-full h-full object-contain pointer-events-none select-none"
              aria-label="Figura intermediária personalizada"
            />
            {isRendering && (
              <div
                data-testid="avatar-rendering-badge"
                className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center"
              >
                <Badge variant="secondary" className="text-[11px] animate-pulse">
                  Montando figura...
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          ETAPA 1: ESCOLHA DA FIGURA
         ======================================================== */}
      {step === 1 && (
        <Card className="border-border/70 bg-card/80 shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-serif font-medium text-foreground">
                Qual figura você prefere usar na sua representação?
              </h2>
              <p className="text-xs text-muted-foreground">
                Selecione a silhueta que você gostaria de visualizar ao longo dos momentos.
              </p>
            </div>

            {/* Comparador das Duas Figuras Lado a Lado */}
            {comparingBoth ? (
              <div
                data-testid="avatar-compare-container"
                className="space-y-4 pt-2 border-t border-border/50"
              >
                <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Compare as duas silhuetas e escolha uma para continuar:
                </p>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Card Feminina */}
                  <button
                    type="button"
                    aria-label="Escolher Figura Feminina"
                    aria-pressed={selectedPresentation === 'feminine'}
                    onClick={() => setSelectedPresentation('feminine')}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
                      selectedPresentation === 'feminine'
                        ? 'border-primary ring-2 ring-primary/40 bg-primary/5 font-medium'
                        : 'border-border/70 hover:bg-muted/30'
                    }`}
                  >
                    <div className="w-full aspect-[2/3] rounded-lg border bg-stone-100 dark:bg-stone-900 overflow-hidden mb-2 relative">
                      <canvas
                        ref={compareFemCanvasRef}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <span>Figura feminina</span>
                      {selectedPresentation === 'feminine' && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                  </button>

                  {/* Card Masculina */}
                  <button
                    type="button"
                    aria-label="Escolher Figura Masculina"
                    aria-pressed={selectedPresentation === 'masculine'}
                    onClick={() => setSelectedPresentation('masculine')}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
                      selectedPresentation === 'masculine'
                        ? 'border-primary ring-2 ring-primary/40 bg-primary/5 font-medium'
                        : 'border-border/70 hover:bg-muted/30'
                    }`}
                  >
                    <div className="w-full aspect-[2/3] rounded-lg border bg-stone-100 dark:bg-stone-900 overflow-hidden mb-2 relative">
                      <canvas
                        ref={compareMascCanvasRef}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <span>Figura masculina</span>
                      {selectedPresentation === 'masculine' && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <Button
                  type="button"
                  variant={selectedPresentation === 'feminine' ? 'default' : 'outline'}
                  aria-pressed={selectedPresentation === 'feminine'}
                  aria-label="Selecionar Figura feminina"
                  onClick={() => {
                    setSelectedPresentation('feminine')
                    setComparingBoth(false)
                  }}
                  className="h-11 text-xs justify-between px-3.5"
                >
                  <span>Figura feminina</span>
                  {selectedPresentation === 'feminine' && (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  )}
                </Button>

                <Button
                  type="button"
                  variant={selectedPresentation === 'masculine' ? 'default' : 'outline'}
                  aria-pressed={selectedPresentation === 'masculine'}
                  aria-label="Selecionar Figura masculina"
                  onClick={() => {
                    setSelectedPresentation('masculine')
                    setComparingBoth(false)
                  }}
                  className="h-11 text-xs justify-between px-3.5"
                >
                  <span>Figura masculina</span>
                  {selectedPresentation === 'masculine' && (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  )}
                </Button>

                <Button
                  type="button"
                  variant={comparingBoth ? 'secondary' : 'outline'}
                  aria-label="Quero comparar as duas figuras lado a lado"
                  onClick={() => setComparingBoth(true)}
                  className="h-11 text-xs border-dashed justify-center px-3.5"
                >
                  <span>Quero comparar as duas</span>
                </Button>
              </div>
            )}

            {/* Ações da Etapa 1 */}
            <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDefer}
                className="text-xs text-muted-foreground hover:text-foreground order-2 sm:order-1"
              >
                Prefiro escolher depois
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                {isEditing && onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="text-xs h-9"
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={!selectedPresentation}
                  onClick={handleNextFromStep1}
                  className="text-xs h-9 gap-1.5 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <span>Avançar para tom de pele</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================
          ETAPA 2: TOM DE PELE (6 AMOSTRAS APROVADAS)
         ======================================================== */}
      {step === 2 && (
        <Card className="border-border/70 bg-card/80 shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-serif font-medium text-foreground">
                Qual tonalidade ajuda você a se reconhecer nesta representação?
              </h2>
              <p className="text-xs text-muted-foreground">
                Selecione uma das seis amostras. A figura acima se atualiza em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {SKIN_TONES.map((tone, idx) => {
                const isSelected = selectedSkinTone === tone.id
                const accessibleLabel = `Tom de pele ${idx + 1}`
                return (
                  <button
                    key={tone.id}
                    type="button"
                    role="button"
                    aria-label={accessibleLabel}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedSkinTone(tone.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium'
                        : 'border-border/70 hover:bg-muted/30'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full border border-black/15 shadow-2xs shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: tone.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-stone-900 drop-shadow" />}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-foreground truncate">{accessibleLabel}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {tone.hex}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Ações da Etapa 2 */}
            <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="text-xs h-9 gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDefer}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Prefiro escolher depois
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleNextFromStep2}
                className="text-xs h-9 gap-1.5 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 order-1 sm:order-2"
              >
                <span>Avançar para cor do cabelo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================
          ETAPA 3: COR DO CABELO (6 CORES APROVADAS)
         ======================================================== */}
      {step === 3 && (
        <Card className="border-border/70 bg-card/80 shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-serif font-medium text-foreground">
                Qual cor de cabelo você prefere na sua representação?
              </h2>
              <p className="text-xs text-muted-foreground">
                Escolha a tonalidade mais próxima do seu cabelo. A figura atualiza em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {HAIR_COLORS.map((hair) => {
                const isSelected = selectedHairColor === hair.id
                const hairLabel =
                  hair.id === 'hair_dark_brown'
                    ? 'Castanho-escuro'
                    : hair.id === 'hair_light_brown'
                      ? 'Castanho-claro'
                      : hair.id === 'hair_gray_white'
                        ? 'Grisalho ou branco'
                        : hair.label

                return (
                  <button
                    key={hair.id}
                    type="button"
                    role="button"
                    aria-label={`Cor de cabelo: ${hairLabel}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedHairColor(hair.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium'
                        : 'border-border/70 hover:bg-muted/30'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full border border-black/15 shadow-2xs shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: hair.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-foreground truncate">{hairLabel}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {hair.hex}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Ações da Etapa 3 */}
            <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="text-xs h-9 gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDefer}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Prefiro escolher depois
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleNextFromStep3}
                className="text-xs h-9 gap-1.5 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 order-1 sm:order-2"
              >
                <span>Revisar representação</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================
          TELA DE CONFIRMAÇÃO
         ======================================================== */}
      {step === 'confirmation' && (
        <Card className="border-primary/40 bg-card/90 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5 text-center">
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-lg font-serif font-medium text-foreground">
                Tudo pronto com a sua figura
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Suas preferências estéticas foram reunidas. Quando desejar começar, basta confirmar.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground max-w-sm mx-auto space-y-1 text-left">
              <div className="flex justify-between">
                <span>Silhueta:</span>
                <strong className="text-foreground">
                  {selectedPresentation === 'feminine' ? 'Feminina' : 'Masculina'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Tom de pele:</span>
                <strong className="text-foreground">
                  Tom {SKIN_TONES.findIndex((s) => s.id === selectedSkinTone) + 1}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Cor do cabelo:</span>
                <strong className="text-foreground">
                  {HAIR_COLORS.find((h) => h.id === selectedHairColor)?.label}
                </strong>
              </div>
            </div>

            {/* Ações Finais */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdjust}
                className="w-full sm:w-auto text-xs h-10 px-4"
              >
                Quero ajustar
              </Button>

              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="w-full sm:w-auto text-xs h-10 px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <span>{isSubmitting ? 'Salvando...' : 'Confirmar e começar'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
export default AvatarCustomizationFlow

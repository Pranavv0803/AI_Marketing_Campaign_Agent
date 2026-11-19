import React, { useState, useEffect } from 'react';
import { BrandKit, Persona, Concept, PieceResult, Campaign } from './types';
import {
  fetchHealth,
  fetchSampleData,
  generateConcepts,
  generatePiece,
} from './api/client';
import { Stepper } from './components/Stepper';
import { SetupView } from './components/SetupView';
import { ConceptsView } from './components/ConceptsView';
import { CampaignView } from './components/CampaignView';
import { ExportView } from './components/ExportView';
import { ErrorDialog } from './components/ErrorDialog';

export const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxStepUnlocked, setMaxStepUnlocked] = useState<number>(1);

  // Engine Mode State (Live OpenAI vs Offline Mock)
  const [isMockMode, setIsMockMode] = useState<boolean>(false);

  // Core State
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [pieces, setPieces] = useState<PieceResult[]>([]);

  // Loading & Error States
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState<boolean>(false);
  const [loadingPieces, setLoadingPieces] = useState<Record<string, boolean>>({});
  const [isRegeneratingAll, setIsRegeneratingAll] = useState<boolean>(false);
  const [isCampaignDirty, setIsCampaignDirty] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingRetryAction, setPendingRetryAction] = useState<((useMockOverride?: boolean) => void) | null>(null);

  // Check health and initialize sample data on mount
  useEffect(() => {
    fetchHealth()
      .then((h) => setIsMockMode(h.mock_mode))
      .catch(() => {});
    handleLoadSampleData();
  }, []);

  const handleToggleMockMode = () => {
    setIsMockMode((prev) => !prev);
    setIsCampaignDirty(true);
  };

  const handleLoadSampleData = async () => {
    try {
      setIsLoadingSample(true);
      const data = await fetchSampleData();
      setBrandKit(data.brand_kit);
      setPersonas(data.personas);
      setIsCampaignDirty(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample data');
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleUpdateBrandKit = (updated: BrandKit) => {
    setBrandKit(updated);
    setIsCampaignDirty(true);
  };

  const handleUpdatePersona = (index: number, updated: Persona) => {
    const next = [...personas];
    next[index] = updated;
    setPersonas(next);
    setIsCampaignDirty(true);
  };

  // Step 1 -> Step 2: Generate Concepts
  const handleProceedToConcepts = async (mockOverride?: boolean) => {
    if (!brandKit || personas.length === 0) return;
    const activeMock = mockOverride !== undefined ? mockOverride : isMockMode;
    try {
      setIsLoadingConcepts(true);
      setCurrentStep(2);
      setMaxStepUnlocked((prev) => Math.max(prev, 2));

      // If concepts not generated yet, fetch them
      if (concepts.length === 0) {
        const res = await generateConcepts(brandKit, personas, activeMock);
        setConcepts(res.concepts);
        if (res.concepts.length > 0 && !selectedConcept) {
          setSelectedConcept(res.concepts[0]);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate concepts');
      setPendingRetryAction(() => (override?: boolean) => handleProceedToConcepts(override));
    } finally {
      setIsLoadingConcepts(false);
    }
  };

  // Regenerate concepts explicitly
  const handleRegenerateConcepts = async (mockOverride?: boolean) => {
    if (!brandKit || personas.length === 0) return;
    const activeMock = mockOverride !== undefined ? mockOverride : isMockMode;
    try {
      setIsLoadingConcepts(true);
      const res = await generateConcepts(brandKit, personas, activeMock);
      setConcepts(res.concepts);
      if (res.concepts.length > 0) {
        setSelectedConcept(res.concepts[0]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to regenerate concepts');
      setPendingRetryAction(() => (override?: boolean) => handleRegenerateConcepts(override));
    } finally {
      setIsLoadingConcepts(false);
    }
  };

  // Generate 6 pieces across 3 personas (3 personas x 2 channels)
  const generateAllPiecesForConcept = async (activeConcept: Concept, mockOverride?: boolean) => {
    if (!brandKit || personas.length === 0) return;
    const activeMock = mockOverride !== undefined ? mockOverride : isMockMode;

    try {
      setIsRegeneratingAll(true);
      setCurrentStep(3);
      setMaxStepUnlocked((prev) => Math.max(prev, 3));

      // Resolve avoid angles per persona
      const allLeadAngles = personas.map((p) => p.pain_points[0] || '');

      const calls: Promise<PieceResult>[] = [];
      personas.forEach((persona) => {
        const avoids = allLeadAngles.filter((a) => a !== (persona.pain_points[0] || ''));
        // 1 social post
        calls.push(generatePiece(brandKit, persona, avoids, activeConcept, 'post', activeMock));
        // 1 email
        calls.push(generatePiece(brandKit, persona, avoids, activeConcept, 'email', activeMock));
      });

      const results = await Promise.all(calls);
      setPieces(results);
      setIsCampaignDirty(false);
      setMaxStepUnlocked((prev) => Math.max(prev, 4));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate campaign assets');
      setPendingRetryAction(() => (override?: boolean) => generateAllPiecesForConcept(activeConcept, override));
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  // Step 2 -> Step 3: Pick Concept & Generate Assets
  const handleProceedToCampaign = () => {
    if (!selectedConcept) return;
    if (pieces.length === 0 || isCampaignDirty) {
      generateAllPiecesForConcept(selectedConcept);
    } else {
      setCurrentStep(3);
    }
  };

  const handleSelectConcept = (concept: Concept) => {
    if (!selectedConcept || selectedConcept.name !== concept.name) {
      setSelectedConcept(concept);
      setIsCampaignDirty(true);
    }
  };

  // Single Piece Regeneration
  const handleRegenerateSinglePiece = async (personaId: string, channel: 'post' | 'email') => {
    if (!brandKit || !selectedConcept) return;
    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;

    const key = `${personaId}_${channel}`;
    try {
      setLoadingPieces((prev) => ({ ...prev, [key]: true }));
      const allLeadAngles = personas.map((p) => p.pain_points[0] || '');
      const avoids = allLeadAngles.filter((a) => a !== (persona.pain_points[0] || ''));

      const updated = await generatePiece(brandKit, persona, avoids, selectedConcept, channel, isMockMode);
      setPieces((prev) =>
        prev.map((p) => (p.persona_id === personaId && p.channel === channel ? updated : p))
      );
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to regenerate ${channel}`);
    } finally {
      setLoadingPieces((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Full Campaign Regeneration
  const handleRegenerateAll = () => {
    if (!selectedConcept) return;
    generateAllPiecesForConcept(selectedConcept);
  };

  const activeCampaign: Campaign | null =
    brandKit && selectedConcept
      ? {
          brand_kit: brandKit,
          personas,
          concept: selectedConcept,
          pieces,
        }
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Global Stepper Header */}
      <Stepper
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        maxStepUnlocked={maxStepUnlocked}
        isMockMode={isMockMode}
        onToggleMockMode={handleToggleMockMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
        {currentStep === 1 && brandKit && (
          <SetupView
            brandKit={brandKit}
            personas={personas}
            onUpdateBrandKit={handleUpdateBrandKit}
            onUpdatePersona={handleUpdatePersona}
            onLoadSampleData={handleLoadSampleData}
            onProceedToConcepts={() => handleProceedToConcepts()}
            isLoading={isLoadingSample || isLoadingConcepts}
          />
        )}

        {currentStep === 2 && (
          <ConceptsView
            concepts={concepts}
            selectedConcept={selectedConcept}
            onSelectConcept={handleSelectConcept}
            onRegenerateConcepts={() => handleRegenerateConcepts()}
            onBackToSetup={() => setCurrentStep(1)}
            onProceedToCampaign={handleProceedToCampaign}
            isLoading={isLoadingConcepts}
          />
        )}

        {currentStep === 3 && selectedConcept && (
          <CampaignView
            personas={personas}
            concept={selectedConcept}
            pieces={pieces}
            loadingPieces={loadingPieces}
            isRegeneratingAll={isRegeneratingAll}
            onRegeneratePiece={handleRegenerateSinglePiece}
            onRegenerateAll={handleRegenerateAll}
            onBackToConcepts={() => setCurrentStep(2)}
            onProceedToExport={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && activeCampaign && (
          <ExportView
            campaign={activeCampaign}
            onBackToCampaign={() => setCurrentStep(3)}
          />
        )}
      </main>

      {/* Error & Retry Dialog */}
      {errorMessage && (
        <ErrorDialog
          message={errorMessage}
          onRetry={() => {
            setErrorMessage(null);
            if (pendingRetryAction) pendingRetryAction();
          }}
          onSwitchToMock={() => {
            setErrorMessage(null);
            setIsMockMode(true);
            if (pendingRetryAction) pendingRetryAction(true);
          }}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
};
export default App;

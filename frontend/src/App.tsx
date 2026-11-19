import React, { useState, useEffect } from 'react';
import { BrandKit, Persona, Concept, PieceResult, Campaign } from './types';
import {
  fetchHealth,
  fetchSampleData,
  generateConcepts,
  generatePiece,
} from './api/client';
import { TitleCard } from './components/TitleCard';
import { Stepper } from './components/Stepper';
import { SetupView } from './components/SetupView';
import { ConceptsView } from './components/ConceptsView';
import { CampaignView } from './components/CampaignView';
import { ExportView } from './components/ExportView';
import { ErrorDialog } from './components/ErrorDialog';

const STORAGE_KEYS = {
  BRAND_KIT: 'sipsense_brand_kit',
  PERSONAS: 'sipsense_personas',
  CONCEPTS: 'sipsense_concepts',
  SELECTED_CONCEPT: 'sipsense_selected_concept',
  PIECES: 'sipsense_pieces',
  CURRENT_STEP: 'sipsense_current_step',
  MAX_STEP: 'sipsense_max_step',
  MOCK_MODE: 'sipsense_mock_mode',
};

const DEFAULT_ARCHETYPES: Persona[] = [
  {
    id: 'commuter',
    name: 'Alex Chen',
    role: 'Urban Daily Commuter',
    pain_points: [
      'Coffee turns lukewarm during 45-minute stop-and-go morning traffic',
      'Mugs leak coffee onto work attire and laptop bags',
      'Difficulty cleaning travel mug lids thoroughly',
    ],
    motivations: ['Punctuality', 'Professional appearance', 'Hassle-free mornings'],
    preferred_tone: 'Crisp, empathetic, and functional',
  },
  {
    id: 'freelancer',
    name: 'Maya Lin',
    role: 'Remote Tech Freelancer',
    pain_points: [
      'Forgotten coffee turns cold during deep focus coding sprints',
      'Reheated microwave coffee tastes burnt and metallic',
      'Desk clutter from bulky travel mugs',
    ],
    motivations: ['Uninterrupted focus flow', 'Minimalist aesthetics', 'Clean workspace'],
    preferred_tone: 'Thoughtful, modern, and understated',
  },
  {
    id: 'adventurer',
    name: 'Jordan Hayes',
    role: 'Weekend Trail Adventurer',
    pain_points: [
      'Hot tea loses warmth after two hours on freezing trails',
      'Fragile travel mugs dent and spill inside backpacks',
      'Heavy thermal flasks weigh down daypacks',
    ],
    motivations: ['Durability', 'Adventure readiness', 'Uncompromised hot drinks outdoors'],
    preferred_tone: 'Inspiring, rugged, and reliable',
  },
  {
    id: 'executive',
    name: 'Elena Rostova',
    role: 'Corporate Executive',
    pain_points: [
      'Lukewarm drinks between back-to-back boardroom meetings',
      'Spills in luxury car cupholders',
      'Unprofessional looking tumblers during client presentations',
    ],
    motivations: ['Executive presence', 'Flawless performance', 'Sleek luxury design'],
    preferred_tone: 'Polished, authoritative, and sophisticated',
  },
  {
    id: 'student',
    name: 'Marcus Brody',
    role: 'Graduate Student',
    pain_points: [
      'Cold coffee during all-night study sessions in the library',
      'No microwave access in university study rooms',
      'Spilling liquid on textbooks and laptops',
    ],
    motivations: ['Budget-smart reliability', 'All-night endurance', 'Academic focus'],
    preferred_tone: 'Relatable, energetic, and practical',
  },
  {
    id: 'parent',
    name: 'Sarah Jenkins',
    role: 'Busy Working Parent',
    pain_points: [
      'Never gets to finish a hot drink before school drop-off chaos',
      'Hands full juggling toddler and diaper bags',
      'Kids knocking over open mugs',
    ],
    motivations: ['Sanity in morning chaos', 'Leak-proof peace of mind', 'Reliable warmth on the go'],
    preferred_tone: 'Warm, relatable, and stress-relieving',
  },
];

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

  // Initial mount: Hydrate from localStorage or load sample data
  useEffect(() => {
    fetchHealth()
      .then((h) => {
        const savedMock = localStorage.getItem(STORAGE_KEYS.MOCK_MODE);
        if (savedMock !== null) {
          setIsMockMode(savedMock === 'true');
        } else {
          setIsMockMode(h.mock_mode);
        }
      })
      .catch(() => { });

    // Try hydrating from localStorage
    const savedBrandKit = localStorage.getItem(STORAGE_KEYS.BRAND_KIT);
    const savedPersonas = localStorage.getItem(STORAGE_KEYS.PERSONAS);
    const savedConcepts = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
    const savedSelectedConcept = localStorage.getItem(STORAGE_KEYS.SELECTED_CONCEPT);
    const savedPieces = localStorage.getItem(STORAGE_KEYS.PIECES);
    const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
    const savedMaxStep = localStorage.getItem(STORAGE_KEYS.MAX_STEP);

    if (savedBrandKit && savedPersonas) {
      try {
        const parsedKit = JSON.parse(savedBrandKit);
        const parsedPersonas = JSON.parse(savedPersonas);
        if (parsedKit && parsedPersonas && parsedPersonas.length > 0) {
          setBrandKit(parsedKit);
          setPersonas(parsedPersonas);
          if (savedConcepts) setConcepts(JSON.parse(savedConcepts));
          if (savedSelectedConcept) setSelectedConcept(JSON.parse(savedSelectedConcept));
          if (savedPieces) setPieces(JSON.parse(savedPieces));
          if (savedStep) setCurrentStep(Number(savedStep));
          if (savedMaxStep) setMaxStepUnlocked(Number(savedMaxStep));
          return;
        }
      } catch (err) {
        console.warn('Could not parse localStorage, falling back to sample defaults', err);
      }
    }

    handleLoadSampleData();
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (brandKit) {
      localStorage.setItem(STORAGE_KEYS.BRAND_KIT, JSON.stringify(brandKit));
    }
  }, [brandKit]);

  useEffect(() => {
    if (personas.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(personas));
    }
  }, [personas]);

  useEffect(() => {
    if (concepts.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(concepts));
    }
  }, [concepts]);

  useEffect(() => {
    if (selectedConcept) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_CONCEPT, JSON.stringify(selectedConcept));
    }
  }, [selectedConcept]);

  useEffect(() => {
    if (pieces.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PIECES, JSON.stringify(pieces));
    }
  }, [pieces]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAX_STEP, maxStepUnlocked.toString());
  }, [maxStepUnlocked]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOCK_MODE, isMockMode.toString());
  }, [isMockMode]);

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
      setConcepts([]);
      setSelectedConcept(null);
      setPieces([]);
      setCurrentStep(1);
      setMaxStepUnlocked(1);
      setIsCampaignDirty(true);

      // Reset persisted campaign assets to clean state
      localStorage.removeItem(STORAGE_KEYS.CONCEPTS);
      localStorage.removeItem(STORAGE_KEYS.SELECTED_CONCEPT);
      localStorage.removeItem(STORAGE_KEYS.PIECES);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
      localStorage.removeItem(STORAGE_KEYS.MAX_STEP);
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

  const handleChangePersonaCount = (newCount: number) => {
    if (newCount === personas.length || newCount < 1) return;

    if (newCount < personas.length) {
      setPersonas(personas.slice(0, newCount));
    } else {
      const addedCount = newCount - personas.length;
      const newAdditions: Persona[] = [];

      for (let i = 0; i < addedCount; i++) {
        const nextIndex = personas.length + i;
        if (nextIndex < DEFAULT_ARCHETYPES.length) {
          newAdditions.push({ ...DEFAULT_ARCHETYPES[nextIndex] });
        } else {
          newAdditions.push({
            id: `persona_${nextIndex + 1}`,
            name: `Persona ${nextIndex + 1}`,
            role: 'Target Customer',
            pain_points: [
              `Daily inconvenience facing persona ${nextIndex + 1}`,
              'Need for durable, reliable temperature control',
            ],
            motivations: ['Reliability', 'Quality design', 'Productivity'],
            preferred_tone: 'Encouraging and authentic',
          });
        }
      }
      setPersonas([...personas, ...newAdditions]);
    }
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

  // Generate pieces across all configured personas (N personas x 2 channels)
  const generateAllPiecesForConcept = async (activeConcept: Concept, mockOverride?: boolean) => {
    if (!brandKit || personas.length === 0) return;
    const activeMock = mockOverride !== undefined ? mockOverride : isMockMode;

    try {
      setIsRegeneratingAll(true);
      setCurrentStep(3);
      setMaxStepUnlocked((prev) => Math.max(prev, 3));

      // Resolve distinct lead angles per persona to avoid collisions
      const usedAngles = new Set<string>();
      const resolvedAngles = personas.map((p) => {
        const found = p.pain_points.find((pt) => pt.trim() && !usedAngles.has(pt.trim()));
        const chosen = found ? found.trim() : (p.pain_points[0]?.trim() || `Demands and lifestyle of ${p.name}`);
        usedAngles.add(chosen);
        return chosen;
      });

      const calls: Promise<PieceResult>[] = [];
      personas.forEach((persona, idx) => {
        const myLead = resolvedAngles[idx];
        const avoids = resolvedAngles.filter((a) => a !== myLead);
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
      {/* 1. Title Card Above */}
      <TitleCard
        onResetDefaults={handleLoadSampleData}
        isLoading={isLoadingSample}
      />

      {/* 2. Sticky Stepper Navigation Below */}
      <Stepper
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        maxStepUnlocked={maxStepUnlocked}
        isMockMode={isMockMode}
        onToggleMockMode={handleToggleMockMode}
      />

      {/* 3. Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
        {currentStep === 1 && brandKit && (
          <SetupView
            brandKit={brandKit}
            personas={personas}
            onUpdateBrandKit={handleUpdateBrandKit}
            onUpdatePersona={handleUpdatePersona}
            onChangePersonaCount={handleChangePersonaCount}
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

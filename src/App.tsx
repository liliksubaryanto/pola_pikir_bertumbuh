import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { LessonPlanView } from './components/LessonPlanView';
import { IdeaModal } from './components/IdeaModal';
import {
    generateCreativeIdeas,
    generateLearningObjectives,
    generateInterdisciplinaryStudies,
    generateCoreActivities,
    generateAssessmentStrategies,
    generateAnecdotalRecord,
    generateChecklistData,
    generatePedagogicalPractices,
    generateLearningPartnership,
    generateLearningEnvironment,
    generateDigitalUtilization,
    generateOpeningActivities,
    generateClosingActivities
} from './services/geminiService';
import { exportDocx } from './services/docxExporter';
import type { Activity, GeneratedIdea, LessonPlan } from './types';
import { lessonPlanData as initialLessonPlanData } from './data/lessonData';

type GenerationState = {
    isLoading: boolean;
    error: string | null;
};

const initialGenerationState: GenerationState = {
    isLoading: false,
    error: null,
};

const App: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [lessonData, setLessonData] = useState<LessonPlan>(initialLessonPlanData);

    const [generationStates, setGenerationStates] = useState({
        objectives: initialGenerationState,
        interdisciplinary: initialGenerationState,
        pedagogy: initialGenerationState,
        partnership: initialGenerationState,
        environment: initialGenerationState,
        digital: initialGenerationState,
        opening: initialGenerationState,
        activities: initialGenerationState,
        closing: initialGenerationState,
        assessment: initialGenerationState,
        anecdote: initialGenerationState,
        checklist: initialGenerationState,
    });

    const [isExportingDocx, setIsExportingDocx] = useState(false);

    const handleExportDOCX = useCallback(async () => {
        setIsExportingDocx(true);
        try {
            await exportDocx(lessonData);
        } catch (error) {
            console.error("Error exporting to DOCX:", error);
        } finally {
            setIsExportingDocx(false);
        }
    }, [lessonData]);


    const handleDataChange = useCallback((path: (string | number)[], value: any) => {
        setLessonData(prevData => {
            // Simple deep copy for this state structure
            const newData = JSON.parse(JSON.stringify(prevData));
            let current = newData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newData;
        });
    }, []);

    const createGenerationHandler = useCallback(
        (
            key: keyof typeof generationStates,
            generator: (...args: any[]) => Promise<any>,
            getArgs: (data: LessonPlan) => any[],
            onSuccess: (result: any, data: LessonPlan, updater: (path: (string | number)[], value: any) => void) => void,
            errorMessage: string
        ) => {
            return async () => {
                setGenerationStates(prev => ({ ...prev, [key]: { isLoading: true, error: null } }));
                try {
                    const args = getArgs(lessonData);
                    const result = await generator(...args);
                    onSuccess(result, lessonData, handleDataChange);
                    setGenerationStates(prev => ({ ...prev, [key]: { isLoading: false, error: null } }));
                } catch (err) {
                    console.error(`Error generating ${key}:`, err);
                    setGenerationStates(prev => ({
                        ...prev,
                        [key]: { isLoading: false, error: errorMessage },
                    }));
                }
            };
        },
        [lessonData, handleDataChange]
    );

    const handleGenerateObjectives = createGenerationHandler(
        'objectives',
        generateLearningObjectives,
        data => [data.design.capaianPembelajaran, data.class],
        (result, _, updater) => updater(['design', 'tujuanPembelajaran'], result),
        "Gagal membuat tujuan pembelajaran. Silakan coba lagi."
    );

    const handleGenerateInterdisciplinary = createGenerationHandler(
        'interdisciplinary',
        generateInterdisciplinaryStudies,
        data => [data.topic, data.class],
        (result, _, updater) => updater(['design', 'lintasDisiplinIlmu'], result),
        "Gagal membuat Lintas Disiplin Ilmu. Silakan coba lagi."
    );

    const handleGeneratePedagogy = createGenerationHandler(
        'pedagogy',
        generatePedagogicalPractices,
        data => [data.topic, data.class],
        (result, _, updater) => updater(['design', 'praktikPedagogis'], result),
        "Gagal membuat Praktik Pedagogis. Coba lagi."
    );

    const handleGeneratePartnership = createGenerationHandler(
        'partnership',
        generateLearningPartnership,
        data => [data.topic, data.class],
        (result, _, updater) => updater(['design', 'kemitraanPembelajaran'], result),
        "Gagal membuat Kemitraan Pembelajaran. Coba lagi."
    );

    const handleGenerateEnvironment = createGenerationHandler(
        'environment',
        generateLearningEnvironment,
        data => [data.topic, data.class],
        (result, _, updater) => updater(['design', 'lingkunganPembelajaran'], result),
        "Gagal membuat Lingkungan Pembelajaran. Coba lagi."
    );

    const handleGenerateDigital = createGenerationHandler(
        'digital',
        generateDigitalUtilization,
        data => [data.topic, data.class],
        (result, _, updater) => updater(['design', 'pemanfaatanDigital'], result),
        "Gagal membuat Pemanfaatan Digital. Coba lagi."
    );

    const handleGenerateOpening = createGenerationHandler(
        'opening',
        generateOpeningActivities,
        data => [data.topic, data.class],
        (result, _, updater) => updater(['experience', 'awal'], result),
        "Gagal merancang kegiatan pembuka. Silakan coba lagi."
    );

    const handleGenerateActivities = createGenerationHandler(
        'activities',
        generateCoreActivities,
        data => [data.topic, data.class, data.design.tujuanPembelajaran],
        (result, _, updater) => updater(['experience', 'inti'], result),
        "Gagal merancang kegiatan inti. Silakan coba lagi."
    );

    const handleGenerateClosing = createGenerationHandler(
        'closing',
        generateClosingActivities,
        data => [data.topic, data.class],
        (result, _, updater) => updater(['experience', 'penutup'], result),
        "Gagal merancang kegiatan penutup. Silakan coba lagi."
    );

    const handleGenerateAssessment = createGenerationHandler(
        'assessment',
        generateAssessmentStrategies,
        data => [data.topic, data.class, data.design.tujuanPembelajaran],
        (result, _, updater) => {
            updater(['assessment', 'awal'], result.awal);
            updater(['assessment', 'proses'], result.proses);
            updater(['assessment', 'akhir'], result.akhir);
        },
        "Gagal merancang strategi asesmen. Silakan coba lagi."
    );

    const handleGenerateAnecdote = createGenerationHandler(
        'anecdote',
        generateAnecdotalRecord,
        data => [data.topic, data.design.tujuanPembelajaran, data.experience.inti],
        (result, data, updater) => {
            const newRecords = [...data.assessment.anecdotalRecords, result];
            updater(['assessment', 'anecdotalRecords'], newRecords);
        },
        "Gagal membuat catatan AI. Silakan coba lagi."
    );

    const handleGenerateChecklist = createGenerationHandler(
        'checklist',
        generateChecklistData,
        data => [data.topic, data.design.tujuanPembelajaran, data.experience.inti],
        (result, _, updater) => {
            const formattedChecklist = result.map((item: any, index: number) => ({
                ...item,
                no: index + 1,
            }));
            updater(['assessment', 'checklist'], formattedChecklist);
        },
        "Gagal membuat data ceklis AI. Silakan coba lagi."
    );

    const handleOpenModal = useCallback(async (activity: Activity) => {
        setSelectedActivity(activity);
        setIsModalOpen(true);
        setIsLoading(true);
        setError(null);
        setGeneratedIdeas([]);
        try {
            const ideas = await generateCreativeIdeas(
                activity.title,
                activity.description,
                lessonData.class // Use class from state
            );
            setGeneratedIdeas(ideas);
        } catch (err) {
            console.error("Error generating ideas:", err);
            setError("Gagal mendapatkan ide dari AI. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }, [lessonData.class]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedActivity(null);
        setGeneratedIdeas([]);
        setError(null);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <Header
                onExportDOCX={handleExportDOCX}
                isExportingDocx={isExportingDocx}
                teacherName={lessonData.teacherName}
            />
            <main id="lesson-plan-content" className="container mx-auto p-4 md:p-8">
                <LessonPlanView
                    data={lessonData}
                    onGenerateIdeas={handleOpenModal}
                    onDataChange={handleDataChange}
                    onGenerateObjectives={handleGenerateObjectives}
                    isGeneratingObjectives={generationStates.objectives.isLoading}
                    objectiveError={generationStates.objectives.error}
                    onGenerateInterdisciplinary={handleGenerateInterdisciplinary}
                    isGeneratingInterdisciplinary={generationStates.interdisciplinary.isLoading}
                    interdisciplinaryError={generationStates.interdisciplinary.error}
                    onGeneratePedagogy={handleGeneratePedagogy}
                    isGeneratingPedagogy={generationStates.pedagogy.isLoading}
                    pedagogyError={generationStates.pedagogy.error}
                    onGeneratePartnership={handleGeneratePartnership}
                    isGeneratingPartnership={generationStates.partnership.isLoading}
                    partnershipError={generationStates.partnership.error}
                    onGenerateEnvironment={handleGenerateEnvironment}
                    isGeneratingEnvironment={generationStates.environment.isLoading}
                    environmentError={generationStates.environment.error}
                    onGenerateDigital={handleGenerateDigital}
                    isGeneratingDigital={generationStates.digital.isLoading}
                    digitalError={generationStates.digital.error}
                    onGenerateOpening={handleGenerateOpening}
                    isGeneratingOpening={generationStates.opening.isLoading}
                    openingError={generationStates.opening.error}
                    onGenerateActivities={handleGenerateActivities}
                    isGeneratingActivities={generationStates.activities.isLoading}
                    activitiesError={generationStates.activities.error}
                    onGenerateClosing={handleGenerateClosing}
                    isGeneratingClosing={generationStates.closing.isLoading}
                    closingError={generationStates.closing.error}
                    onGenerateAssessment={handleGenerateAssessment}
                    isGeneratingAssessment={generationStates.assessment.isLoading}
                    assessmentError={generationStates.assessment.error}
                    onGenerateAnecdote={handleGenerateAnecdote}
                    isGeneratingAnecdote={generationStates.anecdote.isLoading}
                    anecdoteError={generationStates.anecdote.error}
                    onGenerateChecklist={handleGenerateChecklist}
                    isGeneratingChecklist={generationStates.checklist.isLoading}
                    checklistError={generationStates.checklist.error}
                />
            </main>
            {isModalOpen && selectedActivity && (
                <IdeaModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    activityTitle={selectedActivity.title}
                    ideas={generatedIdeas}
                    isLoading={isLoading}
                    error={error}
                />
            )}
        </div>
    );
};

export default App;

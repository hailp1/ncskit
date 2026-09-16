import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import {
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Play
} from 'lucide-react';
import {
    LatentVariable,
    MeasurementModel,
    StructuralModel,
    StructuralPath,
    PLSSEMSettings,
    DEFAULT_PLSSEM_SETTINGS,
    validateMeasurementModel,
    validateStructuralModel
} from '@/types/plssem';
import { ConstructsStep } from './steps/ConstructsStep';
import { IndicatorsStep } from './steps/IndicatorsStep';
import { PathsStep } from './steps/PathsStep';
import { SettingsStep } from './steps/SettingsStep';
import { ReviewStep } from './steps/ReviewStep';

interface PLSSEMModelBuilderProps {
    columns: string[];
    onComplete: (
        measurement: MeasurementModel,
        structural: StructuralModel,
        settings: PLSSEMSettings
    ) => void;
    onCancel: () => void;
}

type BuilderStep = 'constructs' | 'indicators' | 'paths' | 'settings' | 'review';

export const PLSSEMModelBuilder: React.FC<PLSSEMModelBuilderProps> = ({
    columns,
    onComplete,
    onCancel
}) => {
    // State
    const [currentStep, setCurrentStep] = useState<BuilderStep>('constructs');
    const [constructs, setConstructs] = useState<LatentVariable[]>([]);
    const [paths, setPaths] = useState<StructuralPath[]>([]);
    const [settings, setSettings] = useState<PLSSEMSettings>(DEFAULT_PLSSEM_SETTINGS);

    // Editing state
    const [editingConstruct, setEditingConstruct] = useState<LatentVariable | null>(null);
    const [isAddingConstruct, setIsAddingConstruct] = useState(false);

    // Validation
    const measurementValidation = validateMeasurementModel({ constructs });
    const structuralValidation = validateStructuralModel(
        { paths },
        { constructs }
    );

    // Step navigation
    const steps: { id: BuilderStep; label: string; icon: any }[] = [
        { id: 'constructs', label: 'Define Constructs', icon: Plus },
        { id: 'indicators', label: 'Assign Indicators', icon: Edit2 },
        { id: 'paths', label: 'Structural Paths', icon: ArrowRight },
        { id: 'settings', label: 'Settings', icon: Check },
        { id: 'review', label: 'Review', icon: Play }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    const canGoNext = () => {
        switch (currentStep) {
            case 'constructs':
                return constructs.length >= 2;
            case 'indicators':
                return measurementValidation.isValid;
            case 'paths':
                return structuralValidation.isValid && paths.length >= 1;
            case 'settings':
                return true;
            case 'review':
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStep(steps[currentStepIndex + 1].id);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(steps[currentStepIndex - 1].id);
        }
    };

    const handleComplete = () => {
        if (measurementValidation.isValid && structuralValidation.isValid) {
            onComplete(
                { constructs },
                { paths },
                settings
            );
        }
    };

    // Construct management
    const handleAddConstruct = (construct: LatentVariable) => {
        setConstructs([...constructs, construct]);
        setIsAddingConstruct(false);
        setEditingConstruct(null);
    };

    const handleUpdateConstruct = (id: string, updated: LatentVariable) => {
        setConstructs(constructs.map(c => c.id === id ? updated : c));
        setEditingConstruct(null);
    };

    const handleDeleteConstruct = (id: string) => {
        setConstructs(constructs.filter(c => c.id !== id));
        // Also remove paths involving this construct
        setPaths(paths.filter(p =>
            p.from !== constructs.find(c => c.id === id)?.name &&
            p.to !== constructs.find(c => c.id === id)?.name
        ));
    };

    // Path management
    const handleAddPath = (path: StructuralPath) => {
        setPaths([...paths, path]);
    };

    const handleDeletePath = (id: string) => {
        setPaths(paths.filter(p => p.id !== id));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Progress Steps */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = step.id === currentStep;
                            const isCompleted = idx < currentStepIndex;

                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center">
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center
                                            ${isActive ? 'bg-blue-600 text-white' : ''}
                                            ${isCompleted ? 'bg-green-600 text-white' : ''}
                                            ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                                        `}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className={`
                                            mt-2 text-sm font-medium
                                            ${isActive ? 'text-blue-600' : ''}
                                            ${isCompleted ? 'text-green-600' : ''}
                                            ${!isActive && !isCompleted ? 'text-gray-500' : ''}
                                        `}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className={`
                                            flex-1 h-1 mx-4
                                            ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                                        `} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Step Content */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {steps.find(s => s.id === currentStep)?.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Step content will be rendered here */}
                    {currentStep === 'constructs' && (
                        <ConstructsStep
                            constructs={constructs}
                            onAdd={() => setIsAddingConstruct(true)}
                            onEdit={setEditingConstruct}
                            onDelete={handleDeleteConstruct}
                            isAdding={isAddingConstruct}
                            editing={editingConstruct}
                            onSave={handleAddConstruct}
                            onUpdate={handleUpdateConstruct}
                            onCancelEdit={() => {
                                setIsAddingConstruct(false);
                                setEditingConstruct(null);
                            }}
                        />
                    )}

                    {currentStep === 'indicators' && (
                        <IndicatorsStep
                            constructs={constructs}
                            columns={columns}
                            onUpdate={setConstructs}
                            validation={measurementValidation}
                        />
                    )}

                    {currentStep === 'paths' && (
                        <PathsStep
                            constructs={constructs}
                            paths={paths}
                            onAddPath={handleAddPath}
                            onDeletePath={handleDeletePath}
                            validation={structuralValidation}
                        />
                    )}

                    {currentStep === 'settings' && (
                        <SettingsStep
                            settings={settings}
                            onUpdate={setSettings}
                        />
                    )}

                    {currentStep === 'review' && (
                        <ReviewStep
                            measurement={{ constructs }}
                            structural={{ paths }}
                            settings={settings}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <button type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Cancel
                </button>

                <div className="flex gap-3">
                    {currentStepIndex > 0 && (
                        <button type="button"
                            onClick={handleBack}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}

                    {currentStep !== 'review' ? (
                        <button type="button"
                            onClick={handleNext}
                            disabled={!canGoNext()}
                            className={`
                                px-6 py-2 rounded-lg flex items-center gap-2
                                ${canGoNext()
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }
                            `}
                        >
                            Next
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="button"
                            onClick={handleComplete}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Play className="w-4 h-4" />
                            Run Analysis
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};



'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import BulkImport from '@/components/transactions/BulkImport';
import { 
  FileText, 
  Upload, 
  Plus, 
  CheckCircle, 
  ArrowRight,
  Info,
  Download
} from 'lucide-react';

interface ManualSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const setupSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Manual Data Entry',
    description: 'Set up your financial tracking with manual data entry.',
    icon: FileText
  },
  {
    id: 'import',
    title: 'Import Existing Data',
    description: 'Import your existing transactions from CSV files.',
    icon: Upload
  },
  {
    id: 'add',
    title: 'Add Your First Transaction',
    description: 'Learn how to add transactions manually.',
    icon: Plus
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start tracking your finances with CashPilot.',
    icon: CheckCircle
  }
];

export default function ManualSetup({ onComplete, onSkip }: ManualSetupProps) {
  const { user } = useAuth();
  const { addNotification } = useData();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [hasImportedData, setHasImportedData] = useState(false);

  const handleNext = () => {
    if (currentStep < setupSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImportSuccess = () => {
    setHasImportedData(true);
    setShowBulkImport(false);
    addNotification({
      type: 'success',
      title: 'Data Imported',
      message: 'Your transactions have been successfully imported.'
    });
  };

  const downloadSampleData = () => {
    const sampleData = `date,amount,description,category,type
2024-01-15,1500.00,Client Payment - Project A,Client Services,income
2024-01-16,-250.00,Office Supplies,Office Supplies,expense
2024-01-17,500.00,Consulting Fee,Client Services,income
2024-01-18,-75.50,Software Subscription,Software & Subscriptions,expense
2024-01-19,2000.00,Product Sale,Product Sales,income
2024-01-20,-1200.00,Payroll,Payroll,expense
2024-01-21,800.00,Service Contract,Client Services,income
2024-01-22,-45.00,Travel Expense,Travel & Meals,expense`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    const step = setupSteps[currentStep];
    const Icon = step.icon;

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Icon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {step.title}
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                {step.description}
              </p>
              <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                You can import existing data from CSV files or start adding transactions manually. 
                CashPilot will help you categorize and analyze your financial data.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Getting Started Tips</p>
                  <ul className="space-y-1">
                    <li>• Import your bank statements as CSV files</li>
                    <li>• Use consistent categories for better insights</li>
                    <li>• Add tags to group related transactions</li>
                    <li>• You can always connect integrations later</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'import':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <Icon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {step.title}
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                {step.description}
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setShowBulkImport(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-5 w-5 mr-2" />
                Import CSV File
              </button>
              
              <div className="text-sm text-gray-500">
                or
              </div>
              
              <button
                onClick={downloadSampleData}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Sample Data
              </button>
            </div>
            
            {hasImportedData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    Data imported successfully!
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 'add':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Icon className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {step.title}
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                {step.description}
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="text-left space-y-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Go to Transactions</p>
                    <p className="text-xs text-gray-500">Navigate to the Transactions page in your dashboard</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Click the + Button</p>
                    <p className="text-xs text-gray-500">Click the "+" button to add a new transaction</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fill in the Details</p>
                    <p className="text-xs text-gray-500">Enter the transaction details and save</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <Icon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {step.title}
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                {step.description}
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="text-sm text-green-800">
                <p className="font-medium mb-2">What's Next?</p>
                <ul className="space-y-1 text-left">
                  <li>• Start adding your transactions</li>
                  <li>• Explore the dashboard and analytics</li>
                  <li>• Set up recurring transactions</li>
                  <li>• Connect integrations when ready</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showBulkImport) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <BulkImport onClose={() => setShowBulkImport(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {setupSteps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / setupSteps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / setupSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div>
          {onSkip && currentStep === 0 && (
            <button
              onClick={onSkip}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip Setup
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}
          
          <button
            onClick={handleNext}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {currentStep === setupSteps.length - 1 ? 'Get Started' : 'Next'}
            {currentStep < setupSteps.length - 1 && (
              <ArrowRight className="h-4 w-4 ml-2" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

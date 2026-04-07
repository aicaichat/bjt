import React from 'react';
import { Link } from 'react-router-dom';
import UIComponentsExample from './ui-components-example';

const GuideIndex: React.FC = () => {
  // State to control whether to show the full example or just links
  const [showExample, setShowExample] = React.useState(false);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">BJT Product Management System Developer Guide</h1>
      
      <div className="card mb-6">
        <div className="card-body">
          <h2 className="text-2xl font-semibold mb-4">Available Documentation</h2>
          <ul className="space-y-2">
            <li>
              <a 
                href="/guide/ui-components.md" 
                target="_blank"
                className="text-primary hover:text-primary-dark underline"
              >
                UI Components Guide
              </a>
              <p className="text-text-secondary mt-1">
                Comprehensive documentation for all UI components and styles available in the project.
              </p>
            </li>
            {/* Add more documentation links as they become available */}
          </ul>
        </div>
      </div>
      
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">UI Components Example</h2>
          <button 
            className="btn btn-sm btn-outline"
            onClick={() => setShowExample(!showExample)}
          >
            {showExample ? 'Hide Example' : 'Show Example'}
          </button>
        </div>
        <div className="card-body">
          <p className="mb-4">
            This example demonstrates all UI components available in the project. You can use it as a reference
            when implementing components in your application.
          </p>
          
          {!showExample && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowExample(true)}
            >
              View UI Components Example
            </button>
          )}
        </div>
      </div>
      
      {showExample && <UIComponentsExample />}
      
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-semibold mb-4">Developer Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-medium mb-2">Project Structure</h3>
              <p className="text-text-secondary">
                Learn about the project structure and how files are organized.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">API Documentation</h3>
              <p className="text-text-secondary">
                Information about the API endpoints and data structures used in the project.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Development Workflow</h3>
              <p className="text-text-secondary">
                Guide to the development workflow, including branching, testing, and deployment.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Design System</h3>
              <p className="text-text-secondary">
                Overview of the design system, including colors, typography, and spacing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideIndex; 